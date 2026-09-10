import { describe, expect, it, vi } from 'vitest';
import { getEscrowPinStatus, type MongoUserKeyType } from './UserKey';

vi.mock('@mongo', () => ({ default: {} }));

describe('getEscrowPinStatus', () => {
    it.each([0, 9, 10, 11])('only enables unexhausted PINs (%i reserved)', failedAttempts => {
        const userKey = {
            shareVersion: 1,
            escrowPin: { salt: 'salt', shareVersion: 1, failedAttempts, enabledAt: new Date() },
        } as MongoUserKeyType;
        expect(getEscrowPinStatus(userKey)).toEqual({
            enabled: failedAttempts < 10,
            attemptsRemaining: Math.max(0, 10 - failedAttempts),
            ...(failedAttempts < 10 ? { salt: 'salt' } : {}),
        });
    });
});
