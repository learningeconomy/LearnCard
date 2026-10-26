import { createHash, randomUUID } from 'node:crypto';
import {
    type PlatformCredentialTemplate,
    type RecordIssuanceDeclaration,
    type UnsignedVC,
} from '@learncard/types';
import { neogma } from '@instance';
import { getGroupById } from '@accesslayer/group/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getPrimarySigningAuthorityForUser } from '@accesslayer/signing-authority/relationships/read';
import { getDidWeb } from '@helpers/did.helpers';
import { getCredentialUri, sendCredential } from '@helpers/credential.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import type { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import type { IssuanceOutcome } from '@helpers/issuers/types';
import { issueRecordOffer } from '@helpers/claim-offer.helpers';

export type RecordIssuer = {
    group: { id: string; name: string };
    profile: ProfileType;
    signingAuthority: SigningAuthorityForUserType;
};

/**
 * ADR-001 identity-bearing Group as the ecosystem's issuer: owned (never referenced) by the
 * ecosystem, issuance enabled, backed by the pinned HAS_IDENTITY Profile and that Profile's
 * primary signing authority. Returns the reason it cannot issue, or the resolved issuer.
 */
export const resolveRecordIssuer = async (
    ecosystemId: string,
    issuance: Pick<RecordIssuanceDeclaration, 'issuerGroupId' | 'issuerIdentityProfileId'>
): Promise<RecordIssuer | string> => {
    const group = await getGroupById(issuance.issuerGroupId);

    if (!group || group.ownerEcosystemId !== ecosystemId) {
        return 'The issuer Group must be owned by the Binding ecosystem.';
    }
    if (!group.identityProfileId || !group.identityIssuanceEnabled) {
        return 'The issuer Group must carry an identity with issuance enabled.';
    }
    if (group.identityProfileId !== issuance.issuerIdentityProfileId) {
        return 'The issuer Group identity differs from the pinned identity.';
    }

    const edge = await neogma.queryRunner.run(
        `MATCH (:Group {id: $groupId})-[:HAS_IDENTITY]->(p:Profile {profileId: $profileId})
         RETURN count(p) AS count`,
        { groupId: group.id, profileId: group.identityProfileId }
    );
    const profile = await getProfileByProfileId(group.identityProfileId);

    if (Number(edge.records[0]?.get('count')) !== 1 || !profile) {
        return 'The issuer Group identity Profile is missing.';
    }

    const signingAuthority = await getPrimarySigningAuthorityForUser(profile);

    if (!signingAuthority) return 'The issuer identity has no primary signing authority.';

    return { group: { id: group.id, name: group.name }, profile, signingAuthority };
};

/** Stable per-record credential id, so a retried issuance can never mint a second identity. */
const credentialIdForRecord = (recordId: string): string => {
    const hex = createHash('sha256')
        .update(`educationos/record-credential/${recordId}`)
        .digest('hex');
    return `urn:uuid:${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(
        17,
        20
    )}-${hex.slice(20, 32)}`;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

/** Renders a declared template from declared record fields only; throws on unusable values. */
export const renderPlatformCredential = (input: {
    template: PlatformCredentialTemplate;
    fields: Record<string, string>;
    recordId: string;
    ecosystemId: string;
    issuer: { did: string; name: string };
    subjectDid: string;
    issuedAt: string;
}): UnsignedVC => {
    const { template, fields } = input;
    const slot = (field: string): string => {
        const value = fields[field];
        if (!value) throw new Error(`Record is missing mapped field ${field}.`);
        return value;
    };
    const completedAt = template.fieldMap.completedAt
        ? slot(template.fieldMap.completedAt)
        : undefined;
    if (completedAt && (!ISO_DATE.test(completedAt) || Number.isNaN(Date.parse(completedAt)))) {
        throw new Error('Mapped completion date is not an ISO 8601 date.');
    }

    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
        ],
        id: credentialIdForRecord(input.recordId),
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: slot(template.fieldMap.name),
        issuer: { id: input.issuer.did, type: ['Profile'], name: input.issuer.name },
        issuanceDate: input.issuedAt,
        credentialSubject: {
            id: input.subjectDid,
            type: ['AchievementSubject'],
            ...(completedAt ? { activityEndDate: completedAt } : {}),
            achievement: {
                // Namespaced by ecosystem so partners cannot collide with other ecosystems' ids.
                id: `urn:educationos:${encodeURIComponent(input.ecosystemId)}:achievement:${encodeURIComponent(
                    slot(template.fieldMap.achievementId)
                )}`,
                type: ['Achievement'],
                ...(template.achievementType ? { achievementType: template.achievementType } : {}),
                name: slot(template.fieldMap.name),
                criteria: { narrative: template.criteria },
            },
        },
    };
};

/** Platform Issuance pushes (ISSUED) or, when the Binding declares delivery 'offer', offers. */
export type PlatformIssuanceResult = IssuanceOutcome;

/** A committed record handed to Platform Issuance, with the Binding's issuance declaration. */
export type ProvisionedRecordIssuance = {
    recordId: string;
    bindingId: string;
    ecosystemId: string;
    subjectProfileId: string;
    fields: Record<string, string>;
    issuance: RecordIssuanceDeclaration;
    domain: string;
};

