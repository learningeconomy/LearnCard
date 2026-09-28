import { describe, expect, it } from 'vitest';
import { getCredentialRefreshLocalQaOrigin } from './credentialRefreshLocalQa';

describe('credential refresh local QA gate', () => {
    it.each([
        [
            true,
            true,
            'http://localhost:3000',
            'http://localhost:4000/trpc',
            'http://localhost:4000',
        ],
        [false, true, 'http://localhost:3000', 'http://localhost:4000/trpc', undefined],
        [true, false, 'http://localhost:3000', 'http://localhost:4000/trpc', undefined],
        [true, true, 'https://learncard.app', 'http://localhost:4000/trpc', undefined],
        [true, true, 'http://localhost:3000', 'https://network.learncard.app/trpc', undefined],
        [true, true, 'http://localhost:3000', 'http://10.0.0.1:4000/trpc', undefined],
        [true, true, 'http://localhost:3000', 'not-a-url', undefined],
    ])('gates dev=%s enabled=%s app=%s brain=%s', (dev, enabled, appOrigin, brainUrl, expected) => {
        expect(getCredentialRefreshLocalQaOrigin(dev, enabled, appOrigin, brainUrl)).toBe(expected);
    });
});
