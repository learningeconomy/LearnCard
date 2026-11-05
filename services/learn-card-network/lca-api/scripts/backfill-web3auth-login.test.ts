import { describe, expect, it } from 'vitest';

import { backfillFilter, classifyForBackfill } from './backfill-web3auth-login';

const login = { type: 'firebase' as const, id: 'uid-1' };
const migrated = {
    migratedFromWeb3Auth: true,
    sssActivationState: 'active' as const,
    authProviders: [login],
};

describe('classifyForBackfill', () => {
    it('backfills a login-keyed migration with one login and no security change', () => {
        expect(classifyForBackfill(migrated)).toEqual({ eligible: true, login });
        expect(classifyForBackfill({ ...migrated, securityEpoch: 0 })).toEqual({
            eligible: true,
            login,
        });
    });

    it.each([
        ['not_migrated', { ...migrated, migratedFromWeb3Auth: false }],
        ['already_recorded', { ...migrated, web3AuthLogin: login }],
        ['legacy_migration_flow', { ...migrated, sssActivationState: undefined }],
        ['legacy_migration_flow', { ...migrated, sssActivationState: 'provisional' as const }],
        ['login_count_not_one', { ...migrated, authProviders: [] }],
        [
            'login_count_not_one',
            { ...migrated, authProviders: [login, { type: 'firebase' as const, id: 'uid-2' }] },
        ],
        ['security_epoch_changed', { ...migrated, securityEpoch: 1 }],
    ])('skips (%s)', (reason, record) => {
        expect(classifyForBackfill(record)).toEqual({ eligible: false, reason });
    });
});

describe('backfillFilter', () => {
    it('re-checks every eligibility condition in the write', () => {
        expect(backfillFilter('id', login)).toEqual({
            _id: 'id',
            migratedFromWeb3Auth: true,
            web3AuthLogin: { $exists: false },
            sssActivationState: 'active',
            authProviders: { $size: 1, $elemMatch: login },
            securityEpoch: { $not: { $gt: 0 } },
        });
    });
});
