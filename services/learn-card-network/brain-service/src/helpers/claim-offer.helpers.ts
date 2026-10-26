import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    JWEValidator,
    RecordProvisioningBindingMetadataValidator,
    VCValidator,
    type VC,
    type VP,
} from '@learncard/types';
import cache from '@cache';
import { neogma } from '@instance';
import { storeCredential } from '@accesslayer/credential/create';
import { getProfileByDid, getProfileByProfileId } from '@accesslayer/profile/read';
import { getCredentialUri } from '@helpers/credential.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { getEmptyLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { enforceRateLimits } from '@helpers/rateLimit.helpers';
import { apiBaseUrl } from '@helpers/uri.helpers';
import {
    buildRecordCredential,
    findDeliveredCredentialUri,
    resolveRecordIssuer,
    writeIssuanceOutcome,
    type ProvisionedRecordIssuance,
} from '@helpers/platform-issuance.helpers';
import type { IssuanceOutcome } from '@helpers/issuers/types';

/**
 * EducationOS claim offers (RFC 2026-10 neutrality N3): a Binding declaring delivery 'offer'
 * signs nothing at release. The learner's wallet redeems the offer over VC-API DID
 * authentication, and only a wallet bound to the record's learner can. The offer link is not
 * a bearer token: a forwarded link is useless without the learner's key. Signing happens once
 * per record, under a durable Neo4j lease, and the claimed credential is kept for re-delivery.
 */
export const CLAIM_WORKFLOW_ID = 'educationos-claim';
export const OFFER_TTL_DAYS = 14;
export const CHALLENGE_TTL_SECONDS = 15 * 60;
export const CLAIM_LEASE_SECONDS = 120;
/** Authenticated claims per offer per minute: only the learner's own key can spend these. */
export const CLAIMS_PER_OFFER_PER_MINUTE = 30;

/** 32 random bytes, base64url: the exchange id. Anything else is never looked up. */
const OFFER_ID = /^[A-Za-z0-9_-]{43}$/;

const NOT_FOUND = (): TRPCError =>
    new TRPCError({ code: 'NOT_FOUND', message: 'Claim offer not found.' });
const INVALID = (): TRPCError =>
    new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid claim presentation.' });
const NOT_COMPLETED = (): TRPCError =>
    new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Claim could not be completed.' });

/** The POSTable VC-API exchange URL a wallet redeems. */
export const offerExchangeUrl = (domain: string, offerId: string): string =>
    `${apiBaseUrl(domain)}/workflows/${CLAIM_WORKFLOW_ID}/exchanges/${offerId}`;

const nonceKey = (offerId: string, nonce: string): string =>
    `${CLAIM_WORKFLOW_ID}|${offerId}|${nonce}`;

const OfferedRecordValidator = z.object({
    id: z.string(),
    bindingId: z.string(),
    ecosystemId: z.string(),
    subjectProfileId: z.string(),
    issuanceStatus: z.string(),
    deliveryChannel: z.string().nullable(),
    offerExpiresAt: z.string().nullable(),
    claimedByDid: z.string().nullable(),
    bindingActive: z.boolean(),
});
type OfferedRecord = z.infer<typeof OfferedRecordValidator>;

