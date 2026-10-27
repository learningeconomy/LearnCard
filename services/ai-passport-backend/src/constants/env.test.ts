import { describe, expect, test } from 'bun:test';

import { parseCorsOrigins } from './env';

describe('parseCorsOrigins', () => {
    test('trims configured origins', () => {
        expect(parseCorsOrigins(' https://learncard.app,https://passport.example ')).toEqual([
            'https://learncard.app',
            'https://passport.example',
        ]);
    });

    test('rejects wildcard credentialed origins', () => {
        expect(() => parseCorsOrigins('https://learncard.app,*')).toThrow(
            'CORS_ORIGINS cannot contain * when credentialed requests are enabled'
        );
    });
});
