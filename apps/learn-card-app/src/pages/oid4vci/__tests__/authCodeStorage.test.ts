/**
 * Tests for the auth-code state-storage helper. Exercises the contract
 * the OpenID4VCI page relies on across the issuer-redirect round-trip:
 * persist a flow handle, read it back with the right `state`, age it
 * out after the TTL, and clear it cleanly.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
    clearAuthCodeState,
    loadAuthCodeState,
    saveAuthCodeState,
    type PersistedAuthCodeState,
} from '../authCodeStorage';

import type { AuthCodeFlowHandle } from '@learncard/openid4vc-plugin';

const baseHandle: AuthCodeFlowHandle = {
    version: 1,
    issuer: 'https://issuer.example.com',
    tokenEndpoint: 'https://issuer.example.com/token',
    credentialEndpoint: 'https://issuer.example.com/credential',
    configurationIds: ['UniversityDegreeCredential'],
    redirectUri: 'https://wallet.example.com/oid4vci',
    clientId: 'https://wallet.example.com',
    state: 'expected-state-abc',
    pkceVerifier: 'verifier-xyz',
    pkceMethod: 'S256',
    credentialConfigurations: {},
};

interface FakeStorage {
    setItem: (k: string, v: string) => void;
    getItem: (k: string) => string | null;
    removeItem: (k: string) => void;
}

const makeStorage = (): FakeStorage => {
    const data = new Map<string, string>();
    return {
        setItem: (k, v) => {
            data.set(k, v);
        },
        getItem: (k) => data.get(k) ?? null,
        removeItem: (k) => {
            data.delete(k);
        },
    };
};

describe('authCodeStorage', () => {
    let storage: FakeStorage;

    beforeEach(() => {
        storage = makeStorage();
    });

    describe('saveAuthCodeState', () => {
        it('persists the flow handle and offer URI', () => {
            const ok = saveAuthCodeState(
                baseHandle,
                'openid-credential-offer://?credential_offer=...',
                1_700_000_000_000,
                storage
            );

            expect(ok).toBe(true);
            const raw = storage.getItem('oid4vci.flowHandle.v1');
            expect(raw).toBeTruthy();

            const parsed = JSON.parse(raw!) as PersistedAuthCodeState;
            expect(parsed.flowHandle).toEqual(baseHandle);
            expect(parsed.offerUri).toBe(
                'openid-credential-offer://?credential_offer=...'
            );
            expect(parsed.startedAt).toBe(1_700_000_000_000);
        });

        it('returns false when storage is unavailable', () => {
            const ok = saveAuthCodeState(baseHandle, 'offer', undefined, null);
            expect(ok).toBe(false);
        });
    });

    describe('loadAuthCodeState', () => {
        it('returns the persisted state when the state parameter matches', () => {
            saveAuthCodeState(baseHandle, 'offer', 1_700_000_000_000, storage);

            const loaded = loadAuthCodeState(
                'expected-state-abc',
                1_700_000_000_000 + 60_000,
                30 * 60 * 1000,
                storage
            );

            expect(loaded).not.toBeNull();
            expect(loaded?.flowHandle).toEqual(baseHandle);
        });

        it('returns null when the state parameter does NOT match', () => {
            saveAuthCodeState(baseHandle, 'offer', 1_700_000_000_000, storage);

            const loaded = loadAuthCodeState(
                'wrong-state',
                1_700_000_000_000 + 60_000,
                30 * 60 * 1000,
                storage
            );

            expect(loaded).toBeNull();
        });

        it('returns the persisted state when no expectedState is supplied', () => {
            saveAuthCodeState(baseHandle, 'offer', 1_700_000_000_000, storage);

            const loaded = loadAuthCodeState(
                undefined,
                1_700_000_000_000 + 60_000,
                30 * 60 * 1000,
                storage
            );

            expect(loaded).not.toBeNull();
        });

        it('returns null when the persisted state has aged out', () => {
            saveAuthCodeState(baseHandle, 'offer', 1_700_000_000_000, storage);

            const loaded = loadAuthCodeState(
                'expected-state-abc',
                1_700_000_000_000 + 60 * 60 * 1000, // 1 hour later
                30 * 60 * 1000, // 30-minute TTL
                storage
            );

            expect(loaded).toBeNull();
        });

        it('returns null when nothing was persisted', () => {
            const loaded = loadAuthCodeState(
                'any-state',
                Date.now(),
                30 * 60 * 1000,
                storage
            );

            expect(loaded).toBeNull();
        });

        it('returns null on malformed JSON', () => {
            storage.setItem('oid4vci.flowHandle.v1', 'not-json');

            const loaded = loadAuthCodeState(
                'any-state',
                Date.now(),
                30 * 60 * 1000,
                storage
            );

            expect(loaded).toBeNull();
        });

        it('returns null when storage is unavailable', () => {
            const loaded = loadAuthCodeState(
                'any-state',
                Date.now(),
                30 * 60 * 1000,
                null
            );

            expect(loaded).toBeNull();
        });
    });

    describe('clearAuthCodeState', () => {
        it('removes the persisted state', () => {
            saveAuthCodeState(baseHandle, 'offer', 1_700_000_000_000, storage);
            expect(storage.getItem('oid4vci.flowHandle.v1')).not.toBeNull();

            clearAuthCodeState(storage);
            expect(storage.getItem('oid4vci.flowHandle.v1')).toBeNull();
        });

        it('is idempotent and safe when nothing is persisted', () => {
            expect(() => clearAuthCodeState(storage)).not.toThrow();
        });

        it('is a no-op when storage is unavailable', () => {
            expect(() => clearAuthCodeState(null)).not.toThrow();
        });
    });
});
