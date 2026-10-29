import { vi } from 'vitest';

/** Wraps the test signing mock so calls can be counted and a failure injected. */
const signing = vi.hoisted(() => ({ issue: vi.fn() }));

vi.mock('@helpers/signingAuthority.helpers', async importOriginal => {
    const original = await importOriginal<typeof import('@helpers/signingAuthority.helpers')>();
    signing.issue.mockImplementation(original.issueCredentialWithSigningAuthority);
    return { ...original, issueCredentialWithSigningAuthority: signing.issue };
});

import { randomBytes, randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    VCValidator,
    type RecordIssuanceDeclaration,
    type RecordProvisioningBindingMetadata,
    type VC,
    type VP,
} from '@learncard/types';
import { resolveTenantFromRequest } from '@learncard/email-templates';
import cache from '@cache';
import { neogma } from '@instance';
import { appRouter } from '../src/app';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { createProfile } from '@accesslayer/profile/create';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { upsertSigningAuthority } from '@accesslayer/signing-authority/create';
import { createUseSigningAuthorityRelationship } from '@accesslayer/signing-authority/relationships/create';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { issueProvisionedRecord } from '@helpers/platform-issuance.helpers';
import { retryRecordIssuance } from '@helpers/issuers/retry';
import { purgeExpiredProvisionedRecords } from '@helpers/record-release.helpers';
import {
    CLAIM_WORKFLOW_ID,
    finalizeRecordClaim,
    leaseRecordClaim,
} from '@helpers/claim-offer.helpers';
import { signDidAuth } from './helpers/did-auth';

const DOMAIN = 'localhost%3A3000';
type Wallet = Awaited<ReturnType<typeof getLearnCard>>;

const newWallet = (): Promise<Wallet> => getLearnCard(randomBytes(32).toString('hex'));

