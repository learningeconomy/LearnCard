import { randomUUID } from 'crypto';

import { DashboardSessionValidator, type DashboardSession } from '@learncard/types';

import type { RedisLike } from './redis-like';

const SESSION_KEY_PREFIX = 'console-session:';
const PROFILE_INDEX_PREFIX = 'console-session-profile:';

// ADR-001 §3.10 de-provisioning: sessions must be short enough that a revoked
// binding stops working promptly, hence a hard 5-minute floor on TTL.
const MIN_SESSION_TTL_SECONDS = 300;

export type NewSessionInput = Omit<DashboardSession, 'sessionId' | 'authTime' | 'expiresAt'>;

export type SessionStoreConfig = {
    redis: RedisLike;
    minTtlSeconds?: number;
};

export class SessionStore {
    private readonly redis: RedisLike;
    private readonly minTtlSeconds: number;

    constructor(config: SessionStoreConfig) {
        this.redis = config.redis;
        this.minTtlSeconds = config.minTtlSeconds ?? MIN_SESSION_TTL_SECONDS;
    }

    async create(input: NewSessionInput, ttlSeconds: number): Promise<DashboardSession> {
        const ttl = Math.max(ttlSeconds, this.minTtlSeconds);
        const now = new Date();
        const sessionId = randomUUID();

        const session = DashboardSessionValidator.parse({
            ...input,
            sessionId,
            authTime: now.toISOString(),
            expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
        });

        await this.redis.set(this.key(sessionId), JSON.stringify(session), 'EX', ttl);
        await this.redis.sadd(this.profileKey(session.profileId), sessionId);
        await this.redis.expire(this.profileKey(session.profileId), ttl);

        return session;
    }

    async get(sessionId: string): Promise<DashboardSession | null> {
        const raw = await this.redis.get(this.key(sessionId));

        if (!raw) return null;

        const parsed = DashboardSessionValidator.safeParse(JSON.parse(raw));

        if (!parsed.success) return null;

        if (new Date(parsed.data.expiresAt).getTime() <= Date.now()) {
            await this.destroy(sessionId);

            return null;
        }

        return parsed.data;
    }

    async refresh(sessionId: string, ttlSeconds: number): Promise<DashboardSession | null> {
        const session = await this.get(sessionId);

        if (!session) return null;

        const ttl = Math.max(ttlSeconds, this.minTtlSeconds);
        const refreshed: DashboardSession = {
            ...session,
            expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
        };

        await this.redis.set(this.key(sessionId), JSON.stringify(refreshed), 'EX', ttl);
        await this.redis.expire(this.profileKey(session.profileId), ttl);

        return refreshed;
    }

    async destroy(sessionId: string): Promise<void> {
        const session = await this.get(sessionId);

        await this.redis.del(this.key(sessionId));

        if (session) await this.redis.srem(this.profileKey(session.profileId), sessionId);
    }

    async destroyAllForProfile(profileId: string): Promise<number> {
        const sessionIds = await this.redis.smembers(this.profileKey(profileId));

        if (sessionIds.length > 0) {
            await this.redis.del(...sessionIds.map(id => this.key(id)));
        }

        await this.redis.del(this.profileKey(profileId));

        return sessionIds.length;
    }

    private key(sessionId: string): string {
        return `${SESSION_KEY_PREFIX}${sessionId}`;
    }

    private profileKey(profileId: string): string {
        return `${PROFILE_INDEX_PREFIX}${profileId}`;
    }
}
