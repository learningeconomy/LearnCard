import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
const capture = vi.hoisted(() => ({
    stop: vi.fn(),
    reset: vi.fn(),
    disable: vi.fn(),
    analytics: vi.fn(async () => undefined),
    logger: vi.fn(),
}));
vi.mock('@sentry/react', () => ({ getReplay: () => ({ stop: capture.stop }) }));
vi.mock('userflow.js', () => ({
    default: { setPageTrackingDisabled: capture.disable, reset: capture.reset },
}));
vi.mock('@capacitor-firebase/analytics', () => ({
    FirebaseAnalytics: { setEnabled: capture.analytics },
}));
vi.mock('learn-card-base/logging/logger', () => ({ configureLoggerContext: capture.logger }));
import {
    scrubShareTelemetry,
    isShareViewerPath,
    enterSharePrivacy,
    isSharePrivateSession,
    useSharePrivateSession,
} from './sharePrivacy';
describe('share privacy', () => {
    it.each([
        ['/s', true],
        ['/s/', true],
        ['/s/abc', true],
        ['/settings', false],
        ['/share-boost', false],
        ['/wallet/s/abc', false],
    ])('recognizes only the private viewer prefix: %s', (pathname, expected) => {
        expect(isShareViewerPath(pathname)).toBe(expected);
    });
    it('scrubs initial URLs, router breadcrumbs, and nested error text without changing the address bar', () => {
        const before = window.location.href;
        const event = {
            request: { url: 'https://tenant.example/s/abc#secret' },
            data: { from: '/s/abc#other', to: '/home' },
            message: 'Failed https://tenant.example/s/abc?x=1#key',
        };
        const result = scrubShareTelemetry(event);
        expect(JSON.stringify(result)).not.toMatch(/secret|other|#key/);
        expect(event.request.url).toContain('#secret');
        expect(window.location.href).toBe(before);
    });
    it('updates mounted privacy consumers after render without repeating capture resets', async () => {
        const { result, unmount } = renderHook(() => useSharePrivateSession());
        expect(result.current).toBe(false);
        await act(async () => {
            enterSharePrivacy();
            enterSharePrivacy();
        });
        expect(capture.reset).toHaveBeenCalledOnce();
        expect(capture.stop).toHaveBeenCalledOnce();
        expect(capture.analytics).toHaveBeenCalledOnce();
        expect(result.current).toBe(true);
        unmount();
    });
    it('keeps capture disabled for the rest of the document', () => {
        enterSharePrivacy();
        expect(isSharePrivateSession()).toBe(true);
    });
    it('configures capture on initial viewer routes even when privacy starts enabled', async () => {
        const previous = window.location.href;
        try {
            window.history.replaceState(null, '', '/s/example');
            vi.resetModules();
            vi.clearAllMocks();
            const privacy = await import('./sharePrivacy');
            expect(privacy.isSharePrivateSession()).toBe(true);
            privacy.enterSharePrivacy();
            privacy.enterSharePrivacy();
            expect(capture.disable).toHaveBeenCalledOnce();
            expect(capture.reset).toHaveBeenCalledOnce();
            expect(capture.analytics).toHaveBeenCalledWith({ enabled: false });
            expect(capture.stop).toHaveBeenCalledOnce();
        } finally {
            window.history.replaceState(null, '', previous);
        }
    });
});
