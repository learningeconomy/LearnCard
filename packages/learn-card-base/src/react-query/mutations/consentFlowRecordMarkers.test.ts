// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';

import {
    clearConsentFlowRecordMarker,
    getConsentFlowRecordMarker,
    setConsentFlowRecordMarker,
} from './consentFlowRecordMarkers';

describe('consentFlowRecordMarkers', () => {
    beforeEach(() => window.localStorage.clear());

    it('persists markers per profile and credential', () => {
        setConsentFlowRecordMarker('did:a', 'urn:cred:1', 'record-a');
        setConsentFlowRecordMarker('did:b', 'urn:cred:1', 'record-b');

        expect(getConsentFlowRecordMarker('did:a', 'urn:cred:1')).toBe('record-a');
        expect(getConsentFlowRecordMarker('did:b', 'urn:cred:1')).toBe('record-b');
        expect(window.localStorage.getItem('lc:consent-flow-sync:unaccepted-records')).toContain(
            'record-a'
        );
    });

    it('clears one marker idempotently and drops the key when empty', () => {
        setConsentFlowRecordMarker('did:a', 'urn:cred:1', 'record-a');
        clearConsentFlowRecordMarker('did:a', 'urn:cred:1');
        clearConsentFlowRecordMarker('did:a', 'urn:cred:1');

        expect(getConsentFlowRecordMarker('did:a', 'urn:cred:1')).toBeUndefined();
        expect(window.localStorage.getItem('lc:consent-flow-sync:unaccepted-records')).toBeNull();
    });

    it('ignores corrupt storage', () => {
        window.localStorage.setItem('lc:consent-flow-sync:unaccepted-records', '{not json');
        expect(getConsentFlowRecordMarker('did:a', 'urn:cred:1')).toBeUndefined();
    });
});
