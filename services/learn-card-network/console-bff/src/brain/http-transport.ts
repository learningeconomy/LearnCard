import type { EcosystemRole, ProvisionableRole } from '@learncard/types';

import type { BrainServiceTransport } from './brain-service-client';

export type HttpBrainServiceTransportConfig = {
    baseUrl: string;
    fetchImpl?: typeof fetch;
};

export class HttpBrainServiceTransport implements BrainServiceTransport {
    private readonly base: string;
    private readonly fetchImpl: typeof fetch;

    constructor(config: HttpBrainServiceTransportConfig) {
        this.base = `${config.baseUrl.replace(/\/$/, '')}/api`;
        this.fetchImpl = config.fetchImpl ?? fetch;
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
