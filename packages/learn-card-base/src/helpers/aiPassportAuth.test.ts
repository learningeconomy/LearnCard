import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

import type { BespokeLearnCard } from '../types/learn-card';
import { networkStore } from '../stores/NetworkStore';
import { walletStore } from '../stores/walletStore';
import {
    aiPassportFetch,
    clearAiPassportAuth,
    ensureAiPassportSession,
    getAiPassportAuthMode,
    getAiPassportWebSocketProtocols,
} from './aiPassportAuth';

const originalFetch = globalThis.fetch;

const wallet = (did: string, issuePresentation: Mock) => {
    const account = {
        id: { did: () => did },
        invoke: { issuePresentation },
    } as unknown as BespokeLearnCard;
    walletStore.set.wallet(account);
    return account;
};

afterEach(() => {
    clearAiPassportAuth();
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

    it('rejects unsupported challenge authentication without sending user data', async () => {
        const did = 'did:key:unsupported';
        const issuePresentation = vi.fn();
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(new Response(null, { status: 404 }));
        networkStore.set.aiServiceUrl('https://unsupported.example.test');
        globalThis.fetch = fetchMock as typeof fetch;
        wallet(did, issuePresentation);

        await expect(
            aiPassportFetch(
                '/ai/learner-context/format',
                {
                    method: 'POST',
                    body: JSON.stringify({ instructions: 'Private learner instructions' }),
                },
                did
            )
        ).rejects.toThrow();
        expect(getAiPassportAuthMode(did)).toBeUndefined();
        expect(issuePresentation).not.toHaveBeenCalled();
        expect(fetchMock.mock.calls.map(call => new URL(call[0]).pathname)).toEqual([
            '/auth/session',
            '/auth/challenge',
        ]);
    });

    it('does not resend user data if session renewal is unsupported', async () => {
        const did = 'did:key:renewal';
        networkStore.set.aiServiceUrl('https://renewal.example.test');
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(Response.json({ authenticated: true, did }))
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(new Response(null, { status: 404 }));
        globalThis.fetch = fetchMock as typeof fetch;
        await ensureAiPassportSession(wallet(did, vi.fn()));
        await expect(
            aiPassportFetch(
                '/threads',
                {
                    method: 'POST',
                    body: 'private learner data',
                },
                did
            )
        ).rejects.toThrow();
        expect(fetchMock.mock.calls.map(call => new URL(call[0]).pathname)).toEqual([
            '/auth/session',
            '/threads',
            '/auth/session',
            '/auth/challenge',
        ]);
        expect(getAiPassportAuthMode(did)).toBeUndefined();
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

    it('does not exchange an in-flight signature or send user data after logout', async () => {
        const did = 'did:key:logout-signing';
        let finishSigning!: (value: string) => void;
        let signingStarted!: () => void;
        const started = new Promise<void>(resolve => {
            signingStarted = resolve;
        });
        const signature = new Promise<string>(resolve => {
            finishSigning = resolve;
        });
        const issuePresentation = vi.fn(() => {
            signingStarted();
            return signature;
        });
        networkStore.set.aiServiceUrl('https://logout.example.test');
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(
                Response.json({
                    audience: 'https://logout.example.test',
                    binding: 'binding',
                    challenge: 'challenge',
                })
            );
        globalThis.fetch = fetchMock as typeof fetch;
        wallet(did, issuePresentation);
        const request = aiPassportFetch('/threads', { method: 'POST', body: 'private' }, did);
        const rejected = expect(request).rejects.toThrow();
        await started;
        clearAiPassportAuth();
        walletStore.set.wallet(null);
        finishSigning('signed.jwt');
        await rejected;
        expect(getAiPassportAuthMode(did)).toBeUndefined();
        expect(fetchMock.mock.calls.map(call => new URL(call[0]).pathname)).toEqual([
            '/auth/session',
            '/auth/challenge',
        ]);
    });

    it('does not let an old negotiation restore or erase state after logout and login', async () => {
        const did = 'did:key:logout-pending';
        let finishOld!: (value: Response) => void;
        const oldResponse = new Promise<Response>(resolve => {
            finishOld = resolve;
        });
        networkStore.set.aiServiceUrl('https://pending.example.test');
        const fetchMock = vi
            .fn()
            .mockReturnValueOnce(oldResponse)
            .mockResolvedValueOnce(Response.json({ authenticated: true, did }));
        globalThis.fetch = fetchMock as typeof fetch;
        const oldRequest = ensureAiPassportSession(wallet(did, vi.fn()));
        const rejected = expect(oldRequest).rejects.toThrow();
        clearAiPassportAuth();
        await ensureAiPassportSession(wallet(did, vi.fn()));
        finishOld(Response.json({ authenticated: true, did, token: 'old-token' }));
        await rejected;
        expect(getAiPassportAuthMode(did)).toBe('session');
        fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));
        await aiPassportFetch('/threads', {}, did);
        expect(new Headers(fetchMock.mock.calls[2]![1]?.headers).has('Authorization')).toBe(false);
    });

    it.each(['account', 'service'] as const)(
        'does not retry after switching %s away and back',
        async switchKind => {
            const did = 'did:key:switch';
            let finishRequest!: (value: Response) => void;
            let requestStarted!: () => void;
            const started = new Promise<void>(resolve => {
                requestStarted = resolve;
            });
            const response = new Promise<Response>(resolve => {
                finishRequest = resolve;
            });
            networkStore.set.aiServiceUrl('https://switch.example.test');
            const fetchMock = vi
                .fn()
                .mockResolvedValueOnce(Response.json({ authenticated: true, did }))
                .mockImplementationOnce(() => {
                    requestStarted();
                    return response;
                });
            globalThis.fetch = fetchMock as typeof fetch;
            const account = wallet(did, vi.fn());
            await ensureAiPassportSession(account);
            const request = aiPassportFetch('/threads', {}, did);
            const rejected = expect(request).rejects.toThrow();
            await started;
            if (switchKind === 'account') {
                wallet('did:key:other', vi.fn());
                walletStore.set.wallet(account);
            } else {
                networkStore.set.aiServiceUrl('https://other.example.test');
                networkStore.set.aiServiceUrl('https://switch.example.test');
            }
            finishRequest(new Response(null, { status: 401 }));
            await rejected;
            expect(fetchMock.mock.calls.map(call => new URL(call[0]).pathname)).toEqual([
                '/auth/session',
                '/threads',
            ]);
        }
    );
});
