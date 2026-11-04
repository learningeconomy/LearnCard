import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import { configureProductionLogging } from '../src/logging';

const legacyCachePatterns = [
    'topics:did:*',
    'topic-generation:topics:did:*',
    'ai-insight-generation:did:*',
    'credential-ingestion-state:did:*',
];
const assertMaintenanceOwner = async (redis: Redis, key: string, token: string) => {
    if ((await redis.get(key)) !== token) throw new Error('Privacy maintenance ownership was lost');
};
const migrateLegacyCaches = async (
    redis: Redis,
    apply: boolean,
    maintenanceKey: string,
    token: string
) => {
    let found = 0;
    let removed = 0;
    for (const pattern of legacyCachePatterns) {
        let cursor = '0';
        do {
            const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 256);
            cursor = next;
            found += keys.length;
            if (apply && keys.length) {
                await assertMaintenanceOwner(redis, maintenanceKey, token);
                removed += await redis.unlink(...keys);
            }
        } while (cursor !== '0');
    }
    return { found, removed };
};

const run = async (): Promise<number> => {
    configureProductionLogging();
    const args = process.argv.slice(2);
    const apply = args.includes('--apply');
    const resume = args.find(arg => arg.startsWith('--resume-maintenance='))?.split('=')[1];
    const token = resume ?? randomUUID();
    const report: Record<string, unknown> = { mode: apply ? 'apply' : 'dry-run' };
    let stage = 'arguments';
    let database: { close(): Promise<void> } | undefined;
    let redis: Redis | undefined;
    let memory: Redis | undefined;
    let maintenanceKey: string | undefined;
    let ownsMaintenance = false;
    let complete = false;
    try {
        if (
            args.some(
                arg =>
                    !['--apply', '--writers-stopped'].includes(arg) &&
                    !/^--resume-maintenance=[0-9a-f-]{36}$/.test(arg)
            )
        )
            throw new Error('Unsupported migration argument');
        if (apply !== args.includes('--writers-stopped') || (resume && !apply))
            throw new Error(
                'Apply requires confirmation that every writer and prior migration has stopped and drained'
            );

        stage = 'redis';
        const [{ default: cache }, { PRIVACY_MAINTENANCE_KEY }, { REDIS_PREFIX }] =
            await Promise.all([
                import('../src/utils/cache'),
                import('../src/services/dataErasure'),
                import('../src/constants/env'),
            ]);
        redis = cache.redis;
        memory = cache.node;
        maintenanceKey = PRIVACY_MAINTENANCE_KEY;
        if (!redis || (await redis.ping()) !== 'PONG')
            throw new Error('Persistent Redis is required');
        if (apply) {
            stage = 'maintenance';
            if (resume) await assertMaintenanceOwner(redis, maintenanceKey, token);
            else if ((await redis.set(maintenanceKey, token, 'NX')) !== 'OK')
                throw new Error('Privacy maintenance is already reserved');
            ownsMaintenance = true;
            report.maintenanceToken = token;
            // Emit the resumable token before any destructive stage. A crash must not
            // leave operators guessing which persistent reservation belongs to them.
            process.stdout.write(
                `${JSON.stringify({ mode: 'apply', maintenanceToken: token, status: 'maintenance-held' })}\n`
            );
            stage = 'owner-drain';
            let cursor = '0';
            do {
                const [next, keys] = await redis.scan(
                    cursor,
                    'MATCH',
                    `${REDIS_PREFIX}:privacy:active:*`,
                    'COUNT',
                    256
                );
                cursor = next;
                for (const key of keys) {
                    const active = Number(
                        await redis.eval(
                            `local clock = redis.call("TIME")
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
return redis.call("ZCOUNT", KEYS[1], "(" .. now, "+inf")`,
                            1,
                            key
                        )
                    );
                    if (active) throw new Error('Owner operations have not drained');
                }
            } while (cursor !== '0');
        }

        const [{ db }, vectors, ownership, queues] = await Promise.all([
            import('../src/db'),
            import('../src/db/qdrant'),
            import('./backfill-message-dids'),
            import('../src/workers/ownerJobs'),
        ]);
        database = db;
        if (apply) {
            stage = 'capabilities';
            await db.assertPrivacyCapabilities({ initializeIndexes: false });
            await vectors.assertQdrantPrivacyCapabilities();
        }
        stage = 'message-ownership';
        const ownershipReport = await ownership.migrateLegacyMessageOwnership({
            apply,
        });
        report.ownership = ownershipReport;
        if (apply && ownership.getMigrationExitCode(ownershipReport))
            throw new Error('Legacy message ownership needs offline remediation');
        stage = 'mongo';
        if (apply) await assertMaintenanceOwner(redis, maintenanceKey, token);
        report.mongo = await db.migrateLegacyPrivacyData({ apply });
        stage = 'vectors';
        if (apply) await assertMaintenanceOwner(redis, maintenanceKey, token);
        report.vectors = await vectors.migrateLegacyVectorPayloads({ apply });
        stage = 'queues';
        if (apply) await assertMaintenanceOwner(redis, maintenanceKey, token);
        report.queues = await queues.migrateLegacyOwnerJobs({ apply });
        stage = 'legacy-caches';
        report.caches = await migrateLegacyCaches(redis, apply, maintenanceKey, token);
        stage = 'authentication-index';
        if (apply) await assertMaintenanceOwner(redis, maintenanceKey, token);
        const { rebuildOwnerAuthenticationIndex } = await import('../src/services/ownerAuthIndex');
        const authenticationIndex = await rebuildOwnerAuthenticationIndex({
            apply,
        });
        report.authenticationIndex = authenticationIndex;
        if (apply && authenticationIndex.invalid)
            throw new Error('Legacy authentication records need offline remediation');
        if (apply) {
            stage = 'maintenance-release';
            const released = await redis.eval(
                `if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) end
return 0`,
                1,
                maintenanceKey,
                token
            );
            if (Number(released) !== 1) throw new Error('Privacy maintenance ownership was lost');
            ownsMaintenance = false;
        }
        complete = true;
        report.status = apply ? 'complete' : 'inspected';
        return 0;
    } catch {
        report.status = 'incomplete';
        report.failedStage = stage;
        report.maintenanceRetained = ownsMaintenance;
        return 1;
    } finally {
        // Never clear maintenance on failure. Resume only after the previous
        // process and every old writer have actually exited and drained.
        await Promise.allSettled([database?.close(), redis?.quit(), memory?.quit()]);
        report.complete = complete;
        process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    }
};

if (import.meta.main) process.exitCode = await run();
