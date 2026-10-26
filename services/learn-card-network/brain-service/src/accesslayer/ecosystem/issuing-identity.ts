import { randomBytes, randomUUID } from 'node:crypto';
import { neogma } from '@instance';
import { createProfile } from '@accesslayer/profile/create';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { createProfileManager } from '@accesslayer/profile-manager/create';
import { createManagesRelationship } from '@accesslayer/profile-manager/relationships/create';
import { createGroup } from '@accesslayer/group/write';
import { createInstallIntentAuditEvent } from '@accesslayer/install-intent/audit';
import { getPrimarySigningAuthorityForUser } from '@accesslayer/signing-authority/relationships/read';
import { getDidWeb } from '@helpers/did.helpers';
import { requireEcosystemRole } from '@helpers/install-intent.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { ensureManagedSigningAuthorityForProfile } from '@helpers/inline-template.helpers';

export type EcosystemIssuingIdentity = {
    groupId: string;
    name: string;
    profileId: string;
    did: string;
    signingReady: boolean;
};

// Root Group slugs are unique across ecosystems, so the slug is ecosystem-specific.
const issuingIdentitySlug = (ecosystemId: string): string =>
    `issuing-identity-${ecosystemId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

/** The ecosystem's managed issuing identity (RFC 2026-10 decision 4), if provisioned. */
export const getEcosystemIssuingIdentity = async (
    ecosystemId: string,
    domain: string
): Promise<EcosystemIssuingIdentity | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (e:Ecosystem {id: $ecosystemId})-[:OWNS]->(g:Group {slug: $slug})
               -[:HAS_IDENTITY]->(p:Profile)
         MATCH (m:ProfileManager)-[:MANAGES]->(p) WHERE (m)-[:ADMINISTRATES]->(e)
         RETURN g.id AS groupId, g.name AS name, p.profileId AS profileId LIMIT 1`,
        { ecosystemId, slug: issuingIdentitySlug(ecosystemId) }
    );
    const row = result.records[0];
    if (!row) return null;

    const profileId = String(row.get('profileId'));
    const profile = await getProfileByProfileId(profileId);

    return {
        groupId: String(row.get('groupId')),
        name: String(row.get('name')),
        profileId,
        did: getDidWeb(domain, profileId),
        signingReady: Boolean(profile && (await getPrimarySigningAuthorityForUser(profile))),
    };
};

const findOrCreateEcosystemManager = async (ecosystemId: string, name: string): Promise<string> => {
    const existing = await neogma.queryRunner.run(
        `MATCH (m:ProfileManager)-[:ADMINISTRATES]->(:Ecosystem {id: $ecosystemId})
         RETURN m.id AS id LIMIT 1`,
        { ecosystemId }
    );
    const found: unknown = existing.records[0]?.get('id');
    if (typeof found === 'string') return found;

    const manager = await createProfileManager({ displayName: name });
    await neogma.queryRunner.run(
        `MATCH (m:ProfileManager {id: $managerId}), (e:Ecosystem {id: $ecosystemId})
         MERGE (m)-[:ADMINISTRATES]->(e)`,
        { managerId: manager.id, ecosystemId }
    );
    return manager.id;
};

/**
 * Creates the ecosystem's managed issuing identity: a ProfileManager administering the
 * ecosystem manages a new Profile (underlying did:key, like createManagedProfile) attached
 * to an ADR-001 identity Group, with an LCA-managed signing key. Idempotent.
 */
export const provisionEcosystemIssuingIdentity = async (input: {
    ecosystemId: string;
    name: string;
    actorProfileId: string;
    domain: string;
}): Promise<EcosystemIssuingIdentity> => {
    await requireEcosystemRole(input.ecosystemId, input.actorProfileId, ['OWNER', 'ADMIN']);

    const existing = await getEcosystemIssuingIdentity(input.ecosystemId, input.domain);
    if (existing?.signingReady) return existing;

    let profileId = existing?.profileId;
    if (!profileId) {
        const managerId = await findOrCreateEcosystemManager(input.ecosystemId, input.name);
        profileId = `issuer-${randomUUID()}`;
        // No one holds this key: the managed signing authority signs on the identity's behalf.
        const did = (await getLearnCard(randomBytes(32).toString('hex'))).id.did();
        await createProfile({
            profileId,
            did,
            displayName: input.name,
            shortBio: '',
            bio: '',
        } as Parameters<typeof createProfile>[0]);
        await createManagesRelationship(managerId, profileId);
        await createGroup(
            {
                name: input.name,
                slug: issuingIdentitySlug(input.ecosystemId),
                type: 'administrative',
                ownerEcosystemId: input.ecosystemId,
                parentGroupId: null,
                identityProfileId: profileId,
                identityIssuanceEnabled: true,
                membershipMode: 'EXPLICIT',
                status: 'ACTIVE',
            } as Parameters<typeof createGroup>[0],
            { actorProfileId: input.actorProfileId }
        );
    }

    const profile = await getProfileByProfileId(profileId);
    if (!profile) throw new Error('Issuing identity Profile could not be read back.');
    await ensureManagedSigningAuthorityForProfile(profile, input.domain);

    const identity = await getEcosystemIssuingIdentity(input.ecosystemId, input.domain);
    if (!identity) throw new Error('Issuing identity could not be read back.');

    await createInstallIntentAuditEvent({
        action: 'ISSUING_IDENTITY_PROVISIONED',
        actorProfileId: input.actorProfileId,
        ecosystemId: input.ecosystemId,
        afterSummary: { groupId: identity.groupId, profileId: identity.profileId },
    });

    return identity;
};
