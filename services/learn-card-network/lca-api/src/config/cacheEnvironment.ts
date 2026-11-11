import 'dotenv/config';

import { z } from 'zod';
import {
    optionalEnvironmentPort,
    optionalEnvironmentString,
    parseEnvironment,
} from '@learncard/helpers';

/**
 * Focused environment contract for the Redis-backed cache so `src/cache/index.ts`
 * can boot without the full schema's required SEED/MONGO. The cache reads only
 * REDIS_HOST/REDIS_PORT, mirroring the parsers used by the full schema.
 */
export const cacheEnvironmentShape = {
    REDIS_HOST: optionalEnvironmentString,
    REDIS_PORT: optionalEnvironmentPort,
} satisfies z.ZodRawShape;

export const cacheEnvironmentSchema = z.object(cacheEnvironmentShape);

export type CacheEnvironment = z.output<typeof cacheEnvironmentSchema>;

export const parseCacheEnvironment = (
    raw: Record<string, unknown>,
    source = 'process environment'
): CacheEnvironment =>
    parseEnvironment(cacheEnvironmentSchema, raw, {
        project: 'lca-api (cache)',
        source,
        examplePath: 'services/learn-card-network/lca-api/.env.example',
    });

export const environment = parseCacheEnvironment(process.env);
