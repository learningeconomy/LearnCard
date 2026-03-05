/**
 * createFirebaseAuthProvider Unit Tests
 *
 * Tests the Firebase auth provider factory for:
 * - getIdToken delegation and error handling
 * - getCurrentUser mapping from getAuth().currentUser
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

const createMockCurrentUser = (overrides?: Record<string, unknown>) => ({
    uid: 'user-1',
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    displayName: null,
    photoURL: null,
    getIdToken: mockGetIdToken,
    ...overrides,
});

const createConfig = (overrides?: Partial<FirebaseAuthConfig>): FirebaseAuthConfig => ({
    getAuth: () => ({
        currentUser: createMockCurrentUser(),
    }),
    ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createFirebaseAuthProvider', () => {
    describe('always returns a valid AuthProvider', () => {
        it('returns non-null provider', () => {
            const provider = createFirebaseAuthProvider(createConfig());

            expect(provider).not.toBeNull();
        });

        it('getProviderType returns firebase', () => {
            const provider = createFirebaseAuthProvider(createConfig());

            expect(provider.getProviderType()).toBe('firebase');
        });
    });

    describe('getIdToken()', () => {
        it('delegates to Firebase SDK currentUser.getIdToken', async () => {
            const provider = createFirebaseAuthProvider(createConfig());

            const token = await provider.getIdToken();

            expect(token).toBe('mock-id-token');
            expect(mockGetIdToken).toHaveBeenCalled();
        });

        it('throws AuthSessionError when Firebase has no currentUser', async () => {
            const provider = createFirebaseAuthProvider(
                createConfig({
                    getAuth: () => ({ currentUser: null }),
                })
            );

            await expect(provider.getIdToken()).rejects.toThrow(AuthSessionError);
            await expect(provider.getIdToken()).rejects.toThrow('No Firebase user');
        });
    });

    describe('getCurrentUser()', () => {
        it('returns AuthUser with correct fields', async () => {
            const provider = createFirebaseAuthProvider(createConfig());

            const user = await provider.getCurrentUser();

            expect(user).toEqual({
                id: 'user-1',
                email: 'test@example.com',
                phone: '+1234567890',
                displayName: undefined,
                photoUrl: undefined,
                providerType: 'firebase',
                createdAt: undefined,
            });
        });

        it('returns null when Firebase SDK session is stale (no currentUser in SDK)', async () => {
            const provider = createFirebaseAuthProvider(
                createConfig({
                    getAuth: () => ({ currentUser: null }),
                })
            );

            const user = await provider.getCurrentUser();

            expect(user).toBeNull();
        });

        it('omits email and phone when not present', async () => {
            const provider = createFirebaseAuthProvider(
                createConfig({
                    getAuth: () => ({
                        currentUser: createMockCurrentUser({
                            uid: 'user-1',
                            email: null,
                            phoneNumber: null,
                        }),
                    }),
                })
            );

            const user = await provider.getCurrentUser();

            expect(user).toEqual({
                id: 'user-1',
                email: undefined,
                phone: undefined,
                displayName: undefined,
                photoUrl: undefined,
                providerType: 'firebase',
                createdAt: undefined,
            });
        });

        it('maps displayName and photoUrl when present', async () => {
            const provider = createFirebaseAuthProvider(
                createConfig({
                    getAuth: () => ({
                        currentUser: createMockCurrentUser({
                            displayName: 'Test User',
                            photoURL: 'https://example.com/photo.jpg',
                        }),
                    }),
                })
            );

            const user = await provider.getCurrentUser();

            expect(user?.displayName).toBe('Test User');
            expect(user?.photoUrl).toBe('https://example.com/photo.jpg');
        });
    });

    describe('signOut()', () => {
        it('calls onSignOut when provided', async () => {
            const onSignOut = vi.fn().mockResolvedValue(undefined);

            const provider = createFirebaseAuthProvider(createConfig({ onSignOut }));

            await provider.signOut();

            expect(onSignOut).toHaveBeenCalledOnce();
        });

        it('does nothing when onSignOut is not provided', async () => {
            const provider = createFirebaseAuthProvider(
                createConfig({ onSignOut: undefined })
            );

            // Should not throw
            await expect(provider.signOut()).resolves.toBeUndefined();
        });
    });
});
