import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { neogma } from '@instance';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { grantEcosystemMembership } from '@accesslayer/ecosystem/membership';
import { createProfile } from '@accesslayer/profile/create';
import { requireManagedIdentityProfile } from '@helpers/group.helpers';
import { resolveRecordIssuer } from '@helpers/platform-issuance.helpers';
import { getClient } from './helpers/getClient';

const setup = async () => {
    const id = randomUUID();
    const ownerDid = `did:key:z6MkIssuingOwner${id.replace(/-/g, '')}`;
    const memberDid = `did:key:z6MkIssuingMember${id.replace(/-/g, '')}`;
    const owner = await createProfile({
        profileId: `owner-${id}`,
        did: ownerDid,
        displayName: 'Owner',
    } as Parameters<typeof createProfile>[0]);
    const member = await createProfile({
        profileId: `member-${id}`,
        did: memberDid,
        displayName: 'Member',
    } as Parameters<typeof createProfile>[0]);
    const ecosystem = await createEcosystem({
        name: 'District',
        slug: `district-${id}`,
        ownerProfileId: owner!.profileId,
        parentEcosystemId: null,
        description: undefined,
        settings: {},
        status: 'ACTIVE',
    });
    await grantEcosystemMembership({
        profileId: member!.profileId,
        ecosystemId: ecosystem.id,
        role: 'MEMBER',
    });

    return {
        ecosystem,
        owner: getClient({ did: ownerDid, isChallengeValid: true }),
        member: getClient({ did: memberDid, isChallengeValid: true }),
    };
};

describe('Ecosystem issuing identity (ADR-001, RFC 2026-10 decision 4)', () => {
    it('provisions a managed, signing-ready identity idempotently', async () => {
        const { ecosystem, owner } = await setup();
        expect(await owner.ecosystem.getIssuingIdentity({ id: ecosystem.id })).toBeNull();

        const identity = await owner.ecosystem.provisionIssuingIdentity({
            id: ecosystem.id,
            name: 'Springfield District',
        });
        expect(identity).toMatchObject({ name: 'Springfield District', signingReady: true });
        expect(identity.did).toContain(`:users:${identity.profileId}`);

        // The stored DID is the underlying did:key; did:web is derived, never stored.
        const stored = await neogma.queryRunner.run(
            'MATCH (p:Profile {profileId: $profileId}) RETURN p.did AS did',
            { profileId: identity.profileId }
        );
        expect(String(stored.records[0]?.get('did'))).toMatch(/^did:key:/);
        await expect(
            requireManagedIdentityProfile(identity.profileId, ecosystem.id)
        ).resolves.toBeUndefined();

        const again = await owner.ecosystem.provisionIssuingIdentity({
            id: ecosystem.id,
            name: 'Springfield District',
        });
        expect(again.groupId).toBe(identity.groupId);
        expect(await owner.ecosystem.getIssuingIdentity({ id: ecosystem.id })).toEqual(identity);
    });

    it('is usable by Platform Issuance as a pinned issuer', async () => {
        const { ecosystem, owner } = await setup();
        const identity = await owner.ecosystem.provisionIssuingIdentity({
            id: ecosystem.id,
            name: 'Springfield District',
        });
        const issuer = await resolveRecordIssuer(ecosystem.id, {
            issuerGroupId: identity.groupId,
            issuerIdentityProfileId: identity.profileId,
        });
        expect(typeof issuer).not.toBe('string');
    });

    it('lets only owners and admins provision', async () => {
        const { ecosystem, member } = await setup();
        await expect(
            member.ecosystem.provisionIssuingIdentity({ id: ecosystem.id, name: 'Nope' })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
});
