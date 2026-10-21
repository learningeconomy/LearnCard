import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { redirectStore, LCN_REDIRECT_TTL_MS } from './redirectStore';

describe('pending claim redirect lifetime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-09-18T12:00:00Z'));
        redirectStore.set.lcnRedirect(null);
    });
    afterEach(() => {
        redirectStore.set.lcnRedirect(null);
        vi.useRealTimers();
    });
    it('preserves a claim during sign-in and expires it before a later sign-in', () => {
        redirectStore.set.lcnRedirect('/request?vc_request_url=claim');
        vi.advanceTimersByTime(LCN_REDIRECT_TTL_MS - 1);
        expect(redirectStore.get.lcnRedirect()).toBe('/request?vc_request_url=claim');
        vi.advanceTimersByTime(1);
        expect(redirectStore.get.lcnRedirect()).toBeNull();
    });
    it('rejects legacy persisted redirects without timestamps', () => {
        redirectStore.set.lcnRedirect('/request?vc_request_url=old');
        redirectStore.set.lcnRedirectCreatedAt(null);
        expect(redirectStore.get.lcnRedirect()).toBeNull();
    });
    it('clears both destination and lifetime when consumed or logged out', () => {
        redirectStore.set.lcnRedirect('/request?vc_request_url=claim');
        redirectStore.set.lcnRedirect(null);
        expect(redirectStore.get.lcnRedirect()).toBeNull();
        expect(redirectStore.get.lcnRedirectCreatedAt()).toBeNull();
    });
    it('gives a new claim its own lifetime without reviving the old claim', () => {
        redirectStore.set.lcnRedirect('/request?vc_request_url=old');
        vi.advanceTimersByTime(LCN_REDIRECT_TTL_MS);
        redirectStore.set.lcnRedirect('/request?vc_request_url=new');
        expect(redirectStore.get.lcnRedirect()).toBe('/request?vc_request_url=new');
    });
});
