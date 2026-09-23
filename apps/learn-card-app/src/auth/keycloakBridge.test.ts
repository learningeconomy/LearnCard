import { describe, it, expect, vi } from 'vitest';

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { buildKeycloakBridgeUrl, resolveKeycloakBridgeUrl } from './keycloakBridge';

describe('buildKeycloakBridgeUrl', () => {
    it('returns authorizeUrl if bridgeUrl is not provided', () => {
        const authorizeUrl = 'https://keycloak.example.com/auth';
        expect(buildKeycloakBridgeUrl(authorizeUrl)).toBe(authorizeUrl);
    });

    it('appends authorizeUrl as next hash parameter to bridgeUrl', () => {
        const authorizeUrl = 'https://keycloak.example.com/auth?client_id=123';
        const bridgeUrl = 'https://app.example.com/auth/continue.html';

        const result = buildKeycloakBridgeUrl(authorizeUrl, bridgeUrl);

        expect(result).toBe(
            'https://app.example.com/auth/continue.html#next=https%3A%2F%2Fkeycloak.example.com%2Fauth%3Fclient_id%3D123'
        );
    });

    it('strips existing fragment from bridgeUrl', () => {
        const authorizeUrl = 'https://keycloak.example.com/auth';
        const bridgeUrl = 'https://app.example.com/auth/continue.html#old=hash';

        const result = buildKeycloakBridgeUrl(authorizeUrl, bridgeUrl);

        expect(result).toBe(
            'https://app.example.com/auth/continue.html#next=https%3A%2F%2Fkeycloak.example.com%2Fauth'
        );
    });
});

describe('resolveKeycloakBridgeUrl', () => {
    const authorizeUrl = 'https://keycloak.example.com/realms/r/protocol/openid-connect/auth?x=1';
    const bridgeUrl = 'https://app.example.com/auth/continue.html';

    it('returns authorizeUrl without probing when no bridge is configured', async () => {
        const fetcher = vi.fn();
        await expect(resolveKeycloakBridgeUrl(authorizeUrl, undefined, fetcher)).resolves.toBe(
            authorizeUrl
        );
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('uses the bridge when the probe resolves (opaque no-cors response)', async () => {
        const fetcher = vi.fn(async () => new Response(null));
        await expect(resolveKeycloakBridgeUrl(authorizeUrl, bridgeUrl, fetcher)).resolves.toBe(
            buildKeycloakBridgeUrl(authorizeUrl, bridgeUrl)
        );
        expect(fetcher).toHaveBeenCalledWith(
            bridgeUrl,
            expect.objectContaining({ method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
        );
    });

    it('falls back to authorizeUrl when the bridge is unreachable', async () => {
        const fetcher = vi.fn(async () => {
            throw new TypeError('Load failed');
        });
        await expect(resolveKeycloakBridgeUrl(authorizeUrl, bridgeUrl, fetcher)).resolves.toBe(
            authorizeUrl
        );
    });

    it('falls back to authorizeUrl when the probe times out', async () => {
        vi.useFakeTimers();
        const fetcher = vi.fn(
            (_url: string, init?: RequestInit) =>
                new Promise<Response>((_, reject) => {
                    init?.signal?.addEventListener('abort', () =>
                        reject(new DOMException('Aborted', 'AbortError'))
                    );
                })
        );
        const pending = resolveKeycloakBridgeUrl(authorizeUrl, bridgeUrl, fetcher, 1500);
        await vi.advanceTimersByTimeAsync(1500);
        await expect(pending).resolves.toBe(authorizeUrl);
        vi.useRealTimers();
    });
});
