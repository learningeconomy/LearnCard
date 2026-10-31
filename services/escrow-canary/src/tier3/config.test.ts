import { describe, expect, it } from 'vitest';
import { holdLabel, loadEvaluatorConfig, loadRunnerConfig } from './config';
import {
    confirmWindowOk,
    deadlineSane,
    DAY,
    HOUR,
    isCancelDue,
    isoWeekKey,
    MINUTE,
    warningDeadlineExpired,
} from './timing';

const accounts = Array.from({ length: 12 }, (_, index) => `hold-account-${index}`);
const env = {
    NODE_ENV: 'test' as const,
    CANARY_ENVIRONMENT: 'staging',
    TIER3_LEDGER_TABLE: 'escrow-canary-staging-tier3',
    TIER3_POOL_SIZE: '12',
    CANARY_HOLD_ACCOUNTS_JSON: JSON.stringify(accounts),
    TIER3_HOLD_SECRET_PREFIX: 'escrow-canary-staging/tier3/',
    INBOX_BUCKET: 'escrow-canary-staging-inbox-000000000000',
    INBOX_DOMAIN: 'inbox.example.com',
    INBOX_LOCAL_PART: 'canary-staging',
    INBOX_EXPECTED_SENDERS_JSON: JSON.stringify(['recovery@vault.notify.example.com']),
    INBOX_EXPECTED_DKIM_DOMAIN: 'vault.notify.example.com',
};

describe('tier 3 configuration', () => {
    it('loads defaults from reviewed environment only', () => {
        expect(loadRunnerConfig(env)).toMatchObject({
            poolSize: 12,
            startHourUtc: 15,
            holdDurationMs: 604_800_000,
            cancelCooldownHours: 48,
            inbox: { prefix: 'inbox/', requireDmarc: true, localPart: 'canary-staging' },
        });
        // Ids only in the environment; secrets are addressed by name.
        expect(loadRunnerConfig(env).holdAccounts[3]).toEqual({
            id: 'hold-account-3',
            secretId: 'escrow-canary-staging/tier3/hold-account-3',
        });
        expect(loadEvaluatorConfig(env)).toEqual({
            environment: 'staging',
            ledgerTable: 'escrow-canary-staging-tier3',
            poolSize: 12,
        });
    });

    it.each([
        ['eleven accounts', { CANARY_HOLD_ACCOUNTS_JSON: JSON.stringify(accounts.slice(1)) }],
        [
            'duplicate accounts',
            { CANARY_HOLD_ACCOUNTS_JSON: JSON.stringify([...accounts.slice(1), accounts[1]]) },
        ],
        [
            'sender outside DKIM domain',
            { INBOX_EXPECTED_SENDERS_JSON: JSON.stringify(['a@evil.example.net']) },
        ],
        ['no sender', { INBOX_EXPECTED_SENDERS_JSON: '[]' }],
        ['pool size', { TIER3_POOL_SIZE: '13' }],
        [
            'hold id over 32 characters',
            {
                CANARY_HOLD_ACCOUNTS_JSON: JSON.stringify(['x'.repeat(33), ...accounts.slice(1)]),
            },
        ],
        ['missing secret prefix', { TIER3_HOLD_SECRET_PREFIX: undefined }],
        ['missing local part', { INBOX_LOCAL_PART: undefined }],
        ['production local part in staging', { INBOX_LOCAL_PART: 'canary' }],
        [
            'staging local part in production',
            { CANARY_ENVIRONMENT: 'production', INBOX_LOCAL_PART: 'canary-staging' },
        ],
        ['start hour', { TIER3_START_HOUR_UTC: '23' }],
    ])('rejects %s without echoing values', (_name, override) => {
        expect(() => loadRunnerConfig({ ...env, ...override } as NodeJS.ProcessEnv)).toThrow(
            'Invalid tier 3 configuration'
        );
    });

    it('labels pool accounts positionally', () => {
        expect([holdLabel(0), holdLabel(11)]).toEqual(['hold-01', 'hold-12']);
    });
});

describe('tier 3 timing rules', () => {
    const hold = 7 * DAY;
    it('checks the confirmation window with margin and skew', () => {
        const base = { confirmCallStartedAt: 0, confirmedAt: 5_000, holdDurationMs: hold };
        expect(confirmWindowOk({ ...base, releaseAfter: hold + MINUTE + 1_000 })).toBe(true);
        expect(confirmWindowOk({ ...base, releaseAfter: hold - 2 * MINUTE })).toBe(false);
        expect(confirmWindowOk({ ...base, releaseAfter: hold + 5 * MINUTE })).toBe(false);
    });

    it('requires the deadline to follow both confirmation + hold and warning + 24h', () => {
        const base = { confirmedAt: 0, holdDurationMs: hold };
        const warning = 6 * DAY + 30 * MINUTE;
        expect(
            deadlineSane({ ...base, warningArrival: warning, releaseAfter: warning + DAY + MINUTE })
        ).toBe(true);
        // Old value (lca-api has not saved the recomputed deadline yet).
        expect(
            deadlineSane({ ...base, warningArrival: warning, releaseAfter: hold + MINUTE })
        ).toBe(false);
        expect(
            warningDeadlineExpired({
                now: warning + HOUR,
                warningDueAt: 6 * DAY + 2 * HOUR,
                warningArrival: warning,
            })
        ).toBe(false);
        expect(
            warningDeadlineExpired({
                now: warning + 2 * HOUR,
                warningDueAt: 6 * DAY + 2 * HOUR,
                warningArrival: warning,
            })
        ).toBe(true);
    });

    it('computes ISO weeks and the Monday cancel window', () => {
        expect(isoWeekKey(Date.UTC(2026, 10, 2))).toBe('2026-W45');
        expect(isoWeekKey(Date.UTC(2027, 0, 1))).toBe('2026-W53');
        expect(isCancelDue(Date.UTC(2026, 10, 2, 16), 15)).toBe(true);
        expect(isCancelDue(Date.UTC(2026, 10, 2, 15), 15)).toBe(false);
        expect(isCancelDue(Date.UTC(2026, 10, 3, 16), 15)).toBe(false);
    });
});