const readOfferedRecord = async (offerId: string): Promise<OfferedRecord | null> => {
    if (!OFFER_ID.test(offerId)) return null;
    const result = await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord {offerId: $offerId})
         OPTIONAL MATCH (b:Binding {bindingId: r.bindingId})
         RETURN r.id AS id, r.bindingId AS bindingId, r.ecosystemId AS ecosystemId,
                r.subjectProfileId AS subjectProfileId, r.issuanceStatus AS issuanceStatus,
                r.deliveryChannel AS deliveryChannel, r.offerExpiresAt AS offerExpiresAt,
                r.claimedByDid AS claimedByDid,
                coalesce(b.status = 'ACTIVE', false) AS bindingActive LIMIT 1`,
        { offerId }
    );
    const row = result.records[0];
    if (!row) return null;
    const parsed = OfferedRecordValidator.safeParse(row.toObject());
    return parsed.success ? parsed.data : null;
};

const isClaimed = (record: OfferedRecord): boolean =>
    record.issuanceStatus === 'ISSUED' && record.deliveryChannel === 'offer';

/**
 * An offer a wallet may still talk to: its Binding is ACTIVE, it is unexpired, and it is
 * offered, being claimed, or claimed. A revoked Binding also stops re-delivery of a claim.
 */
const isRedeemable = (record: OfferedRecord, now: string): boolean =>
    record.bindingActive &&
    record.deliveryChannel === 'offer' &&
    record.offerExpiresAt !== null &&
    now < record.offerExpiresAt &&
    (record.issuanceStatus === 'OFFERED' ||
        record.issuanceStatus === 'CLAIMING' ||
        isClaimed(record));

const audit = async (
    record: Pick<OfferedRecord, 'bindingId' | 'ecosystemId'>,
    action: string,
    afterSummary: Record<string, unknown>
): Promise<void> => {
    await neogma.queryRunner.run(
        `CREATE (:InstallIntentAuditEvent {id: $auditId, action: $action,
             ecosystemId: $ecosystemId, bindingId: $bindingId, timestamp: $now,
             afterSummary: $afterSummary})`,
        {
            auditId: `install_intent_audit_${randomUUID()}`,
            action,
            ecosystemId: record.ecosystemId,
            bindingId: record.bindingId,
            now: new Date().toISOString(),
            afterSummary: JSON.stringify(afterSummary),
        }
    );
};

/**
 * Who may claim a record: today, the wallet whose DID is the learner's own LearnCard Profile
 * DID. The single extension point for a later rule (e.g. wallet DIDs a learner has linked).
 */
export const holderMayClaim = async (
    holderDid: string,
    subjectProfileId: string
): Promise<boolean> => (await getProfileByDid(holderDid))?.profileId === subjectProfileId;

/**
 * Offer-mode Platform Issuance: validates the issuer, subject and template, then records a
 * durable offer before its link leaves brain. Idempotent: a retry reuses the same offer.
 */
export const issueRecordOffer = async (
    input: ProvisionedRecordIssuance
): Promise<IssuanceOutcome> => {
    const fail = async (reason: string): Promise<IssuanceOutcome> => {
        const result = { status: 'ISSUE_FAILED' as const, reason };
        try {
            // Never downgrade an offer that is being, or has been, claimed.
            await writeIssuanceOutcome(input, result, ['PENDING', 'ISSUE_FAILED', 'OFFERED']);
        } catch (error) {
            console.error('Claim offer status write failed', error);
        }
        return result;
    };

    try {
        const delivered = await findDeliveredCredentialUri(input.recordId, input.domain);
        if (delivered) {
            const result = { status: 'ISSUED' as const, credentialUri: delivered };
            await writeIssuanceOutcome(input, result, ['PENDING', 'ISSUE_FAILED']);
            return result;
        }

        const issuer = await resolveRecordIssuer(input.ecosystemId, input.issuance);
        if (typeof issuer === 'string') return await fail(issuer);
        const subject = await getProfileByProfileId(input.subjectProfileId);
        if (!subject) return await fail('Subject Profile missing.');
        // A broken template must fail at release, not when the learner claims.
        buildRecordCredential({
            ...input,
            issuer,
            subjectDid: getDidWeb(input.domain, subject.profileId),
        });
    } catch (error) {
        console.error('Claim offer preparation failed', error);
        const kind = error instanceof Error ? error.name : 'UnknownError';
        return fail(`Rendering failed (${kind}).`);
    }

    const now = new Date();
    const offered = await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord {id: $recordId})
         WHERE r.issuanceStatus IN ['PENDING', 'ISSUE_FAILED', 'OFFERED']
         WITH r, r.issuanceStatus <> 'OFFERED' AS fresh
         SET r.offerId = coalesce(r.offerId, $newOfferId),
             r.offerExpiresAt = coalesce(r.offerExpiresAt,
                 CASE WHEN r.expiresAt IS NULL OR $ttlExpiry < r.expiresAt
                      THEN $ttlExpiry ELSE r.expiresAt END),
             r.deliveryChannel = 'offer', r.issuanceStatus = 'OFFERED'
         FOREACH (_ IN CASE WHEN fresh THEN [1] ELSE [] END |
             CREATE (:InstallIntentAuditEvent {id: $auditId,
                 action: 'RECORD_CREDENTIAL_OFFERED', ecosystemId: $ecosystemId,
                 bindingId: $bindingId, timestamp: $now,
                 afterSummary: $summaryPrefix + r.offerExpiresAt + '"}'}))
         RETURN r.offerId AS offerId`,
        {
            recordId: input.recordId,
            newOfferId: randomBytes(32).toString('base64url'),
            ttlExpiry: new Date(now.getTime() + OFFER_TTL_DAYS * 86_400_000).toISOString(),
            auditId: `install_intent_audit_${randomUUID()}`,
            ecosystemId: input.ecosystemId,
            bindingId: input.bindingId,
            now: now.toISOString(),
            // JSON-encoded here; only the ISO expiry is appended in Cypher. Never the offerId.
            summaryPrefix: `${JSON.stringify({
                recordId: input.recordId,
                subjectProfileId: input.subjectProfileId,
            }).slice(0, -1)},"offerExpiresAt":"`,
        }
    );
    const offerId: unknown = offered.records[0]?.get('offerId');
    if (typeof offerId === 'string') {
        return {
            status: 'OFFERED',
            offer: { protocol: 'vc-api', uri: offerExchangeUrl(input.domain, offerId) },
        };
    }

    // Not offerable from its current state: report what the record already is.
    const current = await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord {id: $recordId})
         RETURN r.issuanceStatus AS status, r.offerId AS offerId, r.credentialUri AS uri`,
        { recordId: input.recordId }
    );
    const row = current.records[0];
    const status: unknown = row?.get('status');
    const existingOfferId: unknown = row?.get('offerId');
    const uri: unknown = row?.get('uri');
    if (status === 'CLAIMING' && typeof existingOfferId === 'string') {
        return {
            status: 'OFFERED',
            offer: { protocol: 'vc-api', uri: offerExchangeUrl(input.domain, existingOfferId) },
        };
    }
    if (status === 'ISSUED' && typeof uri === 'string') {
        return { status: 'ISSUED', credentialUri: uri };
    }
    return { status: 'ISSUE_FAILED', reason: 'The record cannot be offered from its state.' };
};

/** VC-API step 1: a fresh, single-use DID-authentication challenge for this offer. */
export const claimOfferRequest = async (offerId: string, domain: string) => {
    const record = await readOfferedRecord(offerId);
    if (!record || !isRedeemable(record, new Date().toISOString())) throw NOT_FOUND();

    const nonce = randomUUID();
    await cache.set(nonceKey(offerId, nonce), '1', CHALLENGE_TTL_SECONDS);

    return {
        verifiablePresentationRequest: {
            query: [{ type: 'DIDAuthentication' }],
            challenge: `${offerId}:${nonce}`,
            domain,
        },
    };
};

/** The credential stored at claim, decrypted for an idempotent re-delivery to its holder. */
const readClaimedCredential = async (offerId: string): Promise<VC> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:ProvisionedRecord {offerId: $offerId})-[:CLAIMED_AS]->(c:Credential)
         RETURN c.credential AS credential LIMIT 1`,
        { offerId }
    );
    const stored: unknown = result.records[0]?.get('credential');
    if (typeof stored !== 'string') throw NOT_COMPLETED();
    const learnCard = await getLearnCard();
    const decrypted = await learnCard.invoke.decryptDagJwe<unknown>(
        JWEValidator.parse(JSON.parse(stored))
    );
    return VCValidator.parse(decrypted);
};

