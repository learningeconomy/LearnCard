import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { AnalyticsEvents } from '../analytics/events';

const { trackMock, pushMock, getProfileMock, initWalletMock, validateTextVCMock, fetchMock } =
    vi.hoisted(() => ({
        trackMock: vi.fn(),
        pushMock: vi.fn(),
        getProfileMock: vi.fn(),
        initWalletMock: vi.fn(),
        validateTextVCMock: vi.fn(),
        fetchMock: vi.fn(),
    }));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: pushMock }),
}));

vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: initWalletMock }),
}));

vi.mock('./useUploadVcFromText', () => ({
    useUploadVcFromText: () => ({ validateTextVC: validateTextVCMock }),
}));

vi.mock('../analytics/context', () => ({
    useAnalytics: () => ({ track: trackMock }),
}));

vi.mock('./resolveTenantParseConfig', () => ({
    resolveTenantParseConfig: () => ({}),
}));

import { useClaimInputRouter } from './useClaimInputRouter';

const renderRouter = () => renderHook(() => useClaimInputRouter({ defaultSource: 'paste' })).result;

const findTrackCall = () =>
    trackMock.mock.calls.find(([event]) => event === AnalyticsEvents.CLAIM_INPUT_ROUTED)?.[1];

describe('useClaimInputRouter', () => {
    beforeEach(() => {
        trackMock.mockReset();
        pushMock.mockReset();
        getProfileMock.mockReset();
        initWalletMock.mockReset();
        validateTextVCMock.mockReset();
        fetchMock.mockReset();
        (global as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        initWalletMock.mockResolvedValue({ invoke: { getProfile: getProfileMock } });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('routed kinds (history.push)', () => {
        it('routes oid4vci scheme into /oid4vci with encoded offer', async () => {
            const result = renderRouter();
            const outcome = await result.current(
                'openid-credential-offer://?credential_offer=%7B%7D',
                'paste'
            );

            expect(outcome.kind).toBe('routed');
            expect(pushMock).toHaveBeenCalledWith(expect.stringMatching(/^\/oid4vci\?offer=/));
            const decoded = decodeURIComponent(
                (pushMock.mock.calls[0][0] as string).split('offer=')[1]
            );
            expect(decoded).toBe('openid-credential-offer://?credential_offer=%7B%7D');
        });

        it('routes openid4vp scheme into /oid4vp with encoded request', async () => {
            const result = renderRouter();
            const outcome = await result.current('openid4vp://authorize?x=1', 'paste');

            expect(outcome.kind).toBe('routed');
            expect(pushMock).toHaveBeenCalledWith(expect.stringMatching(/^\/oid4vp\?request=/));
        });

        it('routes a vc-api custom scheme using the parsed path', async () => {
            const result = renderRouter();
            const outcome = await result.current('dccrequest://issuer.example/abc?x=1', 'paste');

            expect(outcome.kind).toBe('routed');
            if (outcome.kind === 'routed') {
                expect(outcome.surface).toBe('vc-api-custom-scheme');
                expect(outcome.path).toBe('/abc?x=1');
            }
            expect(pushMock).toHaveBeenCalledWith('/abc?x=1');
        });

        it('routes an lcw-https URL using the parsed path', async () => {
            const result = renderRouter();
            const outcome = await result.current('https://learncard.app/wallet/x', 'paste');

            expect(outcome.kind).toBe('routed');
            if (outcome.kind === 'routed') {
                expect(outcome.surface).toBe('lcw-https');
                expect(outcome.path).toBe('/wallet/x');
            }
        });
    });

    describe('modal-opening kinds (returned, not pushed)', () => {
        it('returns open_claim_boost without calling history.push', async () => {
            const result = renderRouter();
            const outcome = await result.current(
                'https://learncard.app/claim?boostUri=urn%3Aabc&challenge=xyz',
                'paste'
            );

            expect(pushMock).not.toHaveBeenCalled();
            expect(outcome.kind).toBe('open_claim_boost');
            if (outcome.kind === 'open_claim_boost') {
                expect(outcome.boost.uri).toBe('urn:abc');
                expect(outcome.boost.challenge).toBe('xyz');
            }
        });

        it('returns open_claim_vc for a valid raw VC', async () => {
            validateTextVCMock.mockReturnValue(null);
            const vc = {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiableCredential'],
                issuer: 'did:key:z',
                credentialSubject: { id: 'did:key:z' },
            };
            const result = renderRouter();
            const outcome = await result.current(JSON.stringify(vc), 'paste');

            expect(outcome.kind).toBe('open_claim_vc');
            if (outcome.kind === 'open_claim_vc') {
                expect(outcome.vc).toEqual(vc);
            }
            expect(validateTextVCMock).toHaveBeenCalledTimes(1);
        });

        it('returns unrecognized with invalid_vc when validateTextVC reports errors', async () => {
            validateTextVCMock.mockReturnValue(['some error']);
            const vc = {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiableCredential'],
            };
            const result = renderRouter();
            const outcome = await result.current(JSON.stringify(vc), 'paste');

            expect(outcome.kind).toBe('unrecognized');
            if (outcome.kind === 'unrecognized') {
                expect(outcome.reason).toBe('invalid_vc');
            }
        });
    });

    describe('connection-request flow', () => {
        it('returns open_contact when profile lookup succeeds', async () => {
            const contact = { profileId: 'alice', displayName: 'Alice' };
            getProfileMock.mockResolvedValue(contact);
            const result = renderRouter();
            const outcome = await result.current(
                'https://network.example.com/?did=did:web:net:users:alice',
                'paste'
            );

            expect(getProfileMock).toHaveBeenCalledWith('alice');
            expect(outcome.kind).toBe('open_contact');
            if (outcome.kind === 'open_contact') {
                expect(outcome.contact).toEqual(contact);
            }
        });

        it('returns unrecognized when profile lookup returns null', async () => {
            getProfileMock.mockResolvedValue(null);
            const result = renderRouter();
            const outcome = await result.current(
                'https://network.example.com/?did=did:web:net:users:ghost',
                'paste'
            );

            expect(outcome.kind).toBe('unrecognized');
            if (outcome.kind === 'unrecognized') {
                expect(outcome.reason).toBe('unknown_format');
            }
        });

        it('returns unrecognized when profile lookup throws', async () => {
            getProfileMock.mockRejectedValue(new Error('network down'));
            const result = renderRouter();
            const outcome = await result.current(
                'https://network.example.com/?did=did:web:net:users:flaky',
                'paste'
            );

            expect(outcome.kind).toBe('unrecognized');
        });
    });

    describe('interaction-url flow', () => {
        it('routes same-origin interaction claims through the SPA without fetching', async () => {
            const encodedClaim =
                'eyJib29zdFVyaSI6ImxjOm5ldHdvcms6Ym9vc3QiLCJjaGFsbGVuZ2UiOiJjaGFsbGVuZ2UifQ';
            const input = `${window.location.origin}/interactions/claim/${encodedClaim}?iuv=1`;
            const result = renderRouter();
            const outcome = await result.current(input, 'paste');

            expect(outcome).toEqual({
                kind: 'routed',
                surface: 'interaction',
                path: `/interactions/claim/${encodedClaim}?iuv=1`,
            });
            expect(pushMock).toHaveBeenCalledWith(`/interactions/claim/${encodedClaim}?iuv=1`);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('recursively routes the inner oid4vci offer into /oid4vci', async () => {
            fetchMock.mockResolvedValue({
                json: async () => ({
                    protocols: {
                        openid4vci: 'openid-credential-offer://?credential_offer=%7B%7D',
                    },
                }),
            });
            const result = renderRouter();
            const outcome = await result.current(
                'https://example.com/interact?iuv=1&id=abc',
                'paste'
            );

            expect(outcome.kind).toBe('routed');
            if (outcome.kind === 'routed') {
                expect(outcome.surface).toBe('oid4vci');
                expect(outcome.path).toMatch(/^\/oid4vci\?offer=/);
            }
            expect(pushMock).toHaveBeenCalledTimes(1);
        });

        it('returns open_website when interaction yields a website protocol', async () => {
            fetchMock.mockResolvedValue({
                json: async () => ({
                    protocols: { website: 'https://example.org/landing' },
                }),
            });
            const result = renderRouter();
            const outcome = await result.current('https://example.com/interact?iuv=1', 'paste');

            expect(outcome.kind).toBe('open_website');
            if (outcome.kind === 'open_website') {
                expect(outcome.url).toBe('https://example.org/landing');
            }
            expect(pushMock).not.toHaveBeenCalled();
        });

        it.each(['javascript:alert(document.domain)', '/relative-path'])(
            'rejects unsafe website protocol URL %s',
            async website => {
                fetchMock.mockResolvedValue({
                    json: async () => ({
                        protocols: { website },
                    }),
                });
                const result = renderRouter();
                const outcome = await result.current('https://example.com/interact?iuv=1', 'paste');

                expect(outcome).toMatchObject({
                    kind: 'unrecognized',
                    reason: 'interaction_unavailable',
                });
                expect(pushMock).not.toHaveBeenCalled();
            }
        );

        it('returns interaction_unavailable when an interaction returns 404', async () => {
            fetchMock.mockResolvedValue({ ok: false, status: 404 });
            const result = renderRouter();
            const outcome = await result.current('https://example.com/interact?iuv=1', 'paste');

            expect(outcome).toMatchObject({
                kind: 'unrecognized',
                reason: 'interaction_unavailable',
            });
        });

        it('returns interaction_unavailable when interaction fetch rejects', async () => {
            fetchMock.mockRejectedValue(new Error('boom'));
            const result = renderRouter();
            const outcome = await result.current('https://example.com/interact?iuv=1', 'paste');

            expect(outcome).toMatchObject({
                kind: 'unrecognized',
                reason: 'interaction_unavailable',
            });
        });

        it('passes an AbortSignal so the fetch can be cancelled on timeout', async () => {
            fetchMock.mockResolvedValue({ json: async () => ({ protocols: {} }) });
            const result = renderRouter();
            await result.current('https://example.com/interact?iuv=1', 'paste');

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [, init] = fetchMock.mock.calls[0];
            expect((init as RequestInit).signal).toBeInstanceOf(AbortSignal);
        });
    });

    describe('unrecognized passthrough', () => {
        it('returns the parser reason verbatim with the raw input attached', async () => {
            const result = renderRouter();
            const outcome = await result.current('   ', 'paste');

            expect(outcome.kind).toBe('unrecognized');
            if (outcome.kind === 'unrecognized') {
                expect(outcome.reason).toBe('empty');
                expect(outcome.raw).toBe('   ');
            }
        });
    });

    describe('analytics emission', () => {
        it('emits CLAIM_INPUT_ROUTED with source + parsed_kind + outcome', async () => {
            const result = renderRouter();
            await result.current('openid-credential-offer://?credential_offer=%7B%7D', 'paste');

            expect(trackMock).toHaveBeenCalledWith(
                AnalyticsEvents.CLAIM_INPUT_ROUTED,
                expect.objectContaining({
                    source: 'paste',
                    parsed_kind: 'oid4vci',
                    outcome: 'routed',
                    surface: 'oid4vci',
                })
            );
        });

        it('emits CLAIM_INPUT_ROUTED with unrecognized_reason on failure', async () => {
            const result = renderRouter();
            await result.current('this is not a link', 'image_upload');

            const payload = findTrackCall();
            expect(payload).toMatchObject({
                source: 'image_upload',
                parsed_kind: 'unrecognized',
                outcome: 'unrecognized',
                unrecognized_reason: 'unknown_format',
            });
        });

        it('falls back to defaultSource when no explicit source is passed', async () => {
            const result = renderRouter();
            await result.current('https://learncard.app/wallet/x');

            const payload = findTrackCall();
            expect(payload?.source).toBe('paste');
        });

        it('threads camera as the source through the default option', async () => {
            const { result } = renderHook(() => useClaimInputRouter({ defaultSource: 'camera' }));
            await result.current('https://learncard.app/wallet/x');

            const payload = findTrackCall();
            expect(payload?.source).toBe('camera');
        });
    });
});
