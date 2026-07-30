import type { EcosystemRole, ProvisionableRole } from '@learncard/types';

import type { BrainServiceTransport } from './brain-service-client';

export type HttpBrainServiceTransportConfig = {
    baseUrl: string;
    fetchImpl?: typeof fetch;
};

export class HttpBrainServiceTransport implements BrainServiceTransport {
    private readonly base: string;
    private readonly trpcBase: string;
    private readonly fetchImpl: typeof fetch;

    constructor(config: HttpBrainServiceTransportConfig) {
        this.base = `${config.baseUrl.replace(/\/$/, '')}/api`;
        this.trpcBase = `${config.baseUrl.replace(/\/$/, '')}/trpc`;
        this.fetchImpl = config.fetchImpl ?? fetch;
    }

    async trpcQuery<T>(bearer: string, path: string, input: unknown): Promise<T> {
        const url = new URL(`${this.trpcBase}/${path}`);
        if (input !== undefined) {
            url.searchParams.set('input', JSON.stringify(input));
        }
        const res = await this.fetchImpl(url.toString(), {
            method: 'GET',
            headers: { authorization: `Bearer ${bearer}` },
        });
        const json = await res.json();
        if (!res.ok || json.error)
            throw new Error(json.error?.message || `tRPC query failed: ${res.status}`);
        return json.result.data as T;
    }

    async trpcMutation<T>(bearer: string, path: string, input: unknown): Promise<T> {
        const res = await this.fetchImpl(`${this.trpcBase}/${path}`, {
            method: 'POST',
            headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
            body: JSON.stringify(input),
        });
        const json = await res.json();
        if (!res.ok || json.error)
            throw new Error(json.error?.message || `tRPC mutation failed: ${res.status}`);
        return json.result.data as T;
    }

    async requestChallenge(bootstrapBearer: string): Promise<string> {
        const res = await this.fetchImpl(`${this.base}/challenges?amount=1`, {
            method: 'GET',
            headers: { authorization: `Bearer ${bootstrapBearer}` },
        });

        if (!res.ok) throw new Error(`getChallenges failed: ${res.status}`);

        const challenges = (await res.json()) as string[];
        const challenge = challenges[0];

        if (!challenge) throw new Error('brain-service returned no challenge');

        return challenge;
    }

    async createProfile(
        bearer: string,
        body: { profileId: string; displayName?: string }
    ): Promise<void> {
        const res = await this.fetchImpl(`${this.base}/profile/create`, {
            method: 'POST',
            headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
            body: JSON.stringify({
                profileId: body.profileId,
                displayName: body.displayName ?? body.profileId,
            }),
        });

        if (!res.ok) throw new Error(`createProfile failed: ${res.status}`);
    }

    async grantProvisionedMembership(
        bearer: string,
        body: { ecosystemId: string; profileId: string; role: EcosystemRole | ProvisionableRole }
    ): Promise<void> {
        const res = await this.fetchImpl(
            `${this.base}/ecosystem/${encodeURIComponent(body.ecosystemId)}/members/provisioned`,
            {
                method: 'POST',
                headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
                body: JSON.stringify({ profileId: body.profileId, role: body.role }),
            }
        );

        if (!res.ok) throw new Error(`grantProvisionedMembership failed: ${res.status}`);
    }
}
