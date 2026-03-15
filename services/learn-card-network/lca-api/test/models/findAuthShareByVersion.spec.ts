/**
 * Unit tests for findAuthShareByVersion — the server-side function that looks
 * up a specific auth share version from the current share or previousAuthShares.
 *
 * This is a pure function that doesn't need MongoDB, but UserKey.ts has a
 * top-level `import mongodb from '@mongo'`, so we mock it to avoid connection
 * attempts.
 */

import { describe, test, expect, vi } from 'vitest';

// Mock @mongo before importing UserKey
vi.mock('@mongo', () => ({
    default: {
        collection: vi.fn(() => ({
            findOne: vi.fn(),
            findOneAndUpdate: vi.fn(),
            insertOne: vi.fn(),
            createIndex: vi.fn(),
        })),
    },
    client: { connect: vi.fn(), close: vi.fn() },
}));

import { findAuthShareByVersion } from '../../src/models/UserKey';
import type { MongoUserKeyType } from '../../src/models/UserKey';

const makeUserKey = (overrides: Partial<MongoUserKeyType> = {}): MongoUserKeyType => ({
    contactMethod: { type: 'email', value: 'test@test.com' },
    authProviders: [],
    primaryDid: 'did:key:z123',
    linkedDids: [],
    keyProvider: 'sss',
    authShare: { encryptedData: 'current-share', encryptedDek: 'dek', iv: 'iv' },
    shareVersion: 3,
    securityLevel: 'basic',
    recoveryMethods: [],
    previousAuthShares: [],
    migratedFromWeb3Auth: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

describe('findAuthShareByVersion', () => {
    test('returns current auth share when version matches current', () => {
        const userKey = makeUserKey({ shareVersion: 3 });

        const result = findAuthShareByVersion(userKey, 3);

        expect(result).toEqual({ encryptedData: 'current-share', encryptedDek: 'dek', iv: 'iv' });
    });

    test('returns auth share from previousAuthShares when version is older', () => {
        const userKey = makeUserKey({
            shareVersion: 3,
            authShare: { encryptedData: 'v3-share', encryptedDek: 'v3-dek', iv: 'v3-iv' },
            previousAuthShares: [
                {
                    authShare: { encryptedData: 'v1-share', encryptedDek: 'v1-dek', iv: 'v1-iv' },
                    shareVersion: 1,
                    createdAt: new Date('2024-01-01'),
                },
                {
                    authShare: { encryptedData: 'v2-share', encryptedDek: 'v2-dek', iv: 'v2-iv' },
                    shareVersion: 2,
                    createdAt: new Date('2024-06-01'),
                },
            ],
        });

        const v2 = findAuthShareByVersion(userKey, 2);

        expect(v2).toEqual({ encryptedData: 'v2-share', encryptedDek: 'v2-dek', iv: 'v2-iv' });

        const v1 = findAuthShareByVersion(userKey, 1);

        expect(v1).toEqual({ encryptedData: 'v1-share', encryptedDek: 'v1-dek', iv: 'v1-iv' });
    });

    test('returns null when version is not found in current or previous shares', () => {
        const userKey = makeUserKey({
            shareVersion: 3,
            previousAuthShares: [
                {
                    authShare: { encryptedData: 'v2-share', encryptedDek: 'v2-dek', iv: 'v2-iv' },
                    shareVersion: 2,
                    createdAt: new Date('2024-06-01'),
                },
            ],
        });

        const result = findAuthShareByVersion(userKey, 1);

        expect(result).toBeNull();
    });

    test('returns null when version exceeds current (future version)', () => {
        const userKey = makeUserKey({ shareVersion: 3 });

        const result = findAuthShareByVersion(userKey, 99);

        expect(result).toBeNull();
    });

    test('returns null when previousAuthShares is empty and version does not match current', () => {
        const userKey = makeUserKey({ shareVersion: 3, previousAuthShares: [] });

        const result = findAuthShareByVersion(userKey, 2);

        expect(result).toBeNull();
    });

    test('returns null when authShare is undefined and version matches current', () => {
        const userKey = makeUserKey({ shareVersion: 1, authShare: undefined });

        const result = findAuthShareByVersion(userKey, 1);

        expect(result).toBeNull();
    });

    test('handles the full v1→v2→v3 rotation scenario (Device B has v2, server at v3)', () => {
        // This is the exact regression scenario:
        // - Device A rotated shares from v1 → v2 → v3
        // - Device B still has v2
        // - Device B sends its v2 share to Device A
        // - Server must return the v2 auth share from previousAuthShares

        const userKey = makeUserKey({
            shareVersion: 3,
            authShare: { encryptedData: 'v3-auth', encryptedDek: 'v3-dek', iv: 'v3-iv' },
            previousAuthShares: [
                {
                    authShare: { encryptedData: 'v1-auth', encryptedDek: 'v1-dek', iv: 'v1-iv' },
                    shareVersion: 1,
                    createdAt: new Date('2024-01-01'),
                },
                {
                    authShare: { encryptedData: 'v2-auth', encryptedDek: 'v2-dek', iv: 'v2-iv' },
                    shareVersion: 2,
                    createdAt: new Date('2024-06-01'),
                },
            ],
        });

        // Device B requests v2
        const v2Auth = findAuthShareByVersion(userKey, 2);

        expect(v2Auth).not.toBeNull();
        expect(v2Auth!.encryptedData).toBe('v2-auth');

        // Current v3 still accessible
        const v3Auth = findAuthShareByVersion(userKey, 3);

        expect(v3Auth!.encryptedData).toBe('v3-auth');

        // v4 doesn't exist
        expect(findAuthShareByVersion(userKey, 4)).toBeNull();
    });
});