const createIssuerGroup = async (ecosystemId: string) => {
    const groupId = `group_${randomUUID()}`;
    const profileId = `issuer-${randomUUID()}`;
    await createProfile({
        profileId,
        did: `did:web:localhost%3A3000:users:${profileId}`,
        displayName: 'District Issuer',
    } as Parameters<typeof createProfile>[0]);
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})
         CREATE (g:Group {id: $groupId, name: 'Springfield District', type: 'INSTITUTION',
             ownerEcosystemId: $ecosystemId, identityProfileId: $profileId,
             identityIssuanceEnabled: true, members: []})-[:HAS_IDENTITY]->(p)`,
        { profileId, groupId, ecosystemId }
    );
    const profile = await getProfileByProfileId(profileId);
    if (!profile) throw new Error('Missing issuer profile');
    const sa = await upsertSigningAuthority('http://localhost:5000/api');
    await createUseSigningAuthorityRelationship(profile, sa, 'issuer-sa', profile.did, true);
    return { groupId, profileId };
};

/**
 * An ecosystem issuer, an ACTIVE offer-mode Binding and a committed PENDING record for a
 * learner whose LearnCard Profile DID is their wallet's DID. Release itself is covered by
 * record-release.spec.ts; these tests start at Platform Issuance.
 */
const setup = async (options: { retentionDays?: number } = {}) => {
    const id = randomUUID();
    const ownerId = `owner-${id}`;
    await createProfile({
        profileId: ownerId,
        did: `did:key:z6MkClaimOwner${id.replace(/-/g, '')}`,
        displayName: 'Owner',
    } as Parameters<typeof createProfile>[0]);
    const ecosystem = await createEcosystem({
        name: 'District',
        slug: `district-${id}`,
        ownerProfileId: ownerId,
        parentEcosystemId: null,
        description: undefined,
        settings: {},
        status: 'ACTIVE',
    });
    const issuer = await createIssuerGroup(ecosystem.id);
    const issuance: RecordIssuanceDeclaration = {
        issuerGroupId: issuer.groupId,
        issuerIdentityProfileId: issuer.profileId,
        delivery: 'offer',
        template: {
            kind: 'obv3-achievement',
            achievementType: 'Course',
            criteria: 'Completed every module of the course.',
            fieldMap: {
                achievementId: 'courseId',
                name: 'courseTitle',
                completedAt: 'completedAt',
            },
        },
    };
    const metadata: RecordProvisioningBindingMetadata = {
        capability: 'record-provisioning',
        mode: 'TRANSACTIONAL',
        recordClass: 'academic',
        legalBasis: 'Declared by the institution.',
        identityBinding: 'roster-mapped',
        transactional: {
            triggerAuthority: 'system-event',
            purpose: 'Issue a course completion credential.',
            fields: ['completionId', 'courseId', 'courseTitle', 'completedAt'],
            idempotencyKeyField: 'completionId',
            timeoutMs: 5000,
            maxRetries: 2,
            retentionDays: options.retentionDays ?? 30,
        },
        issuance,
    };
    const bindingId = `binding_${id}`;
    await neogma.queryRunner.run(
        `CREATE (:Binding {bindingId: $bindingId, ecosystemId: $ecosystemId, status: 'ACTIVE',
             capability: 'record-provisioning', capabilityMetadata: $metadata,
             consumer: $consumer})`,
        {
            bindingId,
            ecosystemId: ecosystem.id,
            metadata: JSON.stringify(metadata),
            consumer: JSON.stringify({
                resourceType: 'ECOSYSTEM',
                resourceId: ecosystem.id,
                ecosystemId: ecosystem.id,
            }),
        }
    );

    const wallet = await newWallet();
    const learnerId = `learner-${id}`;
    await createProfile({
        profileId: learnerId,
        did: wallet.id.did(),
        displayName: 'Learner',
    } as Parameters<typeof createProfile>[0]);

    const recordId = `record_${id}`;
    const fields = {
        completionId: `completion_${id}`,
        courseId: 'course-101',
        courseTitle: 'Intro to Credentials',
        completedAt: '2026-10-23',
    };
    const now = new Date();
    await neogma.queryRunner.run(
        `CREATE (:ProvisionedRecord {id: $recordId, bindingId: $bindingId,
             ecosystemId: $ecosystemId, subjectProfileId: $learnerId, recordClass: 'academic',
             fields: $fields, receivedAt: $now, expiresAt: $expiresAt,
             issuanceStatus: 'PENDING'})`,
        {
            recordId,
            bindingId,
            ecosystemId: ecosystem.id,
            learnerId,
            fields: JSON.stringify(fields),
            now: now.toISOString(),
            expiresAt: new Date(
                now.getTime() + (options.retentionDays ?? 30) * 86_400_000
            ).toISOString(),
        }
    );
    const input = {
        recordId,
        bindingId,
        ecosystemId: ecosystem.id,
        subjectProfileId: learnerId,
        fields,
        issuance,
        domain: DOMAIN,
    };

    return { input, wallet, learnerId, recordId, bindingId, issuer };
};

const offerOf = async (input: Parameters<typeof issueProvisionedRecord>[0]) => {
    const outcome = await issueProvisionedRecord(input);
    if (outcome.status !== 'OFFERED') throw new Error(`Expected an offer, got ${outcome.status}`);
    const offerId = outcome.offer.uri.split('/').pop() ?? '';
    return { outcome, offerId };
};

/** A caller with its own source IP, so per-IP limits never couple tests. */
const caller = () =>
    appRouter.createCaller({
        domain: DOMAIN,
        tenant: resolveTenantFromRequest({}),
        sourceIp: `198.51.100.${randomUUID()}`,
    });

const participate = (
    offerId: string,
    verifiablePresentation?: VP,
    client: ReturnType<typeof caller> = caller()
) =>
    client.workflows.participateInExchange({
        localWorkflowId: CLAIM_WORKFLOW_ID,
        localExchangeId: offerId,
        verifiablePresentation,
    });

const challengeFor = async (offerId: string): Promise<string> => {
    const request = await participate(offerId);
    const challenge = request.verifiablePresentationRequest?.challenge;
    if (!challenge) throw new Error('Missing challenge');
    return challenge;
};

const claim = async (offerId: string, wallet: Wallet): Promise<VC> => {
    const vp = await signDidAuth(wallet, await challengeFor(offerId));
    return credentialIn(await participate(offerId, vp));
};

const credentialIn = (response: { verifiablePresentation?: VP }): VC => {
    const vcs = response.verifiablePresentation?.verifiableCredential;
    const list = Array.isArray(vcs) ? vcs : vcs ? [vcs] : [];
    expect(list).toHaveLength(1);
    return VCValidator.parse(list[0]);
};

const recordState = async (recordId: string) => {
    const result = await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord {id: $recordId})
         OPTIONAL MATCH (r)-[:CLAIMED_AS]->(c:Credential)
         OPTIONAL MATCH (:Profile)-[s:CREDENTIAL_SENT]->(:Credential)
         WHERE s.\`metadata.educationOsRecordId\` = $recordId
         RETURN r.issuanceStatus AS status, r.deliveryChannel AS channel, r.offerId AS offerId,
                r.offerExpiresAt AS offerExpiresAt, r.expiresAt AS expiresAt,
                r.claimedByDid AS claimedByDid, r.claimedAt AS claimedAt,
                r.credentialUri AS credentialUri, r.claimNonce AS claimNonce,
                r.claimLeaseUntil AS claimLeaseUntil, count(DISTINCT c) AS claimed,
                collect(DISTINCT c.credential) AS stored, count(DISTINCT s) AS sent`,
        { recordId }
    );
    return result.records[0]!.toObject();
};

