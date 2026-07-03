import { describe, it, expect } from 'vitest';

import type { ExternalIdentityBinding } from '@learncard/types';

import { LocalKeyManagementService } from '@kms';
import { DidDocumentService, InMemoryKeyDirectory } from '@did';
import {
    KmsManagedIdentityMinter,
    BrainServiceMembershipGranter,
    MongoBindingRepository,
    type ProfileCreator,
    type MembershipWriter,
    type BindingCollectionLike,
} from '@provisioning';

describe('KmsManagedIdentityMinter', () => {
    it('mints a key + tenant-domain did:web and registers it so the DID doc resolves', async () => {
        const kms = new LocalKeyManagementService();
        const directory = new InMemoryKeyDirectory();
        const created: Array<{ did: string; profileId: string }> = [];
        const profiles: ProfileCreator = {
            async createManagedProfile(params) {
                created.push(params);
            },
        };

        const minter = new KmsManagedIdentityMinter({
            kms,
            directory,
            profiles,
            consoleDomain: 'console.lef.org',
        });

        const identity = await minter.mint({ tenantId: 'lef', ecosystemId: 'eco_root' });

        expect(identity.managedDid.startsWith('did:web:console.lef.org:p:')).toBe(true);
        expect(created).toHaveLength(1);
        expect(created[0]!.did).toBe(identity.managedDid);

        const docService = new DidDocumentService({ kms, directory });
        const doc = await docService.resolve(identity.managedDid);

        expect(doc?.id).toBe(identity.managedDid);
        expect(doc?.verificationMethod[0]!.type).toBe('JsonWebKey2020');
    });
});

describe('BrainServiceMembershipGranter', () => {
    it('delegates grants to the membership writer', async () => {
        const calls: unknown[] = [];
        const writer: MembershipWriter = {
            async grantMembership(params) {
                calls.push(params);
            },
        };

        await new BrainServiceMembershipGranter(writer).grant({
            profileId: 'p1',
            ecosystemId: 'eco_root',
            role: 'MEMBER',
        });

        expect(calls).toEqual([{ profileId: 'p1', ecosystemId: 'eco_root', role: 'MEMBER' }]);
    });
});

describe('MongoBindingRepository', () => {
    const fakeCollection = () => {
        const rows: ExternalIdentityBinding[] = [];
        const collection: BindingCollectionLike = {
            async findOne(filter) {
                return (
                    rows.find(
                        r =>
                            r.tenantId === filter.tenantId &&
                            r.issuer === filter.issuer &&
                            r.subject === filter.subject
                    ) ?? null
                );
            },
            async updateOne(filter: any, update: any) {
                const idx = rows.findIndex(
                    r =>
                        r.tenantId === filter.tenantId &&
                        r.issuer === filter.issuer &&
                        r.subject === filter.subject
                );
                if (idx >= 0) rows[idx] = { ...rows[idx]!, ...update.$set };
                else rows.push(update.$set as ExternalIdentityBinding);
                return {};
            },
        };
        return { rows, collection };
    };

    const binding = (): ExternalIdentityBinding => ({
        tenantId: 'lef',
        ecosystemId: 'eco_root',
        providerId: 'lef-oidc',
        issuer: 'https://idp.example',
        subject: 'sub-1',
        profileId: 'p1',
        managedDid: 'did:web:console.lef.org:p:1',
        provisioningSource: 'JIT',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
    });

    it('upserts and reads back a binding by (tenant, issuer, subject)', async () => {
        const { collection } = fakeCollection();
        const repo = new MongoBindingRepository(collection);

        await repo.save(binding());
        const found = await repo.findBySubject('lef', 'https://idp.example', 'sub-1');

        expect(found?.profileId).toBe('p1');
    });

    it('touches lastLoginAt without replacing the row', async () => {
        const { collection } = fakeCollection();
        const repo = new MongoBindingRepository(collection);

        await repo.save(binding());
        await repo.touchLastLogin(
            'lef',
            'https://idp.example',
            'sub-1',
            '2030-01-01T00:00:00.000Z'
        );

        const found = await repo.findBySubject('lef', 'https://idp.example', 'sub-1');
        expect(found?.lastLoginAt).toBe('2030-01-01T00:00:00.000Z');
        expect(found?.status).toBe('ACTIVE');
    });
});
