import { describe, expect, it } from 'vitest';
import {
    AtomicUpdateError,
    EscrowPinMismatchError,
    EscrowRequestError,
} from '@learncard/sss-key-manager';
import { ProvisionError } from '../provision/errors';
import { CanaryStepError } from '../sdk';
import { LoadError } from './errors';
import { loadReason } from './reasons';

const SECRET = 'person@example.org did:key:z6Mk secret-token 0123456789abcdef';

describe('loadReason', () => {
    it.each([
        [new LoadError('server_key_exists'), 'server_key_exists'],
        [new LoadError(SECRET), 'load'],
        [
            new ProvisionError('exchange', 'TOO_MANY_ATTEMPTS_TRY_LATER'),
            'exchange_too_many_attempts_try_later',
        ],
        [new ProvisionError('token', 'project'), 'token_project'],
        [new EscrowRequestError(429), 'rate_limit'],
        [new EscrowRequestError(409), 'conflict'],
        [new EscrowRequestError(503), 'http_5xx'],
        [new EscrowRequestError(403), 'http_4xx'],
        [new EscrowPinMismatchError(3), 'pin_mismatch'],
        [new CanaryStepError('unavailable'), 'unavailable'],
        [
            Object.assign(new Error(SECRET), { code: 'auth/too-many-requests' }),
            'firebase_rate_limit',
        ],
        [Object.assign(new Error(SECRET), { code: 'auth/something-new' }), 'firebase_admin'],
        [Object.assign(new Error(SECRET), { code: 'app/network-timeout' }), 'firebase_network'],
        [Object.assign(new Error(SECRET), { name: 'TimeoutError' }), 'timeout'],
        [new TypeError('fetch failed'), 'transport'],
        [new Error('Failed to store auth share: 503 Service Unavailable'), 'http_5xx'],
        [new Error('Failed: 429'), 'rate_limit'],
        [new Error('request timed out'), 'timeout'],
        [new Error(SECRET), 'unexpected'],
        ['string', 'unexpected'],
        [undefined, 'unexpected'],
    ])('%o -> %s', (error, reason) => {
        expect(loadReason(error)).toBe(reason);
    });
    it('names SDK error classes without their text', () => {
        expect(loadReason(new AtomicUpdateError(SECRET, 'store_auth', true))).toBe(
            'atomic_update_store_auth'
        );
        const odd = Object.assign(new AtomicUpdateError(SECRET, 'split', false), {
            phase: SECRET,
        });
        expect(loadReason(odd)).toBe('atomic_update');
    });
    it('never echoes error text', () => {
        for (const error of [new Error(SECRET), new LoadError(SECRET)])
            expect(SECRET).not.toContain(loadReason(error));
    });
});
