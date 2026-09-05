import { randomUUID } from 'crypto';

import type { EcosystemRole, LCNOrganizationDetails, ProvisionableRole } from '@learncard/types';

import type { BrainServiceTransport } from './brain-service-client';

// Dev-only transport: lets console-bff boot and exercise the full login/provisioning flow
// without a running brain-service. It records calls instead of hitting the network.
export class StubBrainServiceTransport implements BrainServiceTransport {
    async trpcQuery<T>(_bearer: string, path: string, input: unknown): Promise<T> {
        console.info('[stub-brain] trpcQuery', path, input);
        return {} as T;
    }

    async trpcMutation<T>(_bearer: string, path: string, input: unknown): Promise<T> {
        console.info('[stub-brain] trpcMutation', path, input);
        return {} as T;
    }

    async requestChallenge(): Promise<string> {
        return randomUUID();
    }

    async createProfile(
        _bearer: string,
        body: {
            profileId: string;
            displayName?: string;
            type?: string;
            organization?: LCNOrganizationDetails;
        }
    ): Promise<void> {
        console.info('[stub-brain] createProfile', body.profileId);
    }

    async grantProvisionedMembership(
        _bearer: string,
        body: { ecosystemId: string; profileId: string; role: EcosystemRole | ProvisionableRole }
    ): Promise<void> {
        console.info('[stub-brain] grantProvisionedMembership', body);
    }
}
