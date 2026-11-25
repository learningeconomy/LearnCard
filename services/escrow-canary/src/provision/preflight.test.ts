import { describe, expect, it } from 'vitest';
import { create, createMemoryLedger, keys, type LedgerItem } from '../tier3/ledger';
import { runnerConfig } from '../tier3/test-fakes';
import { ProvisionError } from './errors';
import { checkAccounts, confirmProduction } from './guards';
import { preflight, type AwsReaders, type PreflightInput } from './preflight';
import { ProvisionWorld, TIER12_EMAIL, tier12Config } from './test-world';

const ACCOUNT = '000000000000';
const lambdaEnv = (overrides: Record<string, string> = {}): Record<string, string> => ({
    CANARY_ENVIRONMENT: 'staging',
    CANARY_TIER: '3',
    CANARY_ROLE: 'runner',
    LCA_API_URL: tier12Config.serverUrl,
    TENANT_ID: tier12Config.tenantId,
    FIREBASE_API_KEY: tier12Config.firebaseApiKey,
    ESCROW_KEY_ID: tier12Config.keyId,
    AUTHORITY_GENERATION: tier12Config.authorityGeneration,
    ESCROW_MEASUREMENTS_JSON: JSON.stringify(tier12Config.measurements),
    CANARY_ACCOUNTS_JSON: JSON.stringify(tier12Config.accounts),
    TIER3_LEDGER_TABLE: runnerConfig.ledgerTable,
    TIER3_POOL_SIZE: '12',
    CANARY_HOLD_ACCOUNTS_JSON: JSON.stringify(runnerConfig.holdAccounts.map(account => account.id)),
    TIER3_HOLD_SECRET_PREFIX: 'escrow-canary-staging/tier3/',
    INBOX_BUCKET: runnerConfig.inbox.bucket,
    INBOX_DOMAIN: runnerConfig.inbox.domain,
    INBOX_LOCAL_PART: runnerConfig.inbox.localPart,
    INBOX_EXPECTED_SENDERS_JSON: JSON.stringify(runnerConfig.inbox.expectedSenders),
    INBOX_EXPECTED_DKIM_DOMAIN: runnerConfig.inbox.expectedDkimDomain,
    ...overrides,
});
const aws = (
    env = lambdaEnv(),
    caller = ACCOUNT,
    arn = `arn:aws:lambda:us-east-1:${ACCOUNT}:function:escrow-canary-staging-tier3-runner`
): AwsReaders & { names: string[] } => {
    const names: string[] = [];
    return {
        names,
        callerAccount: async () => caller,
        functionConfiguration: async name => {
            names.push(name);
            return { arn, env };
        },
    };
};
const tier3: PreflightInput = {
    environment: 'staging',
    expectAccount: ACCOUNT,
    tier: 3,
    labels: 'hold-01,hold-02',
};
const reasonOf = async (promise: Promise<unknown>) => {
    try {
        await promise;
    } catch (error) {
        expect(error).toBeInstanceOf(ProvisionError);
        expect((error as ProvisionError).exitCode).toBe(2);
        return (error as ProvisionError).message;
    }
    throw new Error('expected a refusal');
};

