import { loadConfig, type Config } from '../config';
import { loadRunnerConfig, type RunnerConfig } from '../tier3/config';
import type { Ledger } from '../tier3/ledger';
import { refuse } from './errors';
import { checkAccounts, checkEnvironment, checkSecret, checkTier3Ledger } from './guards';
import type { SecretMetadata, StagedSecretStore } from './secret-writer';
import {
    defaultFunctionName,
    parseHoldLabels,
    tier12Target,
    tier3Targets,
    type Environment,
    type Target,
    type Tier,
} from './targets';

/** Read-only AWS lookups the guards need (STS, Lambda). */
export interface AwsReaders {
    callerAccount(): Promise<string>;
    functionConfiguration(
        name: string
    ): Promise<{ arn: string; env: Record<string, string | undefined> }>;
}

export interface PreflightInput {
    environment: Environment;
    expectAccount: string;
    tier: Tier;
    functionName?: string;
    /** Tier 3: `hold-01,hold-02` or `all`. */
    labels?: string;
    /** Tier 1/2: `read-only` | `pin-a` | `pin-b`. */
    account?: string;
    /** Tier 1/2: the account's login and recovery address. */
    email?: string;
}

export interface Plan {
    environment: Environment;
    tier: Tier;
    base: Config;
    runner?: RunnerConfig;
    targets: Target[];
    metadata: Map<string, SecretMetadata>;
    ledger?: Ledger;
}

/**
 * Every guard, before any lca-api call: caller account, deployed function
 * (environment, tier, account), configuration parse, each target secret's
 * name/identity/account, and (tier 3) the pool ledger state.
 * Configuration comes only from the deployed Lambda: there is no second copy.
 */
export const preflight = async (
    input: PreflightInput,
    aws: AwsReaders,
    secrets: StagedSecretStore,
    ledgerFor: (table: string) => Ledger
): Promise<Plan> => {
    const caller = await aws.callerAccount();
    if (caller !== input.expectAccount) throw refuse('guard', 'caller_account');
    const fn = await aws.functionConfiguration(
        input.functionName ?? defaultFunctionName(input.environment, input.tier)
    );
    const env = fn.env;
    checkEnvironment(input.environment, env.CANARY_ENVIRONMENT ?? '');
    if (env.CANARY_TIER !== String(input.tier)) throw refuse('guard', 'function_tier');
    if (input.tier === 3 && env.CANARY_ROLE !== 'runner') throw refuse('guard', 'function_role');
    let base: Config;
    let runner: RunnerConfig | undefined;
    try {
        base = loadConfig(env as NodeJS.ProcessEnv);
        if (input.tier === 3) runner = loadRunnerConfig(env as NodeJS.ProcessEnv);
    } catch {
        throw refuse('guard', 'config');
    }
    checkEnvironment(input.environment, base.environment);
    let targets: Target[];
    if (input.tier === 3) {
        if (!input.labels || input.account || input.email) throw refuse('usage', 'tier3_targets');
        targets = tier3Targets(runner!, parseHoldLabels(input.labels));
    } else {
        if (!input.account || !input.email || input.labels) throw refuse('usage', 'tier12_targets');
        targets = [tier12Target(base, input.tier, input.account, input.email)];
    }
    const metadata = new Map<string, SecretMetadata>();
    for (const target of targets) {
        const described = await secrets.describe(target.secretId);
        checkSecret(input.environment, target, described);
        metadata.set(target.label, described);
    }
    checkAccounts(input.expectAccount, {
        caller,
        functionArn: fn.arn,
        secretArns: [...metadata.values()].map(value => value.arn),
    });
    let ledger: Ledger | undefined;
    if (runner) {
        ledger = ledgerFor(runner.ledgerTable);
        await checkTier3Ledger(
            ledger,
            targets.map(target => target.label)
        );
    }
    return {
        environment: input.environment,
        tier: input.tier,
        base,
        runner,
        targets,
        metadata,
        ledger,
    };
};