const LeasedRecordValidator = z.object({
    id: z.string(),
    bindingId: z.string(),
    ecosystemId: z.string(),
    subjectProfileId: z.string(),
    fields: z.string(),
});

/**
 * Leases the offer to one attempt. Taking the node write lock before re-checking makes the
 * lease exactly-once under concurrency (pattern: finalizeAndWipeInboxCredential). Expiry is
 * part of the predicate here and again at finalize, so a claim cannot race past retention.
 */
export const leaseRecordClaim = async (
    offerId: string,
    holderDid: string,
    attemptId: string,
    now = new Date()
): Promise<z.infer<typeof LeasedRecordValidator> | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord {offerId: $offerId})
         SET r._claimLock = true REMOVE r._claimLock
         WITH r
         WHERE r.offerExpiresAt > $now
           AND (r.issuanceStatus = 'OFFERED'
             OR (r.issuanceStatus = 'CLAIMING' AND r.claimLeaseUntil < $now))
         SET r.issuanceStatus = 'CLAIMING', r.claimLeaseUntil = $leaseUntil,
             r.claimNonce = $attemptId, r.claimingDid = $holderDid
         RETURN r.id AS id, r.bindingId AS bindingId, r.ecosystemId AS ecosystemId,
                r.subjectProfileId AS subjectProfileId, r.fields AS fields`,
        {
            offerId,
            holderDid,
            attemptId,
            now: now.toISOString(),
            leaseUntil: new Date(now.getTime() + CLAIM_LEASE_SECONDS * 1000).toISOString(),
        }
    );
    const row = result.records[0];
    if (!row) return null;
    const parsed = LeasedRecordValidator.safeParse(row.toObject());
    return parsed.success ? parsed.data : null;
};

/**
 * Completes a leased claim in one transaction: stores the VC encrypted to brain's own key,
 * links it to the record and marks the record ISSUED. Only the attempt holding the lease can
 * finalize, and only before the offer and the record's retention expire; returns null (and
 * writes nothing) for a lost or stale lease or an expired offer.
 */
export const finalizeRecordClaim = async (input: {
    record: Pick<OfferedRecord, 'id' | 'subjectProfileId'>;
    offerId: string;
    attemptId: string;
    holderDid: string;
    credential: VC;
    domain: string;
}): Promise<string | null> => {
    const learnCard = await getLearnCard();
    const jwe = await learnCard.invoke.createDagJwe(input.credential, [learnCard.id.did()]);
    const session = neogma.driver.session();
    const transaction = session.beginTransaction({ timeout: 30_000 });
    try {
        const instance = await storeCredential(jwe, transaction);
        const credentialUri = getCredentialUri(instance.id, input.domain);
        const now = new Date().toISOString();
        const finalized = await transaction.run(
            `MATCH (r:ProvisionedRecord {offerId: $offerId})
             SET r._claimLock = true REMOVE r._claimLock
             WITH r
             WHERE r.claimNonce = $attemptId AND r.issuanceStatus = 'CLAIMING'
               AND r.offerExpiresAt > $now AND (r.expiresAt IS NULL OR r.expiresAt > $now)
             MATCH (c:Credential {id: $credentialId})
             SET r.issuanceStatus = 'ISSUED', r.credentialUri = $credentialUri,
                 r.issuedAt = $now, r.claimedAt = $now, r.claimedByDid = $holderDid
             REMOVE r.claimLeaseUntil, r.claimNonce, r.claimingDid
             CREATE (r)-[:CLAIMED_AS]->(c)
             CREATE (:InstallIntentAuditEvent {id: $auditId,
                 action: 'RECORD_CREDENTIAL_ISSUED', ecosystemId: r.ecosystemId,
                 bindingId: r.bindingId, timestamp: $now,
                 afterSummary: $afterSummary})
             RETURN count(r) AS count`,
            {
                offerId: input.offerId,
                attemptId: input.attemptId,
                credentialId: instance.id,
                credentialUri,
                holderDid: input.holderDid,
                now,
                auditId: `install_intent_audit_${randomUUID()}`,
                afterSummary: JSON.stringify({
                    recordId: input.record.id,
                    subjectProfileId: input.record.subjectProfileId,
                    credentialUri,
                    deliveredVia: 'offer',
                }),
            }
        );
        if (Number(finalized.records[0]?.get('count')) !== 1) {
            await transaction.rollback();
            return null;
        }
        await transaction.commit();
        return credentialUri;
    } catch (error) {
        await transaction
            .rollback()
            .catch(rollbackError =>
                console.error('Failed to roll back claim finalization', rollbackError)
            );
        throw error;
    } finally {
        await session
            .close()
            .catch(error => console.error('Failed to close claim finalization session', error));
    }
};

/**
 * Returns a leased offer to OFFERED. Only the attempt holding the lease can release it;
 * returns whether it did, so a lease already taken over (or claimed) is not reported failed.
 */
export const releaseRecordClaim = async (offerId: string, attemptId: string): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord {offerId: $offerId})
         WHERE r.claimNonce = $attemptId AND r.issuanceStatus = 'CLAIMING'
         SET r.issuanceStatus = 'OFFERED'
         REMOVE r.claimLeaseUntil, r.claimNonce, r.claimingDid
         RETURN count(r) AS count`,
        { offerId, attemptId }
    );
    return Number(result.records[0]?.get('count')) === 1;
};

