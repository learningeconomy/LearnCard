import { describe, expect, it, vi } from 'vitest';
import { getEscrowPinStatus, type MongoUserKeyType } from './UserKey';

vi.mock('@mongo', () => ({ default: {} }));

describe('getEscrowPinStatus', () => {
    it('distinguishes an absent PIN from lockout', () => {
        const userKey = { shareVersion: 1 } as MongoUserKeyType;
        expect(getEscrowPinStatus(userKey)).toEqual({
            state: 'none',
            enabled: false,
            attemptsRemaining: 0,
        });
    });

    it.each(['locked', 'stale'] as const)('reports %s without exposing salt', state => {
        const userKey = {
            shareVersion: 1,
            escrowPin: {
                salt: 'salt',
                shareVersion: state === 'stale' ? 2 : 1,
                failedAttempts: 0,
                enabledAt: new Date(),
                ...(state === 'locked' ? { disabledAt: new Date() } : {}),
            },
        } as MongoUserKeyType;
        expect(getEscrowPinStatus(userKey)).toEqual({
            state,
            enabled: false,
            attemptsRemaining: 10,
        });
    });

    it.each([0, 9, 10, 11])('only enables unexhausted PINs (%i reserved)', failedAttempts => {
        const userKey = {
            shareVersion: 1,
            escrowPin: { salt: 'salt', shareVersion: 1, failedAttempts, enabledAt: new Date() },
        } as MongoUserKeyType;
        expect(getEscrowPinStatus(userKey)).toEqual({
            state: failedAttempts < 10 ? 'enabled' : 'locked',
            enabled: failedAttempts < 10,
            attemptsRemaining: Math.max(0, 10 - failedAttempts),
            ...(failedAttempts < 10 ? { salt: 'salt' } : {}),
        });
    });
});
