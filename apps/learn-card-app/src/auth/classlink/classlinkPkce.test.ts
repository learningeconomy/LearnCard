import { beforeEach, describe, expect, it } from 'vitest';
import {
    CLASSLINK_CALLBACK_PATH,
    consumeClassLinkAttempt,
    createClassLinkAttempt,
} from './classlinkPkce';

const STORAGE_KEY = 'learncard:classlink:attempt';
const TEN_MINUTES_MS = 10 * 60 * 1000;

const base64UrlEncode = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const sha256Base64Url = async (value: string): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return base64UrlEncode(new Uint8Array(digest));
};

describe('ClassLink PKCE attempt store', () => {
    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
    });

    it('derives the S256 code challenge as base64url(SHA-256(verifier))', async () => {
        const attempt = await createClassLinkAttempt();

        expect(attempt.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
        expect(attempt.codeChallenge).toBe(await sha256Base64Url(attempt.codeVerifier));
        expect(attempt.redirectUri).toBe(`${window.location.origin}${CLASSLINK_CALLBACK_PATH}`);
    });

    it('generates unique state/nonce per attempt', async () => {
        const a = await createClassLinkAttempt({ redirectTo: '/wallet' });
        const b = await createClassLinkAttempt({ redirectTo: '/wallet' });

        expect(a.state).not.toBe(b.state);
        expect(a.nonce).not.toBe(b.nonce);
        expect(a.codeVerifier).not.toBe(b.codeVerifier);
    });

    it('consumes a valid attempt exactly once', async () => {
        const { state } = await createClassLinkAttempt({ redirectTo: '/wallet' });

        const first = await consumeClassLinkAttempt(state);
        expect(first).not.toBeNull();
        expect(first?.state).toBe(state);
        expect(first?.redirectTo).toBe('/wallet');

        const replay = await consumeClassLinkAttempt(state);
        expect(replay).toBeNull();
    });

    it('rejects an attempt older than 10 minutes', async () => {
        const { state } = await createClassLinkAttempt();
        const raw = sessionStorage.getItem(STORAGE_KEY);
        expect(raw).toBeTruthy();
        const stored = JSON.parse(raw as string) as Record<string, unknown>;
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...stored, createdAt: Date.now() - TEN_MINUTES_MS - 1 })
        );

        expect(await consumeClassLinkAttempt(state)).toBeNull();
    });

    it('rejects a mismatched state and still single-uses the stored attempt', async () => {
        const { state } = await createClassLinkAttempt();

        expect(await consumeClassLinkAttempt('not-the-real-state')).toBeNull();
        // The mismatched read already deleted the record (delete-on-read).
        expect(await consumeClassLinkAttempt(state)).toBeNull();
    });

    it('returns null when no attempt is pending', async () => {
        expect(await consumeClassLinkAttempt('anything')).toBeNull();
    });
});
