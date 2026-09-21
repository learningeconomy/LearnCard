// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import {
    PENDING_SEED_STORAGE_KEY,
    readPendingDeveloperSeed,
    consumePendingDeveloperSeed,
} from './pendingSeedStorage';

describe('developer account-switch handoff', () => {
    beforeEach(() => window.sessionStorage.clear());
    it('survives repeated mounts until successful sign-in consumes it', () => {
        const seed = 'a'.repeat(64);
        window.sessionStorage.setItem(PENDING_SEED_STORAGE_KEY, seed);
        expect(readPendingDeveloperSeed()).toBe(seed);
        expect(readPendingDeveloperSeed()).toBe(seed);
        consumePendingDeveloperSeed(seed);
        expect(readPendingDeveloperSeed()).toBeNull();
    });
    it('does not erase a newer switch when an older sign-in finishes', () => {
        window.sessionStorage.setItem(PENDING_SEED_STORAGE_KEY, 'b'.repeat(64));
        consumePendingDeveloperSeed('a'.repeat(64));
        expect(readPendingDeveloperSeed()).toBe('b'.repeat(64));
    });
});