/** Renders the record's credential as the resolved issuer, for a given subject DID. */
export const buildRecordCredential = (input: {
    recordId: string;
    ecosystemId: string;
    fields: Record<string, string>;
    issuance: RecordIssuanceDeclaration;
    issuer: RecordIssuer;
    subjectDid: string;
    domain: string;
}): UnsignedVC =>
    renderPlatformCredential({
        template: input.issuance.template,
        fields: input.fields,
        recordId: input.recordId,
        ecosystemId: input.ecosystemId,
        issuer: {
            did: getDidWeb(input.domain, input.issuer.profile.profileId),
            name: input.issuer.group.name,
        },
        subjectDid: input.subjectDid,
        issuedAt: new Date().toISOString(),
    });

/**
 * A credential already delivered for this record: sent to the Profile (e.g. a status write
 * lost after delivery), or claimed from an offer. Either way it must never be signed again.
 */
export const findDeliveredCredentialUri = async (
    recordId: string,
    domain: string
): Promise<string | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (:Profile)-[s:CREDENTIAL_SENT]->(c:Credential) WHERE s.`metadata.educationOsRecordId` = $recordId RETURN c.id AS id LIMIT 1',
        { recordId }
    );
    const id: unknown = result.records[0]?.get('id');
    if (typeof id === 'string') return getCredentialUri(id, domain);

    const claimed = await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord {id: $recordId}) WHERE r.claimedAt IS NOT NULL
         RETURN r.credentialUri AS uri LIMIT 1`,
        { recordId }
    );
    const uri: unknown = claimed.records[0]?.get('uri');

    return typeof uri === 'string' ? uri : null;
};

/**
 * Records an issuance outcome on the record and audits it. `onlyFrom` restricts the write to
 * records still in one of those states, so a late failure cannot clobber a claim in flight.
 */
export const writeIssuanceOutcome = async (
    input: Pick<
        ProvisionedRecordIssuance,
        'recordId' | 'bindingId' | 'ecosystemId' | 'subjectProfileId'
    >,
    result: Exclude<IssuanceOutcome, { status: 'OFFERED' }>,
    onlyFrom?: string[]
): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord {id: $recordId})
         ${onlyFrom ? 'WHERE r.issuanceStatus IN $onlyFrom' : ''}
         SET r.issuanceStatus = $status, r.credentialUri = $credentialUri, r.issuedAt = $now
         CREATE (:InstallIntentAuditEvent {id: $auditId, action: $action,
             ecosystemId: $ecosystemId, bindingId: $bindingId, timestamp: $now,
             afterSummary: $afterSummary})`,
        {
            recordId: input.recordId,
            onlyFrom: onlyFrom ?? null,
            status: result.status,
            credentialUri: result.status === 'ISSUED' ? result.credentialUri : null,
            now: new Date().toISOString(),
            auditId: `install_intent_audit_${randomUUID()}`,
            action:
                result.status === 'ISSUED'
                    ? 'RECORD_CREDENTIAL_ISSUED'
                    : 'RECORD_CREDENTIAL_ISSUE_FAILED',
            ecosystemId: input.ecosystemId,
            bindingId: input.bindingId,
            afterSummary: JSON.stringify({
                recordId: input.recordId,
                subjectProfileId: input.subjectProfileId,
                ...(result.status === 'ISSUED'
                    ? { credentialUri: result.credentialUri }
                    : { reason: result.reason }),
            }),
        }
    );
};

/**
 * Platform Issuance (ADR-012 D4(1): the provider never issues). Re-resolves the issuer at
 * issue time, signs through its signing authority and sends to the subject's Profile. Safe to
 * repeat: an already-delivered record is reconciled, never re-signed. The outcome is recorded
 * and audited; a failure never undoes the stored record, and a lost write leaves it PENDING.
 * A Binding declaring delivery 'offer' signs nothing here: the learner's wallet claims it.
 */
export const issueProvisionedRecord = async (
    input: ProvisionedRecordIssuance
): Promise<PlatformIssuanceResult> => {
    if (input.issuance.delivery === 'offer') return issueRecordOffer(input);

    let result: Exclude<IssuanceOutcome, { status: 'OFFERED' }>;

    try {
        const delivered = await findDeliveredCredentialUri(input.recordId, input.domain);
        const issuer = delivered
            ? null
            : await resolveRecordIssuer(input.ecosystemId, input.issuance);
        const subject = await getProfileByProfileId(input.subjectProfileId);

        if (delivered) result = { status: 'ISSUED', credentialUri: delivered };
        else if (typeof issuer === 'string') result = { status: 'ISSUE_FAILED', reason: issuer };
        else if (!issuer || !subject) {
            result = { status: 'ISSUE_FAILED', reason: 'Subject Profile missing.' };
        } else {
            const unsigned = buildRecordCredential({
                ...input,
                issuer,
                subjectDid: getDidWeb(input.domain, subject.profileId),
            });
            const credential = await issueCredentialWithSigningAuthority(
                { type: 'profile', profile: issuer.profile },
                unsigned,
                issuer.signingAuthority,
                input.domain
            );
            const credentialUri = await sendCredential(
                issuer.profile,
                subject,
                credential,
                input.domain,
                { educationOsRecordId: input.recordId }
            );
            result = { status: 'ISSUED', credentialUri };
        }
    } catch (error) {
        console.error('Platform issuance failed', error);
        const kind = error instanceof Error ? error.name : 'UnknownError';
        result = {
            status: 'ISSUE_FAILED',
            reason: `Rendering, signing or delivery failed (${kind}).`,
        };
    }

    try {
        await writeIssuanceOutcome(input, result);
    } catch (error) {
        // The record stays PENDING; retryRecordIssuance (issuers/retry.ts) reconciles it without re-signing.
        console.error('Platform issuance status write failed', error);
    }

    return result;
};
