import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';

import { Profile, SigningAuthority } from '@models';
import { neogma } from '@instance';

import { app as didApp, normalizeDidDocument } from '../src/dids';
import { getUser } from './helpers/getClient';
import { getDidWeb } from '@helpers/did.helpers';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { createSigningAuthority } from '@accesslayer/signing-authority/create';
import { createUseSigningAuthorityRelationship } from '@accesslayer/signing-authority/relationships/create';
import { getSigningAuthoritiesForUser } from '@accesslayer/signing-authority/relationships/read';
import { deleteDidDocForProfile } from '@cache/did-docs';
import { DidDocument } from '@learncard/types';

const DOMAIN = 'localhost%3A3000';
const SA_ENDPOINT = 'http://localhost:4000';
const SA_DID = 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw';

const createRawSigningAuthorityRelationship = async (
    profileId: string,
    endpoint: string,
    name: string,
    did: string
): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (profile:Profile { profileId: $profileId })
         MATCH (signingAuthority:SigningAuthority { endpoint: $endpoint })
         CREATE (profile)-[:USES_SIGNING_AUTHORITY { name: $name, did: $did, isPrimary: false }]->(signingAuthority)`,
        { profileId, endpoint, name, did }
    );
};

describe('normalizeDidDocument', () => {
    const did = 'did:web:example.com:users:alice';

    it('rewrites fragment controllers on locally-hosted methods to the base DID', () => {
        const doc = {
            id: did,
            verificationMethod: [
                {
                    id: `${did}#lca-sa`,
                    type: 'Ed25519VerificationKey2020',
                    controller: `${did}#lca-sa`,
                    publicKeyMultibase: 'z6Mksg1V5WqRtChCHgptso9JccDH5XcT89EKAjK9wio2PtoQ',
                },
            ],
        } as unknown as DidDocument;

        const result = normalizeDidDocument(doc);

        expect(result.verificationMethod?.[0].controller).toBe(did);
        expect(result.verificationMethod?.[0].id).toBe(`${did}#lca-sa`);
    });

    it('leaves already-correct owner controllers untouched', () => {
        const doc = {
            id: did,
            verificationMethod: [
                {
                    id: `${did}#owner`,
                    type: 'Ed25519VerificationKey2020',
                    controller: did,
                    publicKeyMultibase: 'z6Mkn6NYjSu8XkvS2fMGHrWVy66qiif3YzUiKnjJBnL2WEMZ',
                },
            ],
        } as unknown as DidDocument;

        const result = normalizeDidDocument(doc);

        expect(result.verificationMethod?.[0].controller).toBe(did);
    });

    it('de-duplicates identical verification methods and reference arrays', () => {
        const saVm = {
            id: `${did}#lca-sa`,
            type: 'Ed25519VerificationKey2020',
            controller: `${did}#lca-sa`,
            publicKeyMultibase: 'z6Mksg1V5WqRtChCHgptso9JccDH5XcT89EKAjK9wio2PtoQ',
        };

        const doc = {
            id: did,
            verificationMethod: [saVm, { ...saVm }, { ...saVm }],
            assertionMethod: [`${did}#lca-sa`, `${did}#lca-sa`, `${did}#lca-sa`],
            authentication: [`${did}#lca-sa`, `${did}#lca-sa`],
        } as unknown as DidDocument;

        const result = normalizeDidDocument(doc);

        expect(result.verificationMethod).toHaveLength(1);
        expect(result.assertionMethod).toEqual([`${did}#lca-sa`]);
        expect(result.authentication).toEqual([`${did}#lca-sa`]);
    });

    it('preserves distinct keys while de-duplicating', () => {
        const doc = {
            id: did,
            verificationMethod: [
                {
                    id: `${did}#owner`,
                    type: 'Ed25519VerificationKey2020',
                    controller: did,
                    publicKeyMultibase: 'z6Mkn6NYjSu8XkvS2fMGHrWVy66qiif3YzUiKnjJBnL2WEMZ',
                },
                {
                    id: `${did}#lca-sa`,
                    type: 'Ed25519VerificationKey2020',
                    controller: `${did}#lca-sa`,
                    publicKeyMultibase: 'z6Mksg1V5WqRtChCHgptso9JccDH5XcT89EKAjK9wio2PtoQ',
                },
                {
                    id: `${did}#lca-sa`,
                    type: 'Ed25519VerificationKey2020',
                    controller: `${did}#lca-sa`,
                    publicKeyMultibase: 'z6Mksg1V5WqRtChCHgptso9JccDH5XcT89EKAjK9wio2PtoQ',
                },
            ],
        } as unknown as DidDocument;

        const result = normalizeDidDocument(doc);

        expect(result.verificationMethod).toHaveLength(2);
        const ids = result.verificationMethod?.map(vm => (vm as { id: string }).id);
        expect(ids).toContain(`${did}#owner`);
        expect(ids).toContain(`${did}#lca-sa`);
    });

    it('normalizes keyAgreement controllers to the base DID', () => {
        const doc = {
            id: did,
            keyAgreement: [
                {
                    id: `${did}#kak`,
                    type: 'X25519KeyAgreementKey2019',
                    controller: `${did}#kak`,
                    publicKeyBase58: 'FDpghMdHkqB8VuWAtorgDcamuixDydL8ai8rzoFq1siZ',
                },
            ],
        } as unknown as DidDocument;

        const result = normalizeDidDocument(doc);

        expect((result.keyAgreement?.[0] as { controller: string }).controller).toBe(did);
    });
});

