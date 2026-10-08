import { describe, it, expect, vi } from 'vitest';

// The `useInviteLink` react-query hook (defined in the module under test) pulls
// in `learn-card-base` and `bootstrapTenantConfig`. Their real module graphs
// load the DIDKit WASM, web3auth, Sentry and Firebase at import time, which
// crashes in jsdom. These tests only exercise the pure link resolver, so mock
// those two modules out. The test cases and assertions are untouched.
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: vi.fn() }),
    switchedProfileStore: {
        use: { switchedDid: vi.fn(() => undefined) },
        get: { switchedDid: vi.fn(() => undefined) },
    },
}));
vi.mock('../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'https://learncard.app',
}));

import {
    selectReusableInvite,
    resolveInviteLink,
    INVITE_EXPIRATION_SECONDS,
    UNLIMITED_MAX_USES,
} from './useInviteLink';

const BASE = 'https://learncard.app';

const makeWallet = (
    invites: Array<{
        challenge: string;
        expiresIn: number | null;
        usesRemaining: number | null;
        maxUses: number | null;
    }>,
    generated = { profileId: 'jackson', challenge: 'fresh-challenge', expiresIn: 2592000 }
) => {
    const generateInvite = vi.fn(async () => generated);

    return {
        wallet: {
            invoke: {
                listInvites: vi.fn(async () => invites),
                getProfile: vi.fn(async () => ({ profileId: 'jackson' })),
                generateInvite,
            },
        },
        generateInvite,
    };
};

describe('selectReusableInvite', () => {
    it('picks an unlimited invite', () => {
        const unlimited = { challenge: 'u', expiresIn: 100, usesRemaining: null, maxUses: null };

        expect(selectReusableInvite([unlimited])).toBe(unlimited);
    });

    it('ignores single-use invites left behind by the share modal', () => {
        const single = { challenge: 's', expiresIn: 999999, usesRemaining: 1, maxUses: 1 };

        expect(selectReusableInvite([single])).toBeUndefined();
    });

    it('prefers the longest-lived unlimited invite', () => {
        const soon = { challenge: 'soon', expiresIn: 60, usesRemaining: null, maxUses: null };
        const later = { challenge: 'later', expiresIn: 999999, usesRemaining: null, maxUses: null };

        expect(selectReusableInvite([soon, later])?.challenge).toBe('later');
    });

    it('treats a never-expiring invite as the longest-lived', () => {
        const dated = { challenge: 'dated', expiresIn: 999999, usesRemaining: null, maxUses: null };
        const forever = {
            challenge: 'forever',
            expiresIn: null,
            usesRemaining: null,
            maxUses: null,
        };

        expect(selectReusableInvite([dated, forever])?.challenge).toBe('forever');
    });

    it('returns undefined for an empty list', () => {
        expect(selectReusableInvite([])).toBeUndefined();
    });
});

describe('resolveInviteLink', () => {
    it('reuses an existing unlimited invite without generating a new one', async () => {
        const { wallet, generateInvite } = makeWallet([
            { challenge: 'existing', expiresIn: 1000, usesRemaining: null, maxUses: null },
        ]);

        const result = await resolveInviteLink(wallet as never, BASE);

        expect(generateInvite).not.toHaveBeenCalled();
        expect(result).toEqual({
            url: `${BASE}/invite?challenge=existing&profileId=jackson`,
            challenge: 'existing',
            profileId: 'jackson',
            expiresIn: 1000,
        });
    });

    it('generates an unlimited 30-day invite when none exists', async () => {
        const { wallet, generateInvite } = makeWallet([]);

        const result = await resolveInviteLink(wallet as never, BASE);

        expect(generateInvite).toHaveBeenCalledWith(
            expect.any(String),
            INVITE_EXPIRATION_SECONDS,
            UNLIMITED_MAX_USES
        );
        expect(result.url).toBe(`${BASE}/invite?challenge=fresh-challenge&profileId=jackson`);
    });

    it('generates when the only invites on record are single-use', async () => {
        const { wallet, generateInvite } = makeWallet([
            { challenge: 'burned', expiresIn: 1000, usesRemaining: 1, maxUses: 1 },
        ]);

        await resolveInviteLink(wallet as never, BASE);

        expect(generateInvite).toHaveBeenCalledTimes(1);
    });

    it('generates when listInvites is unavailable on the wallet', async () => {
        const generateInvite = vi.fn(async () => ({
            profileId: 'jackson',
            challenge: 'fresh-challenge',
            expiresIn: 2592000,
        }));
        const wallet = {
            invoke: { getProfile: vi.fn(async () => ({ profileId: 'jackson' })), generateInvite },
        };

        const result = await resolveInviteLink(wallet as never, BASE);

        expect(result.challenge).toBe('fresh-challenge');
    });

    it('escapes values that are unsafe in a query string', async () => {
        const { wallet } = makeWallet([
            { challenge: 'a b&c', expiresIn: 1000, usesRemaining: null, maxUses: null },
        ]);

        const result = await resolveInviteLink(wallet as never, BASE);

        expect(result.url).toBe(`${BASE}/invite?challenge=a%20b%26c&profileId=jackson`);
    });

    it('throws a clear error when no profileId can be resolved', async () => {
        const wallet = {
            invoke: {
                listInvites: vi.fn(async () => []),
                getProfile: vi.fn(async () => undefined),
                generateInvite: vi.fn(async () => ({
                    profileId: undefined,
                    challenge: 'x',
                    expiresIn: 1,
                })),
            },
        };

        await expect(resolveInviteLink(wallet as never, BASE)).rejects.toThrow(/profile/i);
    });
});