const audits = async (bindingId: string, action: string): Promise<string[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (a:InstallIntentAuditEvent {bindingId: $bindingId, action: $action})
         RETURN a.afterSummary AS summary`,
        { bindingId, action }
    );
    return result.records.map(row => String(row.get('summary')));
};

beforeEach(() => {
    signing.issue.mockClear();
});

describe('EducationOS claim offers (VC-API, holder-bound)', () => {
    it('offers instead of signing at release, and records the offer durably', async () => {
        const { input, recordId, bindingId } = await setup();
        const { outcome, offerId } = await offerOf(input);

        expect(outcome.offer.protocol).toBe('vc-api');
        expect(outcome.offer.uri).toMatch(/\/workflows\/educationos-claim\/exchanges\//);
        const state = await recordState(recordId);
        expect(state.status).toBe('OFFERED');
        expect(state.channel).toBe('offer');
        expect(state.offerId).toBe(offerId);
        expect(state.offerExpiresAt <= state.expiresAt).toBe(true);
        expect(Number(state.sent)).toBe(0);
        const offered = await audits(bindingId, 'RECORD_CREDENTIAL_OFFERED');
        expect(offered).toHaveLength(1);
        expect(JSON.parse(offered[0]!)).toMatchObject({ recordId });
        expect(offered[0]).not.toContain(offerId);
        expect(signing.issue).not.toHaveBeenCalled();
    });

    it('reuses the same offer when issuance repeats', async () => {
        const { input, recordId, bindingId } = await setup();
        const first = await offerOf(input);
        const second = await offerOf(input);
        expect(second.outcome.offer.uri).toBe(first.outcome.offer.uri);
        // retryRecordIssuance only picks up PENDING or ISSUE_FAILED records.
        expect(await retryRecordIssuance(recordId, DOMAIN)).toBeNull();
        await neogma.queryRunner.run(
            "MATCH (r:ProvisionedRecord {id: $recordId}) SET r.issuanceStatus = 'PENDING'",
            { recordId }
        );
        const retried = await retryRecordIssuance(recordId, DOMAIN);
        expect(retried).toEqual(first.outcome);
        expect(await audits(bindingId, 'RECORD_CREDENTIAL_OFFERED')).toHaveLength(2);
    });

    it('issues to the learner wallet that proves its DID, exactly once', async () => {
        const { input, wallet, recordId, bindingId } = await setup();
        const { offerId } = await offerOf(input);

        const challenge = await challengeFor(offerId);
        expect(challenge.startsWith(`${offerId}:`)).toBe(true);
        const response = await participate(offerId, await signDidAuth(wallet, challenge));
        const vc = credentialIn(response);
        const subject = Array.isArray(vc.credentialSubject)
            ? vc.credentialSubject[0]
            : vc.credentialSubject;
        expect(subject?.id).toBe(wallet.id.did());
        expect(vc.id).toMatch(/^urn:uuid:/);

        const state = await recordState(recordId);
        expect(state).toMatchObject({
            status: 'ISSUED',
            channel: 'offer',
            claimedByDid: wallet.id.did(),
        });
        expect(state.claimedAt).toBeTruthy();
        expect(String(state.credentialUri)).toContain('credential');
        expect(Number(state.claimed)).toBe(1);
        expect(Number(state.sent)).toBe(0);
        // Stored encrypted to brain's own key, never as plaintext.
        expect(JSON.parse(String(state.stored[0]))).toHaveProperty('ciphertext');
        const issued = await audits(bindingId, 'RECORD_CREDENTIAL_ISSUED');
        expect(issued.map(summary => JSON.parse(summary).deliveredVia)).toEqual(['offer']);
        expect(signing.issue).toHaveBeenCalledTimes(1);
        expect(signing.issue.mock.calls[0]?.[4]).toBe(false);

        // The app's completion re-POST still gets a request, and the same holder gets the
        // same credential back without a second signature.
        expect((await participate(offerId)).verifiablePresentationRequest).toBeTruthy();
        const again = await claim(offerId, wallet);
        expect(again.id).toBe(vc.id);
        expect(signing.issue).toHaveBeenCalledTimes(1);

        // A claimed record is reconciled, never re-signed.
        expect(await issueProvisionedRecord(input)).toEqual({
            status: 'ISSUED',
            credentialUri: state.credentialUri,
        });
        expect(signing.issue).toHaveBeenCalledTimes(1);

        // Another learner's wallet cannot take the claimed credential.
        const other = await newWallet();
        await createProfile({
            profileId: `other-${randomUUID()}`,
            did: other.id.did(),
            displayName: 'Other learner',
        } as Parameters<typeof createProfile>[0]);
        await expect(claim(offerId, other)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('rejects a wallet that is not the learner and audits only a hashed DID', async () => {
        const { input, recordId, bindingId } = await setup();
        const { offerId } = await offerOf(input);
        const otherLearner = await newWallet();
        await createProfile({
            profileId: `other-${randomUUID()}`,
            did: otherLearner.id.did(),
            displayName: 'Other learner',
        } as Parameters<typeof createProfile>[0]);
        const stranger = await newWallet();

        for (const wallet of [otherLearner, stranger]) {
            await expect(claim(offerId, wallet)).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: 'Invalid claim presentation.',
            });
        }
        const state = await recordState(recordId);
        expect(state.status).toBe('OFFERED');
        expect(Number(state.claimed)).toBe(0);
        const denied = await audits(bindingId, 'RECORD_CREDENTIAL_CLAIM_DENIED');
        expect(denied).toHaveLength(2);
        for (const summary of denied) {
            expect(JSON.parse(summary)).toHaveProperty('holderDidSha256');
            expect(summary).not.toContain(otherLearner.id.did());
            expect(summary).not.toContain(stranger.id.did());
        }
        expect(signing.issue).not.toHaveBeenCalled();
    });

    it('rejects a presentation signed by another key that names the learner as holder', async () => {
        const { input, wallet, recordId } = await setup();
        const { offerId } = await offerOf(input);
        const challenge = await challengeFor(offerId);
        const attacker = await newWallet();
        const forged = { ...(await signDidAuth(attacker, challenge)), holder: wallet.id.did() };

        await expect(participate(offerId, forged)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect((await recordState(recordId)).status).toBe('OFFERED');
        // Rejected before the challenge was consumed: the learner can still use it.
        const vc = credentialIn(await participate(offerId, await signDidAuth(wallet, challenge)));
        expect(vc.id).toMatch(/^urn:uuid:/);
    });

    it('rejects malformed challenges and proofs on an unclaimed offer, then replays', async () => {
        const { input, wallet, recordId } = await setup();
        const { offerId } = await offerOf(input);
        const other = await setup();
        const otherOffer = await offerOf(other.input);

        // Each negative runs against an OFFERED record: none may lease it or sign.
        const expectUntouched = async () => {
            const state = await recordState(recordId);
            expect(state.status).toBe('OFFERED');
            expect(state.claimNonce).toBeNull();
            expect(state.claimLeaseUntil).toBeNull();
            expect(signing.issue).not.toHaveBeenCalled();
        };

        const fresh = await signDidAuth(wallet, await challengeFor(otherOffer.offerId));
        await expect(participate(offerId, fresh)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expectUntouched();
        await expect(
            participate(offerId, await signDidAuth(wallet, `${offerId}:unknown-nonce`))
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expectUntouched();

        const assertion = await wallet.invoke.getDidAuthVp({
            challenge: await challengeFor(offerId),
            domain: DOMAIN,
            proofPurpose: 'assertionMethod',
        });
        if (typeof assertion === 'string') throw new Error('Expected a JSON-LD presentation');
        await expect(participate(offerId, assertion)).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
        await expectUntouched();

        const single = await signDidAuth(wallet, await challengeFor(offerId));
        const proof = Array.isArray(single.proof) ? single.proof[0] : single.proof;
        if (!proof) throw new Error('Expected a proof');
        await expect(
            participate(offerId, { ...single, proof: [proof, proof] })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expectUntouched();

        // Replay last: the first use claims, the second is refused.
        const replayed = await signDidAuth(wallet, await challengeFor(offerId));
        await participate(offerId, replayed);
        await expect(participate(offerId, replayed)).rejects.toMatchObject({ code: 'NOT_FOUND' });

        expect((await recordState(recordId)).status).toBe('ISSUED');
        expect((await recordState(other.recordId)).status).toBe('OFFERED');
        expect(signing.issue).toHaveBeenCalledTimes(1);
    });

    it('signs exactly once under concurrent claims by the learner', async () => {
        for (let run = 0; run < 3; run += 1) {
            signing.issue.mockClear();
            const { input, wallet, recordId } = await setup();
            const { offerId } = await offerOf(input);
            const [first, second] = [
                await signDidAuth(wallet, await challengeFor(offerId)),
                await signDidAuth(wallet, await challengeFor(offerId)),
            ];
            const results = await Promise.allSettled([
                participate(offerId, first),
                participate(offerId, second),
            ]);

            expect(signing.issue).toHaveBeenCalledTimes(1);
            expect(Number((await recordState(recordId)).claimed)).toBe(1);
            const delivered = results.flatMap(result =>
                result.status === 'fulfilled' ? [credentialIn(result.value).id] : []
            );
            expect(delivered.length).toBeGreaterThanOrEqual(1);
            expect(new Set(delivered).size).toBe(1);
            for (const result of results) {
                if (result.status === 'rejected') {
                    expect(result.reason).toMatchObject({ code: 'NOT_FOUND' });
                }
            }
        }
    });

    it('honours a live lease and ignores a finalize from a stale attempt', async () => {
        const { input, wallet, recordId } = await setup();
        const { offerId } = await offerOf(input);
        const future = new Date(Date.now() + 60_000).toISOString();
        await neogma.queryRunner.run(
            `MATCH (r:ProvisionedRecord {id: $recordId})
             SET r.issuanceStatus = 'CLAIMING', r.claimLeaseUntil = $future, r.claimNonce = 'held'`,
            { recordId, future }
        );
        await expect(claim(offerId, wallet)).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect(signing.issue).not.toHaveBeenCalled();

        await neogma.queryRunner.run(
            `MATCH (r:ProvisionedRecord {id: $recordId})
             SET r.claimLeaseUntil = $past`,
            { recordId, past: new Date(Date.now() - 1000).toISOString() }
        );
        // An expired lease is claimable; the stale attempt can no longer finalize.
        const leased = await leaseRecordClaim(offerId, wallet.id.did(), 'current');
        expect(leased?.id).toBe(recordId);
        const learnCard = await getLearnCard();
        const stale = await learnCard.invoke.issueCredential(
            learnCard.invoke.getTestVc(wallet.id.did())
        );
        expect(
            await finalizeRecordClaim({
                record: { id: recordId, subjectProfileId: input.subjectProfileId },
                offerId,
                attemptId: 'held',
                holderDid: wallet.id.did(),
                credential: stale,
                domain: DOMAIN,
            })
        ).toBeNull();
        const state = await recordState(recordId);
        expect(state.status).toBe('CLAIMING');
        expect(Number(state.claimed)).toBe(0);
    });

    it('refuses to finalize a lease once the offer or the record retention has expired', async () => {
        const { input, wallet, recordId } = await setup();
        const { offerId } = await offerOf(input);
        const learnCard = await getLearnCard();
        const credential = await learnCard.invoke.issueCredential(
            learnCard.invoke.getTestVc(wallet.id.did())
        );
        const finalize = () =>
            finalizeRecordClaim({
                record: { id: recordId, subjectProfileId: input.subjectProfileId },
                offerId,
                attemptId: 'current',
                holderDid: wallet.id.did(),
                credential,
                domain: DOMAIN,
            });
        expect((await leaseRecordClaim(offerId, wallet.id.did(), 'current'))?.id).toBe(recordId);
        const credentials = async (): Promise<number> => {
            const result = await neogma.queryRunner.run(
                'MATCH (c:Credential) RETURN count(c) AS count'
            );
            return Number(result.records[0]?.get('count'));
        };
        const before = await credentials();
        const past = new Date(Date.now() - 1000).toISOString();

        // Retention ends while signing: the lease is still held, but nothing is stored.
        const { expiresAt, offerExpiresAt } = await recordState(recordId);
        await neogma.queryRunner.run(
            'MATCH (r:ProvisionedRecord {id: $recordId}) SET r.expiresAt = $past',
            { recordId, past }
        );
        expect(await finalize()).toBeNull();
        await neogma.queryRunner.run(
            `MATCH (r:ProvisionedRecord {id: $recordId})
             SET r.expiresAt = $expiresAt, r.offerExpiresAt = $past`,
            { recordId, expiresAt, past }
        );
        expect(await finalize()).toBeNull();

        const state = await recordState(recordId);
        expect(state.status).toBe('CLAIMING');
        expect(Number(state.claimed)).toBe(0);
        // The stored copy is rolled back with the refused finalize.
        expect(await credentials()).toBe(before);
        await neogma.queryRunner.run(
            'MATCH (r:ProvisionedRecord {id: $recordId}) SET r.offerExpiresAt = $offerExpiresAt',
            { recordId, offerExpiresAt }
        );
        expect(await finalize()).toMatch(/credential/);
    });

    it('does not audit a failure for an attempt whose lease another attempt finalized', async () => {
        const { input, wallet, recordId, bindingId } = await setup();
        const { offerId } = await offerOf(input);
        const original = signing.issue.getMockImplementation();
        if (!original) throw new Error('Missing signing implementation');
        // While this attempt signs, another takes over the lease and issues the record.
        signing.issue.mockImplementationOnce(async (...args: unknown[]) => {
            await neogma.queryRunner.run(
                `MATCH (r:ProvisionedRecord {id: $recordId})
                 SET r.issuanceStatus = 'ISSUED', r.claimedAt = $now
                 REMOVE r.claimNonce, r.claimLeaseUntil, r.claimingDid`,
                { recordId, now: new Date().toISOString() }
            );
            return original(...args);
        });

        await expect(claim(offerId, wallet)).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
        });
        expect((await recordState(recordId)).status).toBe('ISSUED');
        expect(await audits(bindingId, 'RECORD_CREDENTIAL_ISSUE_FAILED')).toHaveLength(0);
    });

    it('reverts to OFFERED when signing fails or the Binding is gone, then recovers', async () => {
        const { input, wallet, recordId, bindingId } = await setup();
        const { offerId } = await offerOf(input);

        signing.issue.mockRejectedValueOnce(new Error('signing authority unavailable'));
        await expect(claim(offerId, wallet)).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Claim could not be completed.',
        });
        expect((await recordState(recordId)).status).toBe('OFFERED');
        expect(await audits(bindingId, 'RECORD_CREDENTIAL_ISSUE_FAILED')).toHaveLength(1);

        await neogma.queryRunner.run(
            "MATCH (b:Binding {bindingId: $bindingId}) SET b.status = 'REVOKED'",
            { bindingId }
        );
        await expect(claim(offerId, wallet)).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect((await recordState(recordId)).status).toBe('OFFERED');

        await neogma.queryRunner.run(
            "MATCH (b:Binding {bindingId: $bindingId}) SET b.status = 'ACTIVE'",
            { bindingId }
        );
        expect((await claim(offerId, wallet)).id).toMatch(/^urn:uuid:/);
        expect((await recordState(recordId)).status).toBe('ISSUED');
    });

    it('re-delivers to the same learner presenting their other DID', async () => {
        const { input, wallet, learnerId, recordId } = await setup();
        const { offerId } = await offerOf(input);
        const first = await claim(offerId, wallet);

        // A learner's wallet may sign as its did:key or its local did:web; both are the learner.
        await neogma.queryRunner.run(
            'MATCH (r:ProvisionedRecord {id: $recordId}) SET r.claimedByDid = $didWeb',
            { recordId, didWeb: `did:web:${DOMAIN}:users:${learnerId}` }
        );
        const again = await claim(offerId, wallet);
        expect(again.id).toBe(first.id);
        expect(signing.issue).toHaveBeenCalledTimes(1);
    });

    it('stops re-delivering a claimed credential once the Binding is revoked', async () => {
        const { input, wallet, bindingId } = await setup();
        const { offerId } = await offerOf(input);
        const early = await signDidAuth(wallet, await challengeFor(offerId));
        expect((await claim(offerId, wallet)).id).toMatch(/^urn:uuid:/);

        await neogma.queryRunner.run(
            "MATCH (b:Binding {bindingId: $bindingId}) SET b.status = 'REVOKED'",
            { bindingId }
        );
        await expect(participate(offerId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(participate(offerId, early)).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect(signing.issue).toHaveBeenCalledTimes(1);
    });

    it('purges the claimed copy with the record when retention ends', async () => {
        const { input, wallet, recordId } = await setup({ retentionDays: 1 });
        const { offerId } = await offerOf(input);
        await claim(offerId, wallet);
        const claimed = await neogma.queryRunner.run(
            `MATCH (:ProvisionedRecord {id: $recordId})-[:CLAIMED_AS]->(c:Credential)
             RETURN c.id AS id`,
            { recordId }
        );
        const credentialId = String(claimed.records[0]?.get('id'));
        expect(credentialId).toBeTruthy();

        await purgeExpiredProvisionedRecords(new Date(Date.now() + 2 * 86_400_000));
        const left = await neogma.queryRunner.run(
            `OPTIONAL MATCH (r:ProvisionedRecord {id: $recordId})
             OPTIONAL MATCH (c:Credential {id: $credentialId})
             RETURN count(r) AS records, count(c) AS credentials`,
            { recordId, credentialId }
        );
        expect(Number(left.records[0]?.get('records'))).toBe(0);
        expect(Number(left.records[0]?.get('credentials'))).toBe(0);
    });

    it('refuses expired and purged offers at both steps', async () => {
        const { input, wallet, recordId } = await setup();
        const { offerId } = await offerOf(input);
        const early = await signDidAuth(wallet, await challengeFor(offerId));
        await neogma.queryRunner.run(
            'MATCH (r:ProvisionedRecord {id: $recordId}) SET r.offerExpiresAt = $past',
            { recordId, past: new Date(Date.now() - 1000).toISOString() }
        );
        await expect(participate(offerId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(participate(offerId, early)).rejects.toMatchObject({ code: 'NOT_FOUND' });
        // The CAS predicate refuses an expired offer even when the step-2 checks are bypassed.
        expect(await leaseRecordClaim(offerId, wallet.id.did(), 'late')).toBeNull();

        const purged = await setup({ retentionDays: 1 });
        const purgedOffer = await offerOf(purged.input);
        const minted = await signDidAuth(purged.wallet, await challengeFor(purgedOffer.offerId));
        await purgeExpiredProvisionedRecords(new Date(Date.now() + 2 * 86_400_000));
        await expect(participate(purgedOffer.offerId)).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
        await expect(participate(purgedOffer.offerId, minted)).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
        expect(signing.issue).not.toHaveBeenCalled();
    });

    it('does not let a forwarded link lock the learner out', async () => {
        const { input, wallet, recordId } = await setup();
        const { offerId } = await offerOf(input);
        const attacker = caller();
        // Well past the old per-offer limit, from one source and under its per-IP limit.
        for (let attempt = 0; attempt < 35; attempt += 1) {
            await participate(offerId, undefined, attacker);
        }
        const bogus = await signDidAuth(await newWallet(), `${offerId}:not-minted`);
        for (let attempt = 0; attempt < 20; attempt += 1) {
            await expect(participate(offerId, bogus, attacker)).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        }
        expect((await claim(offerId, wallet)).id).toMatch(/^urn:uuid:/);
        expect((await recordState(recordId)).status).toBe('ISSUED');
    });

    it('rate-limits each caller, and authenticated claims per offer', async () => {
        const { input, wallet, recordId } = await setup();
        const { offerId } = await offerOf(input);
        const client = caller();
        for (let attempt = 0; attempt < 60; attempt += 1) {
            await participate(offerId, undefined, client);
        }
        await expect(participate(offerId, undefined, client)).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
        });

        // Only the learner's own verified presentations count toward the per-offer limit.
        await cache.incr(`claim-offer:claimant:${offerId}`, 60, 30);
        await expect(claim(offerId, wallet)).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
        });
        expect((await recordState(recordId)).status).toBe('OFFERED');
        expect(signing.issue).not.toHaveBeenCalled();
    });
});
