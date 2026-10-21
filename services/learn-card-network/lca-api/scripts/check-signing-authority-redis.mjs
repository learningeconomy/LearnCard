#!/usr/bin/env node
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Redis from 'ioredis';

const LEGACY_SEED_PATTERN = 'sa|*';

/** Read key names only. SCAN can repeat keys, so only a zero count proves absence. */
export const countLegacySigningAuthorityKeys = async redis => {
    let cursor = '0';
    let matches = 0;
    const deadline = Date.now() + 60_000;
    do {
        if (Date.now() >= deadline) throw new Error('Redis audit timed out.');
        const [nextCursor, keys] = await redis.scan(
            cursor,
            'MATCH',
            LEGACY_SEED_PATTERN,
            'COUNT',
            500
        );
        matches += keys.length;
        cursor = nextCursor;
    } while (cursor !== '0');
    return matches;
};

/** Require an explicit real endpoint; never fall back to an empty in-memory cache. */
export const getAuditRedisOptions = (env = process.env) => {
    const port = Number(env.REDIS_PORT);
    const db = Number(env.REDIS_DB ?? '0');
    if (
        !env.REDIS_HOST?.trim() ||
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65535 ||
        !Number.isInteger(db) ||
        db < 0 ||
        (env.REDIS_TLS !== undefined && !['true', 'false'].includes(env.REDIS_TLS))
    ) {
        throw new Error(
            'Set REDIS_HOST and REDIS_PORT; REDIS_DB defaults to 0 and REDIS_TLS accepts true or false.'
        );
    }
    return {
        host: env.REDIS_HOST,
        port,
        db,
        username: env.REDIS_USERNAME,
        password: env.REDIS_PASSWORD,
        ...(env.REDIS_TLS === 'true' ? { tls: {} } : {}),
        lazyConnect: true,
        connectTimeout: 2_000,
        commandTimeout: 5_000,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
    };
};

const main = async () => {
    let redis;
    try {
        const options = getAuditRedisOptions();
        redis = new Redis(options);
        // Driver errors can include endpoint/auth details; report only the sanitized failure below.
        redis.on('error', () => undefined);
        await redis.connect();
        const legacyKeyMatches = await countLegacySigningAuthorityKeys(redis);
        console.log(
            JSON.stringify({
                database: options.db,
                pattern: LEGACY_SEED_PATTERN,
                legacyKeyMatches,
                auditedAt: new Date().toISOString(),
            })
        );
        if (legacyKeyMatches > 0) {
            console.error(
                'Legacy signing-authority cache keys remain. Follow the seed-encryption runbook before completing rollout.'
            );
            process.exitCode = 1;
        }
    } catch {
        console.error(
            'Redis audit failed. Check REDIS_HOST, REDIS_PORT, optional REDIS_DB/TLS/auth settings, and private network access. No clean result was established.'
        );
        process.exitCode = 1;
    } finally {
        redis?.disconnect();
    }
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
