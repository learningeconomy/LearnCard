// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'lc:consent-flow-sync:unaccepted-records';

// Each test gets a fresh module, the same way an app launch does.
const loadMarkers = async () => {
    vi.resetModules();
    return import('./consentFlowRecordMarkers');
};

describe('consentFlowRecordMarkers', () => {
    beforeEach(() => window.localStorage.clear());
    afterEach(() => vi.restoreAllMocks());

    it('persists markers per profile and credential', async () => {
        const markers = await loadMarkers();
        markers.setConsentFlowRecordMarker('did:a', 'urn:cred:1', 'record-a');
        markers.setConsentFlowRecordMarker('did:b', 'urn:cred:1', 'record-b');

        expect(markers.getConsentFlowRecordMarker('did:a', 'urn:cred:1')).toBe('record-a');
        expect(markers.getConsentFlowRecordMarker('did:b', 'urn:cred:1')).toBe('record-b');
        expect(window.localStorage.getItem(STORAGE_KEY)).toContain('record-a');

        // After a reload, the markers come back from storage.
        const reloaded = await loadMarkers();
        expect(reloaded.getConsentFlowRecordMarker('did:a', 'urn:cred:1')).toBe('record-a');
    });

    it('clears one marker idempotently and drops the key when empty', async () => {
        const markers = await loadMarkers();
        markers.setConsentFlowRecordMarker('did:a', 'urn:cred:1', 'record-a');
        markers.clearConsentFlowRecordMarker('did:a', 'urn:cred:1');
        markers.clearConsentFlowRecordMarker('did:a', 'urn:cred:1');

        expect(markers.getConsentFlowRecordMarker('did:a', 'urn:cred:1')).toBeUndefined();
        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('ignores corrupt storage', async () => {
        window.localStorage.setItem(STORAGE_KEY, '{not json');
        const markers = await loadMarkers();
        expect(markers.getConsentFlowRecordMarker('did:a', 'urn:cred:1')).toBeUndefined();
    });

    it('still finds a marker when storage is readable but rejects writes', async () => {
        // From goblincore's review on #1737.
        const markers = await loadMarkers();
        vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
            throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
        });

        markers.setConsentFlowRecordMarker('did:quota', 'urn:quota', 'record-quota');
        expect(markers.getConsentFlowRecordMarker('did:quota', 'urn:quota')).toBe('record-quota');
    });

    it('does not resurrect a persisted marker after a clear that fails to persist', async () => {
        const markers = await loadMarkers();
        markers.setConsentFlowRecordMarker('did:a', 'urn:cred:1', 'record-a');
        vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
            throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
        });
        vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
            throw new DOMException('Storage unavailable', 'SecurityError');
        });

        markers.clearConsentFlowRecordMarker('did:a', 'urn:cred:1');
        expect(markers.getConsentFlowRecordMarker('did:a', 'urn:cred:1')).toBeUndefined();
    });

    it('keeps markers when storage stops being readable mid-session', async () => {
        const markers = await loadMarkers();
        markers.setConsentFlowRecordMarker('did:a', 'urn:cred:1', 'record-a');
        vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
            throw new DOMException('Storage unavailable', 'SecurityError');
        });

        expect(markers.getConsentFlowRecordMarker('did:a', 'urn:cred:1')).toBe('record-a');
    });
});
