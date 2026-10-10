import { createEmptyCapturedManifest, mergeCapturedManifests } from '../manifest';
import type { CapturedAppManifest, CapturedConsentRecord, WalletCategory } from '../types';

const capture = (overrides: Partial<CapturedAppManifest>): CapturedAppManifest => ({
    ...createEmptyCapturedManifest('https://quiz.example.com/'),
    firstCapturedAt: '2026-01-01T00:00:00.000Z',
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
});

const consent = (
    category: WalletCategory,
    lastUsedAt: string,
    reason?: string
): CapturedConsentRecord => ({
    scopes: {
        read: { credentialCategories: [category], personalFields: [] },
        write: { credentialCategories: [] },
    },
    reason,
    lastUsedAt,
});

describe('mergeCapturedManifests', () => {
    it('keeps everything an earlier run saw that this run did not exercise', () => {
        const earlier = capture({
            permissions: ['request_identity', 'launch_feature', 'request_consent'],
            featuresLaunched: ['/ai/topics'],
            counterKeys: ['coins'],
            consentRequests: [consent('Achievement', '2026-01-01T00:00:00.000Z')],
            usedNotifications: true,
        });
        const latest = capture({ permissions: ['request_identity', 'send_credential'] });

        const merged = mergeCapturedManifests(earlier, latest);

        expect(merged.permissions).toEqual([
            'request_identity',
            'launch_feature',
            'request_consent',
            'send_credential',
        ]);
        expect(merged.featuresLaunched).toEqual(['/ai/topics']);
        expect(merged.counterKeys).toEqual(['coins']);
        expect(merged.consentRequests).toHaveLength(1);
        expect(merged.usedNotifications).toBe(true);
    });

    it('is a no-op when the latest run saw nothing new', () => {
        const earlier = capture({ permissions: ['request_identity'], counterKeys: ['coins'] });

        expect(mergeCapturedManifests(earlier, capture({}))).toMatchObject({
            permissions: ['request_identity'],
            counterKeys: ['coins'],
        });
    });

    it('uses the most recently used version of a changed template', () => {
        const earlier = capture({
            templates: [
                {
                    alias: 'badge',
                    template: { name: 'Old name' },
                    version: 1,
                    lastUsedAt: '2026-01-01T00:00:00.000Z',
                },
            ],
        });
        const latest = capture({
            templates: [
                {
                    alias: 'badge',
                    template: { name: 'New name' },
                    version: 2,
                    lastUsedAt: '2026-02-01T00:00:00.000Z',
                },
            ],
        });

        expect(mergeCapturedManifests(earlier, latest).templates).toEqual(latest.templates);
        expect(mergeCapturedManifests(latest, earlier).templates).toEqual(latest.templates);
    });

    it('takes the app name and address from the latest capture', () => {
        const merged = mergeCapturedManifests(
            capture({ suggestedName: 'Old', appUrl: 'https://old.example.com/' }),
            capture({ suggestedName: 'New', appUrl: 'https://quiz.example.com/' })
        );

        expect(merged.suggestedName).toBe('New');
        expect(merged.appUrl).toBe('https://quiz.example.com/');
    });

    it('keeps the newest reason for the same consent scopes', () => {
        const merged = mergeCapturedManifests(
            capture({
                consentRequests: [consent('Achievement', '2026-01-01T00:00:00.000Z', 'Old')],
            }),
            capture({
                consentRequests: [consent('Achievement', '2026-03-01T00:00:00.000Z', 'New')],
            })
        );

        expect(merged.consentRequests).toHaveLength(1);
        expect(merged.consentRequests[0]?.reason).toBe('New');
    });
});