describe('provisioning preflight guards', () => {
    it('builds tier 3 targets from the deployed function only', async () => {
        const world = new ProvisionWorld();
        const readers = aws();
        const plan = await preflight(tier3, readers, world.secretStore, () => world.ledger);
        expect(readers.names).toEqual(['escrow-canary-staging-tier3-runner']);
        expect(
            plan.targets.map(target => [target.label, target.email, target.inboxPrefix])
        ).toEqual([
            ['hold-01', 'canary-staging+1@inbox.example.com', 'inbox/hold-01/'],
            ['hold-02', 'canary-staging+2@inbox.example.com', 'inbox/hold-02/'],
        ]);
        expect(plan.metadata.get('hold-01')?.name).toBe(
            'escrow-canary-staging/tier3/hold-account-1'
        );
    });

    it('builds a tier 1/2 target from flags', async () => {
        const world = new ProvisionWorld();
        const plan = await preflight(
            {
                environment: 'staging',
                expectAccount: ACCOUNT,
                tier: 2,
                account: 'pin-b',
                email: TIER12_EMAIL,
            },
            aws(
                lambdaEnv({ CANARY_TIER: '2' }),
                ACCOUNT,
                `arn:aws:lambda:us-east-1:${ACCOUNT}:function:x`
            ),
            world.secretStore,
            () => world.ledger
        );
        expect(plan.targets[0]).toMatchObject({ label: 'pin-b', accountId: 'account-2', tier: 2 });
        expect(plan.ledger).toBeUndefined();
    });

    it.each([
        ['caller account', () => aws(lambdaEnv(), '111111111111'), tier3, 'guard: caller_account'],
        [
            'function account',
            () => aws(lambdaEnv(), ACCOUNT, 'arn:aws:lambda:us-east-1:111111111111:function:f'),
            tier3,
            'guard: function_account',
        ],
        [
            'environment',
            () => aws(lambdaEnv({ CANARY_ENVIRONMENT: 'production' })),
            tier3,
            'guard: environment',
        ],
        [
            'function tier',
            () => aws(lambdaEnv({ CANARY_TIER: '1' })),
            tier3,
            'guard: function_tier',
        ],
        [
            'function role',
            () => aws(lambdaEnv({ CANARY_ROLE: 'evaluator' })),
            tier3,
            'guard: function_role',
        ],
        ['broken config', () => aws(lambdaEnv({ FIREBASE_API_KEY: '' })), tier3, 'guard: config'],
        [
            'staging local part in production',
            () => aws(lambdaEnv({ CANARY_ENVIRONMENT: 'production' })),
            { ...tier3, environment: 'production' as const },
            'guard: config',
        ],
        ['bad labels', () => aws(), { ...tier3, labels: 'hold-13' }, 'usage: labels'],
        [
            'tier 1 with pin-a',
            () => aws(lambdaEnv({ CANARY_TIER: '1' })),
            {
                environment: 'staging' as const,
                expectAccount: ACCOUNT,
                tier: 1 as const,
                account: 'pin-a',
                email: TIER12_EMAIL,
            },
            'usage: account',
        ],
    ])('refuses on %s', async (_name, readers, input, expected) => {
        const world = new ProvisionWorld();
        expect(
            await reasonOf(preflight(input, readers(), world.secretStore, () => world.ledger))
        ).toBe(expected);
    });

    it('refuses a secret outside the environment prefix or in another account', async () => {
        const world = new ProvisionWorld();
        const store = {
            ...world.secretStore,
            describe: async (id: string) => ({
                ...(await world.secretStore.describe(id)),
                name: 'other/x',
            }),
        };
        expect(await reasonOf(preflight(tier3, aws(), store, () => world.ledger))).toBe(
            'guard: secret_name'
        );
        const foreign = {
            ...world.secretStore,
            describe: async (id: string) => ({
                ...(await world.secretStore.describe(id)),
                arn: 'arn:aws:secretsmanager:us-east-1:111111111111:secret:x',
            }),
        };
        expect(await reasonOf(preflight(tier3, aws(), foreign, () => world.ledger))).toBe(
            'guard: secret_account'
        );
    });

    const pool = (label: string, state: 'idle' | 'busy' | 'quarantined'): LedgerItem => ({
        ...keys.pool(label),
        type: 'pool',
        env: 'staging',
        version: 1,
        updatedAt: 0,
        label: label as never,
        state,
        stateSince: 0,
        lastReturnedAt: 0,
        orphanCleanupAttempted: false,
    });
    const meta = (paused: boolean): LedgerItem => ({
        ...keys.meta,
        type: 'meta',
        env: 'staging',
        version: 1,
        updatedAt: 0,
        enabledAt: 0,
        paused,
    });

    it.each([
        ['idle and running', [pool('hold-01', 'idle'), meta(false)], 'guard: pool_active'],
        ['busy', [pool('hold-01', 'busy')], 'guard: pool_active'],
    ])('tier 3 refuses a label the runner can use (%s)', async (_name, items, expected) => {
        const world = new ProvisionWorld();
        const ledger = createMemoryLedger();
        await ledger.write(items.map(item => create(item)));
        expect(await reasonOf(preflight(tier3, aws(), world.secretStore, () => ledger))).toBe(
            expected
        );
    });

    it.each([
        ['absent', []],
        ['quarantined', [pool('hold-01', 'quarantined'), meta(false)]],
        ['paused', [pool('hold-01', 'idle'), pool('hold-02', 'busy'), meta(true)]],
    ])('tier 3 allows a label whose pool item is %s', async (_name, items) => {
        const world = new ProvisionWorld();
        const ledger = createMemoryLedger();
        if (items.length) await ledger.write(items.map(item => create(item)));
        await expect(
            preflight(tier3, aws(), world.secretStore, () => ledger)
        ).resolves.toBeDefined();
    });
});

describe('account and production guards', () => {
    it('requires a 12-digit expected account', () => {
        expect(() =>
            checkAccounts('123', { caller: '123', functionArn: '', secretArns: [] })
        ).toThrow('usage: expect_account');
    });

    it('production refuses without a TTY or the typed confirmation', async () => {
        await expect(
            confirmProduction('production', false, async () => 'production')
        ).rejects.toThrow('guard: production_requires_tty');
        await expect(confirmProduction('production', true, async () => 'yes')).rejects.toThrow(
            'guard: production_not_confirmed'
        );
        await expect(
            confirmProduction('production', true, async () => 'production')
        ).resolves.toBeUndefined();
        await expect(confirmProduction('staging', false, async () => '')).resolves.toBeUndefined();
    });
});
