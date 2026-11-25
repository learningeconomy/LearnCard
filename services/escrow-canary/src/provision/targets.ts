import type { Config } from '../config';
import { holdLabel, TIER3_POOL_SIZE, type RunnerConfig } from '../tier3/config';
import { refuse } from './errors';

export type Tier = 1 | 2 | 3;
export type Environment = 'staging' | 'production';

/** Tier 1/2 positional labels, in `CANARY_ACCOUNTS_JSON` order. */
export const TIER12_LABELS = ['read-only', 'pin-a', 'pin-b'] as const;
export type Tier12Label = (typeof TIER12_LABELS)[number];

export interface Target {
    tier: Tier;
    /** `read-only` | `pin-a` | `pin-b` | `hold-NN`: positional, never an identity. */
    label: string;
    /** Opaque operator id from deployed configuration (`secret.accountId`). */
    accountId: string;
    /** ARN (tier 1/2) or name (tier 3) as the runner addresses it. */
    secretId: string;
    /** Login and recovery address (lowercase). */
    email: string;
    /** Tier 3 only: the inbox prefix SES writes this address's mail to. */
    inboxPrefix?: string;
}

/** Default deployed function per tier (`infra/escrow-canary` `local.name`). */
export const defaultFunctionName = (environment: Environment, tier: Tier): string =>
    tier === 3
        ? `escrow-canary-${environment}-tier3-runner`
        : `escrow-canary-${environment}-tier${tier}`;

/** Secret names always start with this (`infra/escrow-canary/versions.tf` `local.name`). */
export const secretNamePrefix = (environment: Environment): string =>
    `escrow-canary-${environment}/`;

/** The exact pool address for `hold-0n`, matching the runner and the receipt rules. */
export const holdAddress = (inbox: RunnerConfig['inbox'], label: string): string =>
    `${inbox.localPart}+${Number(label.slice(5))}@${inbox.domain}`.toLowerCase();

export const parseHoldLabels = (value: string): string[] => {
    const labels =
        value === 'all'
            ? Array.from({ length: TIER3_POOL_SIZE }, (_, index) => holdLabel(index))
            : value.split(',').map(label => label.trim());
    const valid = new Set(Array.from({ length: TIER3_POOL_SIZE }, (_, index) => holdLabel(index)));
    if (labels.length === 0 || labels.some(label => !valid.has(label as never)))
        throw refuse('usage', 'labels');
    if (new Set(labels).size !== labels.length) throw refuse('usage', 'labels');
    return labels;
};

export const tier3Targets = (config: RunnerConfig, labels: string[]): Target[] =>
    labels.map(label => {
        const account = config.holdAccounts[Number(label.slice(5)) - 1];
        if (!account) throw refuse('usage', 'labels');
        return {
            tier: 3,
            label,
            accountId: account.id,
            secretId: account.secretId,
            email: holdAddress(config.inbox, label),
            inboxPrefix: `${config.inbox.prefix}${label}/`,
        };
    });

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** Tier 1 is `read-only`; tier 2 is `pin-a` or `pin-b`. One account per invocation. */
export const tier12Target = (config: Config, tier: 1 | 2, label: string, email: string): Target => {
    const index = TIER12_LABELS.indexOf(label as Tier12Label);
    if (index === -1 || (tier === 1) !== (index === 0)) throw refuse('usage', 'account');
    if (!EMAIL.test(email)) throw refuse('usage', 'email');
    const account = config.accounts[index];
    return {
        tier,
        label,
        accountId: account.id,
        secretId: account.secretArn,
        email: email.toLowerCase(),
    };
};
