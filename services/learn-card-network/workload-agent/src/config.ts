import { z } from 'zod';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AgentError } from './redact';

const schema = z.object({
    WORKLOAD_LOCAL_COMPOSE_ENABLED: z.literal('true'),
    WORKLOAD_AGENT_TOKEN: z.string().min(16),
    BRAIN_URL: z.string().url(),
    WORKLOAD_AGENT_POLL_MS: z.coerce.number().int().min(100).max(60000).default(5000),
    WORKLOAD_SECRETS_DIR: z.string().default('/var/lib/lcn-workloads/secrets'),
    WORKLOAD_HOST_SECRETS_DIR: z.string().optional(),
    WORKLOAD_IMAGE_ALLOWLIST: z.string().default(''),
    WORKLOAD_MAX_CPU_MILLIS: z.coerce.number().int().positive().default(2000),
    WORKLOAD_MAX_MEMORY_MIB: z.coerce.number().int().positive().default(2048),
    WORKLOAD_MAX_PIDS: z.coerce.number().int().positive().default(512),
    WORKLOAD_AGENT_CONTAINER: z.string().default('lcn-workload-agent'),
    WORKLOAD_REDIS_URL: z.string().url().optional(),
});
export type AgentConfig = z.infer<typeof schema>;
export const loadConfig = (env: NodeJS.ProcessEnv = process.env): AgentConfig => {
    if (
        ['NODE_ENV', 'STAGE', 'ENVIRONMENT', 'DEPLOYMENT_ENV'].some((key): boolean =>
            /^(production|prod)$/i.test(env[key] ?? '')
        ) ||
        (env.PRODUCTION && env.PRODUCTION !== 'false') ||
        (env.WORKLOAD_PRODUCTION && env.WORKLOAD_PRODUCTION !== 'false')
    ) {
        throw new AgentError('PRODUCTION_FORBIDDEN');
    }
    const parsed = schema.safeParse(env);
    if (!parsed.success) throw new AgentError('CONFIG_INVALID');
    const config = parsed.data;
    const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
    for (const path of [config.WORKLOAD_SECRETS_DIR, config.WORKLOAD_HOST_SECRETS_DIR].filter(
        (p): p is string => !!p
    )) {
        if (!isAbsolute(path) || resolve(path) === repo || resolve(path).startsWith(`${repo}/`))
            throw new AgentError('SECRETS_PATH_INVALID');
    }
    return config;
};
