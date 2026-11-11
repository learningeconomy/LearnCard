import { keys, type Ledger, type MetaItem, type PoolItem } from '../tier3/ledger';
import { refuse } from './errors';
import type { SecretMetadata } from './secret-writer';
import { secretNamePrefix, type Environment, type Target } from './targets';

/**
 * Guards run before any lca-api call. Every source must agree with the
 * operator's explicit `--environment` and `--expect-account`; nothing defaults.
 * STS, the Lambda ARN and the secret ARNs come from the same session, so they
 * confirm the account the operator typed; `CANARY_ENVIRONMENT` and the secret
 * names are the independent environment signal.
 */
const ACCOUNT = /^[0-9]{12}$/;

export const arnAccount = (arn: string): string | undefined => {
    const parts = arn.split(':');
    return parts.length >= 6 && parts[0] === 'arn' && ACCOUNT.test(parts[4]) ? parts[4] : undefined;
};

export const checkAccounts = (
    expected: string,
    sources: { caller: string; functionArn: string; secretArns: string[] }
): void => {
    if (!ACCOUNT.test(expected)) throw refuse('usage', 'expect_account');
    if (sources.caller !== expected) throw refuse('guard', 'caller_account');
    if (arnAccount(sources.functionArn) !== expected) throw refuse('guard', 'function_account');
    if (sources.secretArns.some(arn => arnAccount(arn) !== expected))
        throw refuse('guard', 'secret_account');
};

export const checkEnvironment = (expected: Environment, configured: string): void => {
    if (configured !== expected) throw refuse('guard', 'environment');
};

/** The described secret is the target's and lives under this environment's prefix. */
export const checkSecret = (
    environment: Environment,
    target: Target,
    metadata: SecretMetadata
): void => {
    if (!metadata.name.startsWith(secretNamePrefix(environment)))
        throw refuse('guard', 'secret_name');
    const matches =
        target.tier === 3 ? metadata.name === target.secretId : metadata.arn === target.secretId;
    if (!matches) throw refuse('guard', 'secret_identity');
};

/**
 * Tier 3: a label may be (re)provisioned only while the runner cannot use it:
 * its pool item is absent (pool not initialised), quarantined, or the whole
 * pool is paused. Login mail in a live hold prefix would also count toward the
 * runner's candidate cap.
 */
export const checkTier3Ledger = async (ledger: Ledger, labels: string[]): Promise<void> => {
    const meta = (await ledger.get(keys.meta)) as MetaItem | undefined;
    const paused = meta?.type === 'meta' && meta.paused;
    const pools = await ledger.getMany(labels.map(label => keys.pool(label)));
    for (const item of pools) {
        const pool = item as PoolItem;
        if (pool.type !== 'pool') throw refuse('guard', 'ledger');
        if (!paused && pool.state !== 'quarantined') throw refuse('guard', 'pool_active');
    }
};

/** Production requires an interactive operator who types the environment name. */
export const confirmProduction = async (
    environment: Environment,
    isTty: boolean,
    ask: (question: string) => Promise<string>
): Promise<void> => {
    if (environment !== 'production') return;
    if (!isTty) throw refuse('guard', 'production_requires_tty');
    const answer = await ask('Type "production" to provision production canary accounts: ');
    if (answer.trim() !== 'production') throw refuse('guard', 'production_not_confirmed');
};
