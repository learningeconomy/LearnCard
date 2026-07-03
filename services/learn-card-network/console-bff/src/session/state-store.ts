import { randomUUID } from 'crypto';

import type { RedisLike } from './redis-like';

const STATE_KEY_PREFIX = 'console-login-state:';

export type LoginState = { tenantId: string; providerId: string };

export class LoginStateStore {
    constructor(private readonly redis: RedisLike, private readonly ttlSeconds: number = 600) {}

    async issue(state: LoginState): Promise<string> {
        const id = randomUUID();

        await this.redis.set(
            `${STATE_KEY_PREFIX}${id}`,
            JSON.stringify(state),
            'EX',
            this.ttlSeconds
        );

        return id;
    }

    async consume(id: string): Promise<LoginState | null> {
        const raw = await this.redis.get(`${STATE_KEY_PREFIX}${id}`);

        if (!raw) return null;

        await this.redis.del(`${STATE_KEY_PREFIX}${id}`);

        try {
            return JSON.parse(raw) as LoginState;
        } catch {
            return null;
        }
    }
}
