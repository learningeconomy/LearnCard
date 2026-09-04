import { describe, expect, it } from 'vitest';

import { isInitialRefreshVersionUniquenessRace } from './credential-refresh-initial-binding.helpers';

describe('initial refresh binding race classification', () => {
    it.each([
        'Node already exists with property `refreshVersionKey` = "refresh:1"',
        'Constraint credential_refresh_version_key_unique failed',
    ])('recognizes only the refresh-version uniqueness collision: %s', message => {
        expect(
            isInitialRefreshVersionUniquenessRace({
                code: 'Neo.ClientError.Schema.ConstraintValidationFailed',
                message,
            })
        ).toBe(true);
    });

    it.each([
        {
            code: 'Neo.ClientError.Schema.ConstraintValidationFailed',
            message: 'A different unique property collided',
        },
        {
            code: 'Neo.TransientError.Transaction.DeadlockDetected',
            message: 'refreshVersionKey was mentioned, but this is not the expected constraint',
        },
        new Error('database unavailable'),
    ])('does not classify unrelated Neo4j failures as an idempotent race', error => {
        expect(isInitialRefreshVersionUniquenessRace(error)).toBe(false);
    });
});
