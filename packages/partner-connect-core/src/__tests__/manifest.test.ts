import {
    encodeManifestForUrl,
    decodeManifestFromUrl,
    createEmptyCapturedManifest,
    applyCapturedAction,
} from '../manifest';
import type { CapturedAppManifest } from '../types';

describe('manifest', () => {
    const mockManifest: CapturedAppManifest = {
        manifestVersion: 1,
        appUrl: 'https://example.com',
        permissions: ['request_identity'],
        templates: [],
        consentRequests: [],
        featuresLaunched: [],
        counterKeys: [],
        usedLearnerContext: false,
        usedNotifications: false,
        firstCapturedAt: '2023-01-01T00:00:00.000Z',
        lastUpdatedAt: '2023-01-01T00:00:00.000Z',
    };

    it('encodes and decodes manifest', () => {
        const encoded = encodeManifestForUrl(mockManifest);
        const decoded = decodeManifestFromUrl(encoded);
        expect(decoded).toEqual(mockManifest);
    });

    it('creates empty manifest', () => {
        const empty = createEmptyCapturedManifest('https://test.com');
        expect(empty.appUrl).toBe('https://test.com');
        expect(empty.permissions).toEqual([]);
    });

    it('applies REQUEST_IDENTITY', () => {
        const empty = createEmptyCapturedManifest('https://test.com');
        const next = applyCapturedAction(empty, { action: 'REQUEST_IDENTITY' });
        expect(next.permissions).toContain('request_identity');
        expect(next).not.toBe(empty); // immutability
    });

    it('applies SEND_CREDENTIAL', () => {
        const empty = createEmptyCapturedManifest('https://test.com');
        const next = applyCapturedAction(empty, { action: 'SEND_CREDENTIAL' });
        expect(next.permissions).toContain('send_credential');
    });

    it('applies APP_EVENT send-credential with template', () => {
        const empty = createEmptyCapturedManifest('https://test.com');
        const next = applyCapturedAction(empty, {
            action: 'APP_EVENT',
            payload: {
                type: 'send-credential',
                alias: 'test-alias',
                template: { name: 'Test' },
            },
        });
        expect(next.permissions).toContain('send_credential');
        expect(next.templates).toHaveLength(1);
        expect(next.templates[0].alias).toBe('test-alias');
        expect(next.templates[0].version).toBe(1);

        // Same template canonical JSON -> version stays 1
        const next2 = applyCapturedAction(next, {
            action: 'APP_EVENT',
            payload: {
                type: 'send-credential',
                alias: 'test-alias',
                template: { name: 'Test' },
            },
        });
        expect(next2.templates[0].version).toBe(1);

        // Different template canonical JSON -> version bumps to 2
        const next3 = applyCapturedAction(next2, {
            action: 'APP_EVENT',
            payload: {
                type: 'send-credential',
                alias: 'test-alias',
                template: { name: 'Test 2' },
            },
        });
        expect(next3.templates[0].version).toBe(2);
    });

    it('applies REQUEST_CONSENT', () => {
        const empty = createEmptyCapturedManifest('https://test.com');
        const next = applyCapturedAction(empty, {
            action: 'REQUEST_CONSENT',
            payload: {
                scopes: {
                    read: { personalFields: ['name'] },
                    reason: 'Test reason',
                },
            },
        });
        expect(next.permissions).toContain('request_consent');
        expect(next.consentRequests).toHaveLength(1);
        expect(next.consentRequests[0].scopes.read.personalFields).toContain('name');
        expect(next.consentRequests[0].reason).toBe('Test reason');
    });
});