/**
 * Whether `holderDid` is the same learner who claimed. A learner's wallet may present either
 * its did:key or its local did:web; both resolve to the same Profile, so compare Profiles.
 */
const isSameClaimant = async (holderDid: string, claimedByDid: string | null): Promise<boolean> => {
    if (!claimedByDid) return false;
    if (claimedByDid === holderDid) return true;
    const [holder, claimant] = await Promise.all([
        getProfileByDid(holderDid),
        getProfileByDid(claimedByDid),
    ]);
    return Boolean(holder && claimant && holder.profileId === claimant.profileId);
};

/** Re-delivers the stored credential to the holder that claimed it, else fails generically. */
const redeliverToClaimant = async (offerId: string, holderDid: string): Promise<VC> => {
    const record = await readOfferedRecord(offerId);
    if (
        record &&
        isRedeemable(record, new Date().toISOString()) &&
        isClaimed(record) &&
        (await isSameClaimant(holderDid, record.claimedByDid))
    ) {
        return readClaimedCredential(offerId);
    }
    throw NOT_FOUND();
};

/**
 * Protocol-neutral redemption core: given an authenticated, bound holder, leases the offer,
 * signs once as the ecosystem issuer with the holder as subject, and records the claim. A
 * future OID4VCI or wallet-claim front end calls this after its own holder authentication.
 */
