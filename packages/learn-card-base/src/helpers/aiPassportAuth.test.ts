import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

import type { BespokeLearnCard } from '../types/learn-card';
import { networkStore } from '../stores/NetworkStore';
import { walletStore } from '../stores/walletStore';
import {
    aiPassportFetch,
    clearAiPassportAuth,
    ensureAiPassportSession,
    getAiPassportAuthMode,
    getAiPassportLaunchUrl,
    getAiPassportWebSocketProtocols,
    getAiPassportUrl,
} from './aiPassportAuth';

const originalFetch = globalThis.fetch;

const wallet = (did: string, issuePresentation: Mock) =>
    ({
        id: { did: () => did },
        invoke: { issuePresentation },
    } as unknown as BespokeLearnCard);

afterEach(() => {
    globalThis.fetch = originalFetch;
    walletStore.set.wallet(null);
});

describe('ensureAiPassportSession', () => {
    it('signs the backend challenge and exchanges the DID Auth VP for a cookie session', async () => {
        const did = 'did:key:holder';
        const issuePresentation = vi.fn(async () => 'signed.jwt.presentation');
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({
                    audience: 'https://api.example.test',
                    binding: 'secure-binding',
                    challenge: 'secure-challenge',
                })
            )
            .mockResolvedValueOnce(
                Response.json({ authenticated: true, did, token: 'session-token' })
            );

        networkStore.set.aiServiceUrl('https://api.example.test');
        globalThis.fetch = fetchMock as typeof fetch;

        await expect(ensureAiPassportSession(wallet(did, issuePresentation))).resolves.toBe(
            'session'
        );

        expect(issuePresentation).toHaveBeenCalledWith(
            expect.objectContaining({ holder: did, type: ['VerifiablePresentation'] }),
            {
                challenge: 'secure-challenge',
                domain: 'https://api.example.test',
                proofFormat: 'jwt',
                proofPurpose: 'authentication',
            }
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            new URL('https://api.example.test/auth/challenge'),
            expect.objectContaining({ credentials: 'include', method: 'POST' })
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            3,
            new URL('https://api.example.test/auth/session'),
            expect.objectContaining({
                credentials: 'include',
                body: JSON.stringify({
                    binding: 'secure-binding',
                    challenge: 'secure-challenge',
                    vp: 'signed.jwt.presentation',
                }),
            })
        );
    });

    it('accepts a subject-matched cookie-only session without requiring a bearer', async () => {
        const did = 'did:key:cookie-only';
        const issuePresentation = vi.fn(async () => 'cookie-only.jwt');
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({
                    audience: 'https://cookie-only.example.test',
                    binding: 'cookie-binding',
                    challenge: 'cookie-challenge',
                })
            )
            .mockResolvedValueOnce(Response.json({ authenticated: true, did }))
            .mockResolvedValueOnce(Response.json({ ok: true }));

        networkStore.set.aiServiceUrl('https://cookie-only.example.test');
        globalThis.fetch = fetchMock as typeof fetch;

        await expect(ensureAiPassportSession(wallet(did, issuePresentation))).resolves.toBe(
            'session'
        );
        await expect(aiPassportFetch('/threads', {}, did)).resolves.toBeInstanceOf(Response);

        const requestHeaders = new Headers(fetchMock.mock.calls[3]![1]?.headers);

        expect(requestHeaders.has('Authorization')).toBe(false);
    });

    it('evicts a stale bearer when 401 re-authentication succeeds with cookies only', async () => {
        const did = 'did:key:cookie-reauth';
        const issuePresentation = vi.fn(async () => 'cookie-reauth.jwt');
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({
                    audience: 'https://cookie-reauth.example.test',
                    binding: 'initial-binding',
                    challenge: 'initial-challenge',
                })
            )
            .mockResolvedValueOnce(
                Response.json({ authenticated: true, did, token: 'stale-token' })
            )
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({
                    audience: 'https://cookie-reauth.example.test',
                    binding: 'replacement-binding',
                    challenge: 'replacement-challenge',
                })
            )
            .mockResolvedValueOnce(Response.json({ authenticated: true, did }))
            .mockResolvedValueOnce(Response.json({ ok: true }));

        networkStore.set.aiServiceUrl('https://cookie-reauth.example.test');
        globalThis.fetch = fetchMock as typeof fetch;

        await ensureAiPassportSession(wallet(did, issuePresentation));
        await expect(aiPassportFetch('/threads', {}, did)).resolves.toBeInstanceOf(Response);

        expect(new Headers(fetchMock.mock.calls[3]![1]?.headers).get('Authorization')).toBe(
            'Bearer stale-token'
        );
        expect(new Headers(fetchMock.mock.calls[7]![1]?.headers).has('Authorization')).toBe(false);
    });

    it('reuses an existing subject-matched backend session without signing', async () => {
        const did = 'did:key:existing';
        const issuePresentation = vi.fn();
        const fetchMock = vi.fn(async () => Response.json({ authenticated: true, did }));

        networkStore.set.aiServiceUrl('https://existing.example.test');
        globalThis.fetch = fetchMock as typeof fetch;

        await expect(ensureAiPassportSession(wallet(did, issuePresentation))).resolves.toBe(
            'session'
        );

        expect(issuePresentation).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('falls back only when the challenge capability is deterministically absent', async () => {
        const did = 'did:key:legacy';
        const issuePresentation = vi.fn();
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                Response.json({ error: 'Authentication required' }, { status: 401 })
            )
            .mockResolvedValueOnce(
                Response.json({ error: 'Authentication required' }, { status: 401 })
            );

        networkStore.set.aiServiceUrl('https://legacy.example.test');
        globalThis.fetch = fetchMock as typeof fetch;

        await expect(ensureAiPassportSession(wallet(did, issuePresentation))).resolves.toBe(
            'legacy'
        );

        expect(issuePresentation).not.toHaveBeenCalled();
        expect(getAiPassportAuthMode(did)).toBe('legacy');
        expect(getAiPassportUrl('/threads', did).searchParams.get('did')).toBe(did);
        expect(
            new URL(
                getAiPassportLaunchUrl('https://legacy-app.example.test/chats?topic=test', did)
            ).searchParams.get('did')
        ).toBe(did);
        await expect(getAiPassportWebSocketProtocols(did)).resolves.toBeUndefined();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('renegotiates a legacy tab after the backend upgrades without requiring reload', async () => {
        const did = 'did:key:rollout';
        const issuePresentation = vi.fn(async () => 'rollout.jwt');
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({ error: 'Authentication required' }, { status: 401 })
            )
            .mockResolvedValueOnce(
                Response.json({ error: 'Authentication required' }, { status: 401 })
            )
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({
                    audience: 'https://rollout.example.test',
                    binding: 'rollout-binding',
                    challenge: 'rollout-challenge',
                })
            )
            .mockResolvedValueOnce(
                Response.json({ authenticated: true, did, token: 'rollout-token' })
            )
            .mockResolvedValueOnce(Response.json([]))
            .mockResolvedValueOnce(Response.json({ status: 'queued' }))
            .mockResolvedValueOnce(Response.json({ ticket: 't'.repeat(43) }));

        networkStore.set.aiServiceUrl('https://rollout.example.test');
        globalThis.fetch = fetchMock as typeof fetch;
        const account = wallet(did, issuePresentation);

        await expect(ensureAiPassportSession(account)).resolves.toBe('legacy');

        const response = await aiPassportFetch('/threads', {}, did);
        const legacyRequest = new URL(fetchMock.mock.calls[2]![0] as URL);
        const retriedRequest = new URL(fetchMock.mock.calls[6]![0] as URL);
        const retriedHeaders = new Headers(fetchMock.mock.calls[6]![1]?.headers);
        const form = new FormData();

        form.set('threadId', 'thread-1');
        form.set('event', 'visible');
        await aiPassportFetch(
            '/threads/visibility',
            { method: 'POST', body: form, keepalive: true },
            did
        );

        const visibilityOptions = fetchMock.mock.calls[7]![1]!;
        const visibilityHeaders = new Headers(visibilityOptions.headers);

        expect(response.status).toBe(200);
        expect(getAiPassportAuthMode(did)).toBe('session');
        expect(issuePresentation).toHaveBeenCalledOnce();
        expect(legacyRequest.searchParams.get('did')).toBe(did);
        expect(retriedRequest.searchParams.has('did')).toBe(false);
        await expect(getAiPassportWebSocketProtocols(did)).resolves.toEqual([
            'ai-passport',
            `ai-passport-ticket.${'t'.repeat(43)}`,
        ]);
        expect(retriedHeaders.get('Authorization')).toBe('Bearer rollout-token');
        expect(visibilityOptions.keepalive).toBe(true);
        expect(visibilityHeaders.get('Authorization')).toBe('Bearer rollout-token');
    });

    it('mints a fresh one-time ticket without exposing the durable bearer', async () => {
        const did = 'did:key:websocket-ticket';
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({
                    audience: 'https://ticket.example.test',
                    binding: 'ticket-binding',
                    challenge: 'ticket-challenge',
                })
            )
            .mockResolvedValueOnce(
                Response.json({ authenticated: true, did, token: 'durable-session-token' })
            )
            .mockResolvedValueOnce(Response.json({ ticket: 'a'.repeat(43) }))
            .mockResolvedValueOnce(Response.json({ ticket: 'b'.repeat(43) }));

        networkStore.set.aiServiceUrl('https://ticket.example.test');
        globalThis.fetch = fetchMock as typeof fetch;

        await ensureAiPassportSession(
            wallet(
                did,
                vi.fn(async () => 'ticket.jwt')
            )
        );

        const first = await getAiPassportWebSocketProtocols(did);
        const second = await getAiPassportWebSocketProtocols(did);
        const firstTicketRequest = new URL(fetchMock.mock.calls[3]![0] as URL);
        const firstTicketHeaders = new Headers(fetchMock.mock.calls[3]![1]?.headers);

        expect(first).toEqual(['ai-passport', `ai-passport-ticket.${'a'.repeat(43)}`]);
        expect(second).toEqual(['ai-passport', `ai-passport-ticket.${'b'.repeat(43)}`]);
        expect(first).not.toEqual(second);
        expect(firstTicketRequest.pathname).toBe('/auth/websocket-ticket');
        expect(firstTicketRequest.search).toBe('');
        expect(firstTicketHeaders.get('Authorization')).toBe('Bearer durable-session-token');
        expect(first?.join(',')).not.toContain('durable-session-token');
        expect(second?.join(',')).not.toContain('durable-session-token');
    });

    it('rejects cross-origin authenticated requests before sending credentials', async () => {
        const did = 'did:key:origin-bound';
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({
                    audience: 'https://origin.example.test',
                    binding: 'origin-binding',
                    challenge: 'origin-challenge',
                })
            )
            .mockResolvedValueOnce(
                Response.json({ authenticated: true, did, token: 'origin-session-token' })
            )
            .mockResolvedValueOnce(Response.json({ ok: true }));

        networkStore.set.aiServiceUrl('https://origin.example.test/api/');
        globalThis.fetch = fetchMock as typeof fetch;

        await ensureAiPassportSession(
            wallet(
                did,
                vi.fn(async () => 'origin.jwt')
            )
        );
        fetchMock.mockClear();

        await expect(
            aiPassportFetch('https://attacker.example.test/steal', {}, did)
        ).rejects.toThrow(
            'AI Passport authenticated requests must use the configured service origin'
        );
        expect(fetchMock).not.toHaveBeenCalled();

        await expect(
            aiPassportFetch('https://origin.example.test/threads', {}, did)
        ).resolves.toBeInstanceOf(Response);
        expect(new URL(fetchMock.mock.calls[0]![0] as URL).origin).toBe(
            'https://origin.example.test'
        );
        expect(new Headers(fetchMock.mock.calls[0]![1]?.headers).get('Authorization')).toBe(
            'Bearer origin-session-token'
        );
    });

    it('negotiates a session before sending when a caller skips the auth preflight', async () => {
        const did = 'did:key:no-preflight';
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({
                    audience: 'https://preflight.example.test',
                    binding: 'preflight-binding',
                    challenge: 'preflight-challenge',
                })
            )
            .mockResolvedValueOnce(
                Response.json({ authenticated: true, did, token: 'preflight-token' })
            )
            .mockResolvedValueOnce(Response.json([]));

        networkStore.set.aiServiceUrl('https://preflight.example.test');
        globalThis.fetch = fetchMock as typeof fetch;
        walletStore.set.wallet(
            wallet(
                did,
                vi.fn(async () => 'preflight.jwt')
            )
        );

        const response = await aiPassportFetch('/threads', {}, did);

        expect(response.status).toBe(200);
        expect(getAiPassportAuthMode(did)).toBe('session');
        expect(new Headers(fetchMock.mock.calls[3]![1]?.headers).get('Authorization')).toBe(
            'Bearer preflight-token'
        );
    });

    it('rejects authenticated fetches when no wallet can establish a session', async () => {
        const did = 'did:key:no-wallet';
        const fetchMock = vi.fn();

        networkStore.set.aiServiceUrl('https://no-wallet.example.test');
        globalThis.fetch = fetchMock as typeof fetch;
        walletStore.set.wallet(null);

        await expect(aiPassportFetch('/threads', {}, did)).rejects.toThrow(
            'AI Passport authentication requires an initialized wallet'
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('drops negotiated modes and durable bearers on clearAiPassportAuth', async () => {
        const did = 'did:key:cleared';
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({
                    audience: 'https://cleared.example.test',
                    binding: 'cleared-binding',
                    challenge: 'cleared-challenge',
                })
            )
            .mockResolvedValueOnce(
                Response.json({ authenticated: true, did, token: 'cleared-token' })
            );

        networkStore.set.aiServiceUrl('https://cleared.example.test');
        globalThis.fetch = fetchMock as typeof fetch;

        await ensureAiPassportSession(
            wallet(
                did,
                vi.fn(async () => 'cleared.jwt')
            )
        );

        expect(getAiPassportAuthMode(did)).toBe('session');

        clearAiPassportAuth();
        fetchMock.mockClear();
        walletStore.set.wallet(null);

        expect(getAiPassportAuthMode(did)).toBeUndefined();
        await expect(aiPassportFetch('/threads', {}, did)).rejects.toThrow(
            'AI Passport authentication requires an initialized wallet'
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not downgrade on backend or network failures', async () => {
        const did = 'did:key:failed';
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(new Response(null, { status: 503 }));

        networkStore.set.aiServiceUrl('https://failed.example.test');
        globalThis.fetch = fetchMock as typeof fetch;

        await expect(ensureAiPassportSession(wallet(did, vi.fn()))).rejects.toThrow(
            'AI Passport challenge request failed (503)'
        );
        expect(getAiPassportAuthMode(did)).toBeUndefined();
    });
});
