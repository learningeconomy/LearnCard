import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createPublicKey, verify as nodeVerify, randomUUID } from 'crypto';

import { TenantAuthPolicyValidator } from '@learncard/types';

import { ConsoleAuthService } from '../src/app';
import { LocalKeyManagementService, type KeyManagementService } from '@kms';
import { DidDocumentService, InMemoryKeyDirectory, didWebFromDomain } from '@did';
import { InMemoryRedis, SessionStore } from '@session';
import { ProviderRegistry, AuthCoordinatorProvider } from '@providers';
import {
    JitProvisioner,
    KmsManagedIdentityMinter,
    BrainServiceMembershipGranter,
    createMongoBindingRepository,
} from '@provisioning';
import {
    DidAuthProfileCreator,
    ServiceDidMembershipWriter,
    type BrainServiceTransport,
} from '@brain';

const decode = (jwt: string, i: number) =>
    JSON.parse(Buffer.from(jwt.split('.')[i]!, 'base64url').toString());

// Emulates brain-service: crypto-verifies the DID-Auth bearer against the DID document served
// by console-bff (ES256/JsonWebKey2020, the path Oracle proved DIDKit accepts) and enforces
// that the presented nonce matches the challenge it issued for that holder.
class VerifyingBrainService implements BrainServiceTransport {
    profiles: string[] = [];
    memberships: Array<{ ecosystemId: string; profileId: string; role: string }> = [];
    private challenges = new Map<string, string>();

    constructor(
        private readonly kms: KeyManagementService,
        private readonly directory: InMemoryKeyDirectory
    ) {}

    async requestChallenge(bootstrapBearer: string): Promise<string> {
        const holder = (decode(bootstrapBearer, 1).vp as { holder: string }).holder;
        const challenge = randomUUID();
        this.challenges.set(holder, challenge);
        return challenge;
    }

    private async verify(bearer: string): Promise<string> {
        const [h, p, s] = bearer.split('.');
        const payload = decode(bearer, 1);
        const holder = (payload.vp as { holder: string }).holder;

        if (payload.nonce !== this.challenges.get(holder)) {
            throw new Error('challenge mismatch');
        }

        const ref = await this.directory.getKeyRef(holder);
        if (!ref) throw new Error('unresolvable did');

        const publicKey = createPublicKey({
            key: (await this.kms.getPublicKeyJwk(ref)) as any,
            format: 'jwk',
        });
        const ok = nodeVerify(
            'SHA256',
            Buffer.from(`${h}.${p}`),
            { key: publicKey, dsaEncoding: 'ieee-p1363' },
            Buffer.from(s!, 'base64url')
        );
        if (!ok) throw new Error('invalid signature');

        return holder;
    }

    async createProfile(bearer: string, body: { profileId: string }): Promise<void> {
        await this.verify(bearer);
        this.profiles.push(body.profileId);
    }

    async grantProvisionedMembership(
        bearer: string,
        body: { ecosystemId: string; profileId: string; role: string }
    ): Promise<void> {
        await this.verify(bearer);
        this.memberships.push(body);
    }
}

let mongod: MongoMemoryServer;
let client: MongoClient;
let db: Db;

describe('console-bff real-spine integration (real Mongo + KMS + DID + DID-auth transport)', () => {
    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        client = new MongoClient(mongod.getUri());
        await client.connect();
        db = client.db('console-bff-e2e');
    }, 120000);

    afterAll(async () => {
        await client?.close();
        await mongod?.stop();
    });

    it('completes a JIT login end to end with brain-service-grade bearer verification', async () => {
        const kms = new LocalKeyManagementService();
        const directory = new InMemoryKeyDirectory();
        const transport = new VerifyingBrainService(kms, directory);

        const serviceDid = didWebFromDomain('console.lef.org', 'service');
        const serviceKeyRef = await kms.generateSigningKey({ tenantId: 'lef', alias: 'service' });
        await directory.put(serviceDid, serviceKeyRef);

        const bindings = await createMongoBindingRepository(db);

        const jit = new JitProvisioner({
            minter: new KmsManagedIdentityMinter({
                kms,
                directory,
                profiles: new DidAuthProfileCreator({
                    kms,
                    transport,
                    keyRefFor: d => directory.getKeyRef(d),
                }),
                consoleDomain: 'console.lef.org',
            }),
            membership: new BrainServiceMembershipGranter(
                new ServiceDidMembershipWriter({ kms, transport, serviceDid, serviceKeyRef })
            ),
            bindings,
        });

        const policy = TenantAuthPolicyValidator.parse({
            tenantId: 'lef',
            rootEcosystemId: 'eco_root',
            allowJit: true,
            defaultRole: 'MEMBER',
            providers: [{ providerId: 'lef-wallet', kind: 'auth-coordinator', enabled: true }],
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
            params: { vp: 'z-user-42' },
        });

        expect(transport.profiles).toHaveLength(1);
        expect(transport.memberships).toEqual([
            { ecosystemId: 'eco_root', profileId: transport.profiles[0], role: 'MEMBER' },
        ]);

        const stored = await bindings.findBySubject(
            'lef',
            'urn:learncard:auth-coordinator',
            'did:key:z-user-42'
        );
        expect(stored?.status).toBe('ACTIVE');
        expect(stored?.managedDid).toBe(session.managedDid);

        const docService = new DidDocumentService({ kms, directory });
        expect((await docService.resolve(session.managedDid))?.id).toBe(session.managedDid);
    });
});