export const redeemOffer = async (
    offerId: string,
    holderDid: string,
    attemptId: string,
    domain: string
): Promise<VC> => {
    const leased = await leaseRecordClaim(offerId, holderDid, attemptId);
    // Lost the lease: a concurrent attempt by the same holder may already have claimed it.
    if (!leased) return redeliverToClaimant(offerId, holderDid);

    try {
        const binding = await neogma.queryRunner.run(
            `MATCH (b:Binding {bindingId: $bindingId}) WHERE b.status = 'ACTIVE'
             RETURN b.capabilityMetadata AS metadata`,
            { bindingId: leased.bindingId }
        );
        const metadata = RecordProvisioningBindingMetadataValidator.parse(
            JSON.parse(String(binding.records[0]?.get('metadata') ?? 'null'))
        );
        if (!metadata.issuance) throw new Error('The Binding no longer declares issuance.');
        const issuer = await resolveRecordIssuer(leased.ecosystemId, metadata.issuance);
        if (typeof issuer === 'string') throw new Error(issuer);

        const unsigned = buildRecordCredential({
            recordId: leased.id,
            ecosystemId: leased.ecosystemId,
            fields: z.record(z.string(), z.string()).parse(JSON.parse(leased.fields)),
            issuance: metadata.issuance,
            issuer,
            subjectDid: holderDid,
            domain,
        });
        // Unencrypted (LC-2201 precedent), because the LearnCard app's VC-API client reads
        // plaintext VCs only. Residual risk: the response goes to whoever POSTs a valid VP. A
        // wallet that signs a relayed VPR without checking its domain against the exchange
        // origin lets the relaying party read the learner's credential (never one issued to
        // the relayer). Encrypting to the holder's keyAgreement key closes this once wallets
        // can decrypt exchange responses.
        const issued = await issueCredentialWithSigningAuthority(
            { type: 'profile', profile: issuer.profile },
            unsigned,
            issuer.signingAuthority,
            domain,
            false
        );
        const credential = VCValidator.parse(issued.credential);

        const credentialUri = await finalizeRecordClaim({
            record: leased,
            offerId,
            attemptId,
            holderDid,
            credential,
            domain,
        });
        if (!credentialUri) throw new Error('The claim lease was lost before finalization.');

        return credential;
    } catch (error) {
        console.error('Claim offer redemption failed', error);
        const released = await releaseRecordClaim(offerId, attemptId).catch(releaseError => {
            console.error('Failed to release claim lease', releaseError);
            return true;
        });
        // A lease another attempt took over (and may have finalized) is not this record's
        // outcome: auditing a failure there would contradict an issued record.
        if (released) {
            await audit(leased, 'RECORD_CREDENTIAL_ISSUE_FAILED', {
                recordId: leased.id,
                subjectProfileId: leased.subjectProfileId,
                reason: 'Claim could not be completed.',
                deliveredVia: 'offer',
            }).catch(auditError => console.error('Failed to audit claim failure', auditError));
        }
        throw NOT_COMPLETED();
    }
};

