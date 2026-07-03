import type { EcosystemRole, ProvisionableRole } from '@learncard/types';

import type { KeyManagementService, ManagedKeyRef } from '@kms';

import type { ProfileCreator, MembershipWriter } from '@provisioning';

import { DidAuthBearerFactory } from './did-auth';

export interface BrainServiceTransport {
    requestChallenge(bootstrapBearer: string): Promise<string>;
    createProfile(bearer: string, body: { profileId: string; displayName?: string }): Promise<void>;
    grantProvisionedMembership(
        bearer: string,
        body: { ecosystemId: string; profileId: string; role: EcosystemRole | ProvisionableRole }
    ): Promise<void>;
}

const BOOTSTRAP_NONCE = 'bootstrap';

async function authorizedCall<T>(
    bearerFactory: DidAuthBearerFactory,
    transport: BrainServiceTransport,
    did: string,
    keyRef: ManagedKeyRef,
    run: (bearer: string) => Promise<T>
): Promise<T> {
    const bootstrap = await bearerFactory.createBearer(did, keyRef, BOOTSTRAP_NONCE);
    const challenge = await transport.requestChallenge(bootstrap);
    const bearer = await bearerFactory.createBearer(did, keyRef, challenge);

    return run(bearer);
}

export type DidAuthProfileCreatorDeps = {
    kms: KeyManagementService;
    transport: BrainServiceTransport;
    keyRefFor: (did: string) => Promise<ManagedKeyRef | null>;
};

export class DidAuthProfileCreator implements ProfileCreator {
    private readonly bearerFactory: DidAuthBearerFactory;

    constructor(private readonly deps: DidAuthProfileCreatorDeps) {
        this.bearerFactory = new DidAuthBearerFactory(deps.kms);
    }

    async createManagedProfile(params: {
        did: string;
        profileId: string;
        displayName?: string;
    }): Promise<void> {
        const keyRef = await this.deps.keyRefFor(params.did);

        if (!keyRef) throw new Error(`No managed key registered for ${params.did}`);

        await authorizedCall(this.bearerFactory, this.deps.transport, params.did, keyRef, bearer =>
            this.deps.transport.createProfile(bearer, {
                profileId: params.profileId,
                displayName: params.displayName,
            })
        );
    }
}

export type ServiceDidMembershipWriterDeps = {
    kms: KeyManagementService;
    transport: BrainServiceTransport;
    serviceDid: string;
    serviceKeyRef: ManagedKeyRef;
};

export class ServiceDidMembershipWriter implements MembershipWriter {
    private readonly bearerFactory: DidAuthBearerFactory;

    constructor(private readonly deps: ServiceDidMembershipWriterDeps) {
        this.bearerFactory = new DidAuthBearerFactory(deps.kms);
    }

    async grantMembership(params: {
        ecosystemId: string;
        profileId: string;
        role: EcosystemRole | ProvisionableRole;
    }): Promise<void> {
        await authorizedCall(
            this.bearerFactory,
            this.deps.transport,
            this.deps.serviceDid,
            this.deps.serviceKeyRef,
            bearer => this.deps.transport.grantProvisionedMembership(bearer, params)
        );
    }
}
