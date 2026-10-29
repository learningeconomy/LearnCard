/**
 * Record-provisioning Binding builders shared by record-release.spec.ts and the scenario
 * runner's in-process driver.
 */
import { randomUUID } from 'node:crypto';
import type { RecordProvisioningBindingMetadata } from '@learncard/types';
import { neogma } from '@instance';
import { createProfile } from '@accesslayer/profile/create';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { upsertSigningAuthority } from '@accesslayer/signing-authority/create';
import { createUseSigningAuthorityRelationship } from '@accesslayer/signing-authority/relationships/create';
import type { appRouter } from '../../src/app';

export type Issuer = { groupId: string; profileId: string };

export const metadataFor = (
    issuer: Issuer,
    overrides: Partial<RecordProvisioningBindingMetadata> = {}
): RecordProvisioningBindingMetadata => ({
    capability: 'record-provisioning',
    mode: 'TRANSACTIONAL',
    recordClass: 'academic',
    legalBasis: 'FERPA school-official exception (declared by the institution, not established).',
    identityBinding: 'roster-mapped',
    transactional: {
        triggerAuthority: 'system-event',
        purpose: 'Issue a course completion credential.',
        fields: ['completionId', 'courseId', 'courseTitle', 'completedAt'],
        idempotencyKeyField: 'completionId',
        timeoutMs: 5000,
        maxRetries: 2,
        retentionDays: 30,
    },
    issuance: {
        issuerGroupId: issuer.groupId,
        issuerIdentityProfileId: issuer.profileId,
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
    },
    ...overrides,
});

/** ADR-001 identity-bearing Group owned by the ecosystem, with a primary signing authority. */
export const createIssuerGroup = async (
    ecosystemId: string,
    options: { issuanceEnabled?: boolean; signingAuthority?: boolean } = {}
): Promise<Issuer> => {
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
             identityIssuanceEnabled: $enabled, members: []})-[:HAS_IDENTITY]->(p)`,
        { profileId, groupId, ecosystemId, enabled: options.issuanceEnabled ?? true }
    );
    if (options.signingAuthority ?? true) {
        const profile = await getProfileByProfileId(profileId);
        if (!profile) throw new Error('Missing issuer profile');
        const sa = await upsertSigningAuthority('http://localhost:5000/api');
        await createUseSigningAuthorityRelationship(profile, sa, 'issuer-sa', profile.did, true);
    }
    return { groupId, profileId };
};

export type OwnerClient = ReturnType<typeof appRouter.createCaller>;

/** propose → consent preflight → approve, as the console does. */
export const approveRecordBinding = async (
    client: OwnerClient,
    ecosystemId: string,
    installId: string,
    issuer: Issuer,
    delivery?: 'push' | 'offer'
) => {
    const metadata = metadataFor(issuer);
    const proposed = await client.installIntent.proposeBinding({
        ecosystemId,
        capability: 'record-provisioning',
        provider: { resourceType: 'INTEGRATION_INSTALL', resourceId: installId, ecosystemId },
        consumer: { resourceType: 'ECOSYSTEM', resourceId: ecosystemId, ecosystemId },
        capabilityMetadata:
            delivery && metadata.issuance
                ? { ...metadata, issuance: { ...metadata.issuance, delivery } }
                : metadata,
    });
    const preflight = await client.installIntent.prepareBindingConsentPreflight({
        bindingId: proposed.bindingId,
    });
    return client.installIntent.approveBinding({
        bindingId: proposed.bindingId,
        expectedRevision: preflight.bindingRevision,
        preflightId: preflight.preflightId,
        preflightHash: preflight.hash,
    });
};