/**
 * VC-API step 2. Proof checks mirror the consent exchange (consent-exchange.helpers.ts,
 * completeConsentExchange); they are copied rather than shared to keep that path untouched.
 * The challenge is consumed atomically before verification, and the holder must be bound to
 * the record's learner before anything is leased or signed.
 */
export const completeClaimOffer = async (
    offerId: string,
    presentation: VP,
    domain: string
): Promise<VC> => {
    const record = await readOfferedRecord(offerId);
    if (!record || !isRedeemable(record, new Date().toISOString())) throw NOT_FOUND();

    const proofs = Array.isArray(presentation.proof) ? presentation.proof : [presentation.proof];
    const proof = proofs[0];
    const holder = presentation.holder;
    const challenge = typeof proof?.challenge === 'string' ? proof.challenge : '';
    const nonce = challenge.startsWith(`${offerId}:`) ? challenge.slice(offerId.length + 1) : '';
    // The signing key must be the holder's own: the credential is issued to `holder`.
    const signer =
        typeof proof?.verificationMethod === 'string' ? proof.verificationMethod.split('#')[0] : '';
    if (
        proofs.length !== 1 ||
        !holder ||
        !nonce ||
        proof?.proofPurpose !== 'authentication' ||
        signer !== holder
    ) {
        throw INVALID();
    }

    // Atomic single use: only the first presentation for a minted challenge proceeds.
    const key = nonceKey(offerId, nonce);
    if (
        (await cache.get(key)) !== '1' ||
        (await cache.incr(`${key}|used`, CHALLENGE_TTL_SECONDS)) !== 1
    ) {
        throw NOT_FOUND();
    }

    const verification = await (
        await getEmptyLearnCard()
    ).invoke.verifyPresentation(presentation, {
        challenge,
        domain,
        proofPurpose: 'authentication',
    });
    if (verification.errors.length > 0 || !verification.checks.includes('proof')) {
        throw INVALID();
    }

    if (!(await holderMayClaim(holder, record.subjectProfileId))) {
        // The raw DID of someone who is not the learner is never stored.
        await audit(record, 'RECORD_CREDENTIAL_CLAIM_DENIED', {
            recordId: record.id,
            holderDidSha256: createHash('sha256').update(holder).digest('hex'),
        });
        throw INVALID();
    }

    // Counted only after the learner authenticates, so a forwarded link cannot exhaust it.
    await enforceRateLimits([
        {
            key: `claim-offer:claimant:${offerId}`,
            limit: CLAIMS_PER_OFFER_PER_MINUTE,
            windowSeconds: 60,
            description: 'claims per claim offer',
        },
    ]);

    if (isClaimed(record)) {
        if (!(await isSameClaimant(holder, record.claimedByDid))) throw INVALID();
        return readClaimedCredential(offerId);
    }

    return redeemOffer(offerId, holder, randomUUID(), domain);
};