describe('did:web profile document generation with signing authorities', () => {
    let user: Awaited<ReturnType<typeof getUser>>;
    const profileId = 'sa-did-user';

    beforeAll(async () => {
        await didApp.ready();
        user = await getUser('a'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await deleteDidDocForProfile(profileId);

        await user.clients.fullAuth.profile.createProfile({ profileId, displayName: 'SA User' });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await deleteDidDocForProfile(profileId);
    });

    it('never emits a fragment on a verificationMethod controller', async () => {
        const profile = await getProfileByProfileId(profileId);
        const sa = await createSigningAuthority(SA_ENDPOINT);
        await createUseSigningAuthorityRelationship(profile!, sa, 'lca-sa', SA_DID, true);
        await deleteDidDocForProfile(profileId);

        const response = await didApp.inject({
            method: 'GET',
            url: `/users/${profileId}/did.json`,
        });

        expect(response.statusCode).toBe(200);
        const doc = JSON.parse(response.body) as DidDocument;
        const did = getDidWeb(DOMAIN, profileId);

        expect(doc.id).toBe(did);
        (doc.verificationMethod ?? []).forEach(vm => {
            const controller = (vm as { controller: string }).controller;
            expect(controller).toBe(did);
            expect(controller).not.toContain('#');
        });

        const saVm = (doc.verificationMethod ?? []).find(
            vm => (vm as { id: string }).id === `${did}#lca-sa`
        );
        expect(saVm).toBeDefined();
        expect((saVm as { controller: string }).controller).toBe(did);
    });

    it('de-duplicates repeated signing-authority relationships in the rendered document', async () => {
        const profile = await getProfileByProfileId(profileId);
        await createSigningAuthority(SA_ENDPOINT);

        await createRawSigningAuthorityRelationship(profileId, SA_ENDPOINT, 'lca-sa', SA_DID);
        await createRawSigningAuthorityRelationship(profileId, SA_ENDPOINT, 'lca-sa', SA_DID);
        await createRawSigningAuthorityRelationship(profileId, SA_ENDPOINT, 'lca-sa', SA_DID);

        const relationships = await getSigningAuthoritiesForUser(profile!);
        expect(relationships.length).toBeGreaterThanOrEqual(3);

        await deleteDidDocForProfile(profileId);

        const response = await didApp.inject({
            method: 'GET',
            url: `/users/${profileId}/did.json`,
        });

        expect(response.statusCode).toBe(200);
        const doc = JSON.parse(response.body) as DidDocument;
        const did = getDidWeb(DOMAIN, profileId);

        const saVmCount = (doc.verificationMethod ?? []).filter(
            vm => (vm as { id: string }).id === `${did}#lca-sa`
        ).length;
        expect(saVmCount).toBe(1);

        const assertionSaCount = (doc.assertionMethod ?? []).filter(
            ref => ref === `${did}#lca-sa`
        ).length;
        expect(assertionSaCount).toBe(1);

        const vmIds = (doc.verificationMethod ?? []).map(vm => (vm as { id: string }).id);
        expect(new Set(vmIds).size).toBe(vmIds.length);
    });
});

describe('signing-authority relationship idempotency', () => {
    let user: Awaited<ReturnType<typeof getUser>>;
    const profileId = 'sa-idempotency-user';

    beforeAll(async () => {
        user = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });

        await user.clients.fullAuth.profile.createProfile({ profileId });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
    });

    it('does not create duplicate relationships when the same authority is registered repeatedly', async () => {
        const profile = await getProfileByProfileId(profileId);
        const sa = await createSigningAuthority(SA_ENDPOINT);

        await createUseSigningAuthorityRelationship(profile!, sa, 'lca-sa', SA_DID, true);
        await createUseSigningAuthorityRelationship(profile!, sa, 'lca-sa', SA_DID, true);
        await createUseSigningAuthorityRelationship(profile!, sa, 'lca-sa', SA_DID, true);

        const relationships = await getSigningAuthoritiesForUser(profile!);
        const matching = relationships.filter(
            rel => rel.relationship.name === 'lca-sa' && rel.relationship.did === SA_DID
        );

        expect(matching).toHaveLength(1);
    });

    it('keeps distinct authorities as separate relationships', async () => {
        const profile = await getProfileByProfileId(profileId);
        const sa = await createSigningAuthority(SA_ENDPOINT);

        await createUseSigningAuthorityRelationship(profile!, sa, 'lca-sa', SA_DID, true);
        await createUseSigningAuthorityRelationship(profile!, sa, 'other-sa', SA_DID, false);

        const relationships = await getSigningAuthoritiesForUser(profile!);
        const names = relationships.map(rel => rel.relationship.name);

        expect(names).toContain('lca-sa');
        expect(names).toContain('other-sa');
    });
});
