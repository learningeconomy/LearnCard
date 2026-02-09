/**
 * createFirebaseAuthProvider Unit Tests
 *
 * Tests the Firebase auth provider factory for:
 * - Null return when no user
 * - getIdToken delegation and error handling
 * - getCurrentUser with stale-session detection
 * - signOut delegation
 * - getProviderType
 */

import { describe, it, expect, vi } from 'vitest';

import { createFirebaseAuthProvider } from '../createFirebaseAuthProvider';
import { AuthSessionError } from '../../auth-coordinator/types';

import type { FirebaseAuthConfig } from '../createFirebaseAuthProvider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockGetIdToken = vi.fn().mockResolvedValue('mock-id-token');

const createConfig = (overrides?: Partial<FirebaseAuthConfig>): FirebaseAuthConfig => ({
    getAuth: () => ({
        currentUser: { getIdToken: mockGetIdToken },
    }),
    user: { uid: 'user-1', email: 'test@example.com', phoneNumber: '+1234567890' },
    ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createFirebaseAuthProvider', () => {
    describe('returns null when user is absent', () => {
        it('returns null when user is null', () => {
            const result = createFirebaseAuthProvider(createConfig({ user: null }));

            expect(result).toBeNull();
        });

        it('returns null when user.uid is null', () => {
            const result = createFirebaseAuthProvider(
                createConfig({ user: { uid: null, email: 'a@b.com' } })
            );

            expect(result).toBeNull();
        });

        it('returns null when user.uid is undefined', () => {
            const result = createFirebaseAuthProvider(
                createConfig({ user: { uid: undefined } })
            );

            expect(result).toBeNull();
        });
    });

    describe('returns a valid AuthProvider when user has uid', () => {
        it('returns non-null provider', () => {
            const provider = createFirebaseAuthProvider(createConfig());

            expect(provider).not.toBeNull();
        });

        it('getProviderType returns firebase', () => {
            const provider = createFirebaseAuthProvider(createConfig())!;

            expect(provider.getProviderType()).toBe('firebase');
        });
    });

    describe('getIdToken()', () => {
        it('delegates to Firebase SDK currentUser.getIdToken', async () => {
            const provider = createFirebaseAuthProvider(createConfig())!;

            const token = await provider.getIdToken();

            expect(token).toBe('mock-id-token');
            expect(mockGetIdToken).toHaveBeenCalled();
        });

        it('throws AuthSessionError when Firebase has no currentUser', async () => {
            const provider = createFirebaseAuthProvider(
                createConfig({
                    getAuth: () => ({ currentUser: null }),
                })
            )!;

            await expect(provider.getIdToken()).rejects.toThrow(AuthSessionError);
            await expect(provider.getIdToken()).rejects.toThrow('No Firebase user');
        });
    });

    describe('getCurrentUser()', () => {
        it('returns AuthUser with correct fields', async () => {
            const provider = createFirebaseAuthProvider(createConfig())!;

            const user = await provider.getCurrentUser();

            expect(user).toEqual({
                id: 'user-1',
                email: 'test@example.com',
                phone: '+1234567890',
                providerType: 'firebase',
            });
        });

        it('returns null when Firebase SDK session is stale (no currentUser in SDK)', async () => {
            const provider = createFirebaseAuthProvider(
                createConfig({
                    getAuth: () => ({ currentUser: null }),
                })
            )!;

            const user = await provider.getCurrentUser();

            expect(user).toBeNull();
        });

        it('omits email and phone when not present', async () => {
            const provider = createFirebaseAuthProvider(
                createConfig({ user: { uid: 'user-1' } })
            )!;

            const user = await provider.getCurrentUser();

            expect(user).toEqual({
                id: 'user-1',
                email: undefined,
                phone: undefined,
                providerType: 'firebase',
            });
        });
    });

    describe('signOut()', () => {
        it('calls onSignOut when provided', async () => {
            const onSignOut = vi.fn().mockResolvedValue(undefined);

            const provider = createFirebaseAuthProvider(createConfig({ onSignOut }))!;

            await provider.signOut();

            expect(onSignOut).toHaveBeenCalledOnce();
        });

        it('does nothing when onSignOut is not provided', async () => {
            const provider = createFirebaseAuthProvider(
                createConfig({ onSignOut: undefined })
            )!;

            // Should not throw
            await expect(provider.signOut()).resolves.toBeUndefined();
        });
    });
});
