import { z } from 'zod';
import type { HoldLabel } from '../metrics';

export const TIER3_POOL_SIZE = 12;
const identifier = z.string().regex(/^[A-Za-z0-9._-]{1,128}$/);
const hostname = z
    .string()
    .toLowerCase()
    .regex(/^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/);
const integer = (fallback: number, min: number, max: number) =>
    z.coerce.number().int().min(min).max(max).default(fallback);

/** Fixed positional label for pool index `index` (0-based): hold-01..hold-12. */
export const holdLabel = (index: number): HoldLabel => `hold-${String(index + 1).padStart(2, '0')}`;

const holdAccount = z
    .object({ id: identifier, secretArn: z.string().startsWith('arn:aws:secretsmanager:') })
    .strict();

const evaluatorSchema = z
    .object({
        environment: z.enum(['staging', 'production']),
        ledgerTable: z.string().regex(/^[A-Za-z0-9._-]{3,255}$/),
        poolSize: z.literal(TIER3_POOL_SIZE),
    })
    .strict();
export type EvaluatorConfig = z.infer<typeof evaluatorSchema>;

const runnerSchema = evaluatorSchema
    .extend({
        startHourUtc: integer(15, 0, 22),
        holdDurationMs: integer(604_800_000, 60_000, 30 * 86_400_000),
        cancelCooldownHours: integer(48, 0, 24 * 14),
        orphanCleanupDelayMs: integer(86_400_000, 0, 7 * 86_400_000),
        codePollMs: integer(360_000, 0, 360_000),
        holdAccounts: z.array(holdAccount).length(TIER3_POOL_SIZE),
        inbox: z
            .object({
                bucket: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/),
                prefix: z
                    .string()
                    .regex(/^[a-z0-9/-]{1,64}\/$/)
                    .default('inbox/'),
                domain: hostname,
                expectedSenders: z.array(z.string().email().toLowerCase()).min(1).max(3),
                expectedDkimDomain: hostname,
                requireDmarc: z.boolean().default(true),
            })
            .strict(),
    })
    .strict()
    .refine(
        config =>
            new Set(config.holdAccounts.map(account => account.id)).size === TIER3_POOL_SIZE &&
            new Set(config.holdAccounts.map(account => account.secretArn)).size ===
                TIER3_POOL_SIZE &&
            config.inbox.expectedSenders.every(sender => {
                const domain = sender.split('@')[1];
                return (
                    domain === config.inbox.expectedDkimDomain ||
                    domain.endsWith(`.${config.inbox.expectedDkimDomain}`)
                );
            })
    );
export type RunnerConfig = z.infer<typeof runnerSchema>;

const json = (value: string | undefined): unknown => JSON.parse(value ?? 'null');

export const loadEvaluatorConfig = (env: NodeJS.ProcessEnv = process.env): EvaluatorConfig => {
    try {
        return evaluatorSchema.parse({
            environment: env.CANARY_ENVIRONMENT,
            ledgerTable: env.TIER3_LEDGER_TABLE,
            poolSize: Number(env.TIER3_POOL_SIZE),
        });
    } catch {
        throw new Error('Invalid tier 3 configuration');
    }
};

/** Trust (expected senders, DKIM domain) comes only from reviewed configuration. */
export const loadRunnerConfig = (env: NodeJS.ProcessEnv = process.env): RunnerConfig => {
    try {
        return runnerSchema.parse({
            environment: env.CANARY_ENVIRONMENT,
            ledgerTable: env.TIER3_LEDGER_TABLE,
            poolSize: Number(env.TIER3_POOL_SIZE),
            startHourUtc: env.TIER3_START_HOUR_UTC,
            holdDurationMs: env.TIER3_HOLD_DURATION_MS,
            cancelCooldownHours: env.TIER3_CANCEL_COOLDOWN_HOURS,
            orphanCleanupDelayMs: env.TIER3_ORPHAN_CLEANUP_DELAY_MS,
            codePollMs: env.TIER3_CODE_POLL_MS,
            holdAccounts: json(env.CANARY_HOLD_ACCOUNTS_JSON),
            inbox: {
                bucket: env.INBOX_BUCKET,
                prefix: env.INBOX_PREFIX,
                domain: env.INBOX_DOMAIN,
                expectedSenders: json(env.INBOX_EXPECTED_SENDERS_JSON),
                expectedDkimDomain: env.INBOX_EXPECTED_DKIM_DOMAIN,
                requireDmarc: env.INBOX_REQUIRE_DMARC !== 'false',
            },
        });
    } catch {
        throw new Error('Invalid tier 3 configuration');
    }
};
