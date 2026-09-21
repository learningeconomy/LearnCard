import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('@sentry/react', () => ({ getReplay: () => ({ stop: vi.fn() }) }));
vi.mock('userflow.js', () => ({ default: { setPageTrackingDisabled: vi.fn(), reset: vi.fn() } }));
import {
    scrubShareTelemetry,
    enterSharePrivacy,
    isSharePrivateSession,
    useSharePrivateSession,
} from './sharePrivacy';
describe('share privacy', () => {
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
    it('updates mounted privacy consumers immediately', () => {
        const { result, unmount } = renderHook(() => useSharePrivateSession());
        expect(result.current).toBe(false);
        act(() => enterSharePrivacy());
        expect(result.current).toBe(true);
        unmount();
    });
    it('keeps capture disabled for the rest of the document', () => {
        enterSharePrivacy();
        expect(isSharePrivateSession()).toBe(true);
    });
});
