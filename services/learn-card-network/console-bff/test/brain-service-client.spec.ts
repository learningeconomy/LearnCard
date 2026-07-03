import { describe, it, expect } from 'vitest';

import type { EcosystemRole, ProvisionableRole } from '@learncard/types';

import { LocalKeyManagementService, type ManagedKeyRef } from '@kms';
import { InMemoryKeyDirectory } from '@did';
import {
    DidAuthBearerFactory,
    buildDidAuthVpPayload,
    DidAuthProfileCreator,
    ServiceDidMembershipWriter,
    type BrainServiceTransport,
} from '@brain';

const decodePayload = (jwt: string): Record<string, unknown> =>
    JSON.parse(Buffer.from(jwt.split('.')[1]!, 'base64url').toString());

class RecordingTransport implements BrainServiceTransport {
    challenge = 'server-challenge-xyz';
    bootstrapBearers: string[] = [];
    profileCalls: Array<{ bearer: string; body: unknown }> = [];
    membershipCalls: Array<{ bearer: string; body: unknown }> = [];

    async requestChallenge(bootstrapBearer: string): Promise<string> {
        this.bootstrapBearers.push(bootstrapBearer);
        return this.challenge;
    }

    async createProfile(bearer: string, body: { profileId: string; displayName?: string }) {
        this.profileCalls.push({ bearer, body });
    }

    async grantProvisionedMembership(
        bearer: string,
        body: { ecosystemId: string; profileId: string; role: EcosystemRole | ProvisionableRole }
    ) {
        this.membershipCalls.push({ bearer, body });
    }
}

describe('DidAuthBearerFactory', () => {
    it('binds the returned challenge as the nonce and the DID as holder', async () => {
        const kms = new LocalKeyManagementService();
        const did = 'did:web:console.lef.org:p:01';
        const ref = await kms.generateSigningKey({ tenantId: 'lef', alias: 'p:01' });

        const bearer = await new DidAuthBearerFactory(kms).createBearer(did, ref, 'nonce-1');
        const payload = decodePayload(bearer);

        expect(payload).toMatchObject(buildDidAuthVpPayload(did, 'nonce-1'));
        expect((payload.vp as Record<string, unknown>).holder).toBe(did);
        expect(payload.nonce).toBe('nonce-1');
    });
});

describe('DidAuthProfileCreator', () => {
    it('self-authenticates as the managed DID and creates its own profile', async () => {
        const kms = new LocalKeyManagementService();
        const directory = new InMemoryKeyDirectory();
        const did = 'did:web:console.lef.org:p:99';
        const ref = await kms.generateSigningKey({ tenantId: 'lef', alias: 'p:99' });
        await directory.put(did, ref);

        const transport = new RecordingTransport();
        const creator = new DidAuthProfileCreator({
            kms,
            transport,
            keyRefFor: d => directory.getKeyRef(d),
        });

        await creator.createManagedProfile({ did, profileId: 'p99' });

        expect(transport.profileCalls).toHaveLength(1);
        const { bearer, body } = transport.profileCalls[0]!;
        expect(body).toEqual({ profileId: 'p99', displayName: undefined });
        expect(decodePayload(bearer).nonce).toBe(transport.challenge);
        expect((decodePayload(bearer).vp as Record<string, unknown>).holder).toBe(did);
    });

    it('throws if the managed key is not registered', async () => {
        const kms = new LocalKeyManagementService();
        const creator = new DidAuthProfileCreator({
            kms,
            transport: new RecordingTransport(),
            keyRefFor: async () => null,
        });

        await expect(
            creator.createManagedProfile({ did: 'did:web:x:p:1', profileId: 'p1' })
        ).rejects.toThrow(/No managed key/);
    });
});

describe('ServiceDidMembershipWriter', () => {
    it('authenticates as the service DID and calls the provisioned-membership endpoint', async () => {
        const kms = new LocalKeyManagementService();
        const serviceDid = 'did:web:console.lef.org:service:provisioner';
        const serviceKeyRef: ManagedKeyRef = await kms.generateSigningKey({
            tenantId: 'lef',
            alias: 'service',
        });

        const transport = new RecordingTransport();
        const writer = new ServiceDidMembershipWriter({
            kms,
            transport,
            serviceDid,
            serviceKeyRef,
        });

        await writer.grantMembership({ ecosystemId: 'eco_root', profileId: 'p99', role: 'MEMBER' });

        expect(transport.membershipCalls).toHaveLength(1);
        const { bearer, body } = transport.membershipCalls[0]!;
        expect(body).toEqual({ ecosystemId: 'eco_root', profileId: 'p99', role: 'MEMBER' });
        expect((decodePayload(bearer).vp as Record<string, unknown>).holder).toBe(serviceDid);
        expect(decodePayload(bearer).nonce).toBe(transport.challenge);
    });
});
