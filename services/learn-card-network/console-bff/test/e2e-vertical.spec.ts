import { describe, it, expect } from 'vitest';

import {
    TenantAuthPolicyValidator,
    type EcosystemRole,
    type ExternalIdentityBinding,
    type ProvisionableRole,
} from '@learncard/types';

import { ConsoleAuthService } from '../src/app';
import { LocalKeyManagementService } from '@kms';
import { DidDocumentService, InMemoryKeyDirectory } from '@did';
import { InMemoryRedis, SessionStore } from '@session';
import { ProviderRegistry, AuthCoordinatorProvider } from '@providers';
import {
    JitProvisioner,
    KmsManagedIdentityMinter,
    BrainServiceMembershipGranter,
    MongoBindingRepository,
    type BindingCollectionLike,
    type MembershipWriter,
    type ProfileCreator,
} from '@provisioning';

const policy = TenantAuthPolicyValidator.parse({
    tenantId: 'lef',
    rootEcosystemId: 'eco_root',
    allowJit: true,
    defaultRole: 'MEMBER',
    sessionTtlSeconds: 3600,
    providers: [{ providerId: 'lef-wallet', kind: 'auth-coordinator', enabled: true }],
});

describe('console-bff end-to-end vertical (transport faked)', () => {
    it('logs a new user in: mints managed DID, provisions membership, issues session, DID resolves', async () => {
        const kms = new LocalKeyManagementService();
        const directory = new InMemoryKeyDirectory();

        const createdProfiles: string[] = [];
        const profiles: ProfileCreator = {
            async createManagedProfile({ did }) {
                createdProfiles.push(did);
            },
        };
        const membershipCalls: Array<{
            ecosystemId: string;
            role: EcosystemRole | ProvisionableRole;
        }> = [];
        const membershipWriter: MembershipWriter = {
            async grantMembership({ ecosystemId, role }) {
                membershipCalls.push({ ecosystemId, role });
            },
        };
        const bindingRows: ExternalIdentityBinding[] = [];
        const collection: BindingCollectionLike = {
            async findOne(f) {
                return (
                    bindingRows.find(
                        r =>
                            r.tenantId === f.tenantId &&
                            r.issuer === f.issuer &&
                            r.subject === f.subject
                    ) ?? null
                );
            },
            async updateOne(f: any, u: any) {
                const i = bindingRows.findIndex(
                    r =>
                        r.tenantId === f.tenantId &&
                        r.issuer === f.issuer &&
                        r.subject === f.subject
                );
                if (i >= 0) bindingRows[i] = { ...bindingRows[i]!, ...u.$set };
                else bindingRows.push(u.$set);
                return {};
            },
        };

        const jit = new JitProvisioner({
            minter: new KmsManagedIdentityMinter({
                kms,
                directory,
                profiles,
                consoleDomain: 'console.lef.org',
            }),
            membership: new BrainServiceMembershipGranter(membershipWriter),
            bindings: new MongoBindingRepository(collection),
        });

        const registry = new ProviderRegistry().register(
            'auth-coordinator',
            config =>
                new AuthCoordinatorProvider({
                    providerId: config.providerId,
                    jit,
                    resolvePolicy: async () => policy,
                    verifyDidAuth: async vp => ({ did: `did:key:${vp}`, assuranceLevel: 'mfa' }),
                })
        );

        const service = new ConsoleAuthService({
            registry,
            sessions: new SessionStore({ redis: new InMemoryRedis(), minTtlSeconds: 60 }),
            resolvePolicy: async () => policy,
        });

        const session = await service.completeLogin({
            tenantId: 'lef',
            providerId: 'lef-wallet',
            params: { vp: 'z-user-1' },
        });

        expect(session.managedDid.startsWith('did:web:console.lef.org:p:')).toBe(true);
        expect(createdProfiles).toEqual([session.managedDid]);
        expect(membershipCalls).toEqual([{ ecosystemId: 'eco_root', role: 'MEMBER' }]);
        expect(bindingRows).toHaveLength(1);
        expect(bindingRows[0]!.status).toBe('ACTIVE');

        const docService = new DidDocumentService({ kms, directory });
        const doc = await docService.resolve(session.managedDid);
        expect(doc?.id).toBe(session.managedDid);
    });
});
