export interface RedisLike {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, mode: 'EX', ttlSeconds: number): Promise<unknown>;
    del(...keys: string[]): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<number>;
    sadd(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    srem(key: string, ...members: string[]): Promise<number>;
}

type Entry = { value: string; expiresAt: number | null };

export class InMemoryRedis implements RedisLike {
    private readonly strings = new Map<string, Entry>();
    private readonly sets = new Map<string, Set<string>>();

    async get(key: string): Promise<string | null> {
        const entry = this.strings.get(key);

        if (!entry) return null;

        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            this.strings.delete(key);

            return null;
        }

        return entry.value;
    }

    async set(key: string, value: string, _mode: 'EX', ttlSeconds: number): Promise<unknown> {
        this.strings.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });

        return 'OK';
    }

    async del(...keys: string[]): Promise<number> {
        let removed = 0;

        for (const key of keys) {
            if (this.strings.delete(key)) removed += 1;
            if (this.sets.delete(key)) removed += 1;
        }

        return removed;
    }

    async expire(key: string, ttlSeconds: number): Promise<number> {
        const entry = this.strings.get(key);

        if (!entry) return 0;

        entry.expiresAt = Date.now() + ttlSeconds * 1000;

        return 1;
    }

    async sadd(key: string, ...members: string[]): Promise<number> {
        const set = this.sets.get(key) ?? new Set<string>();
        let added = 0;

        for (const member of members) {
            if (!set.has(member)) added += 1;
            set.add(member);
        }

        this.sets.set(key, set);

        return added;
    }

    async smembers(key: string): Promise<string[]> {
        return [...(this.sets.get(key) ?? [])];
    }

    async srem(key: string, ...members: string[]): Promise<number> {
        const set = this.sets.get(key);

        if (!set) return 0;

        let removed = 0;

        for (const member of members) {
            if (set.delete(member)) removed += 1;
        }

        return removed;
    }
}
