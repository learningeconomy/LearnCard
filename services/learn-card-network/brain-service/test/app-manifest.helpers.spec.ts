import { describe, expect, it } from 'vitest';

import type { AppManifest } from '@learncard/types';

import {
    canonicalizeManifest,
    diffManifests,
    hashManifest,
} from '../src/helpers/app-manifest.helpers';

const makeManifest = (overrides: Partial<AppManifest> = {}): AppManifest => ({
    manifestVersion: 1,
    appUrl: 'https://example.com',
    suggestedName: 'Example App',
    suggestedIconUrl: 'https://example.com/icon.png',
    permissions: ['send_credential'],
    templates: [
        {
            alias: 'completion',
            version: 1,
            lastUsedAt: '2026-01-01T00:00:00.000Z',
            template: {
                name: 'Course Completion: {{courseName}}',
                description: 'Awarded to {{learnerName}}',
                category: 'Achievement',
            },
        },
    ],
    consentRequests: [
        {
            scopes: {
                read: {
                    credentialCategories: ['Achievement'],
                    personalFields: ['email'],
                },
                write: {
                    credentialCategories: ['Achievement'],
                },
            },
            reason: 'Show progress',
            lastUsedAt: '2026-01-01T00:00:00.000Z',
        },
    ],
    featuresLaunched: ['/wallet'],
    counterKeys: ['coins'],
    usedLearnerContext: false,
    usedNotifications: false,
    firstCapturedAt: '2026-01-01T00:00:00.000Z',
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
});

describe('app-manifest.helpers', () => {
    it('canonicalizes and hashes manifests deterministically while ignoring volatile timestamps', () => {
        const first = makeManifest();
        const second = makeManifest({
            permissions: ['send_credential'],
            templates: [
                {
                    alias: 'completion',
                    version: 1,
                    lastUsedAt: '2026-02-01T00:00:00.000Z',
                    template: {
                        description: 'Awarded to {{learnerName}}',
                        category: 'Achievement',
                        name: 'Course Completion: {{courseName}}',
                    },
                },
            ],
            consentRequests: [
                {
                    scopes: {
                        read: {
                            credentialCategories: ['Achievement'],
                            personalFields: ['email'],
                        },
                        write: {
                            credentialCategories: ['Achievement'],
                        },
                    },
                    reason: 'Show progress',
                    lastUsedAt: '2026-02-01T00:00:00.000Z',
                },
            ],
            firstCapturedAt: '2026-03-01T00:00:00.000Z',
            lastUpdatedAt: '2026-03-01T00:00:00.000Z',
        });

        expect(canonicalizeManifest(first)).toBe(canonicalizeManifest(second));
        expect(hashManifest(first)).toBe(hashManifest(second));
    });

    it('computes diffs and flags review when permissions or consent scopes expand', () => {
        const current = makeManifest();
        const next = makeManifest({
            permissions: ['send_credential', 'request_consent'],
            templates: [
                {
                    alias: 'completion',
                    version: 2,
                    lastUsedAt: '2026-01-02T00:00:00.000Z',
                    template: {
                        name: 'Course Completion: {{courseName}}',
                        description: 'Awarded to {{learnerName}}',
                        category: 'Achievement',
                        issuerName: 'Example University',
                    },
                },
                {
                    alias: 'badge',
                    version: 1,
                    lastUsedAt: '2026-01-02T00:00:00.000Z',
                    template: {
                        name: 'Skill Badge: {{skillName}}',
                        category: 'Skill',
                    },
                },
            ],
            consentRequests: [
                ...current.consentRequests,
                {
                    scopes: {
                        read: {
                            credentialCategories: ['Achievement', 'Skill'],
                            personalFields: ['email', 'name'],
                        },
                        write: {
                            credentialCategories: ['Achievement'],
                        },
                    },
                    reason: 'Expanded access',
                    lastUsedAt: '2026-01-02T00:00:00.000Z',
                },
            ],
            featuresLaunched: ['/wallet', '/pathways'],
            counterKeys: ['coins', 'streak'],
        });

        expect(diffManifests(current, next)).toEqual({
            permissions: {
                added: ['request_consent'],
                removed: [],
                changed: [],
            },
            templates: {
                added: [{ alias: 'badge', version: 1 }],
                removed: [],
                changed: [{ alias: 'completion', fromVersion: 1, toVersion: 2 }],
            },
            consentScopes: {
                added: [
                    '{"read":{"credentialCategories":["Achievement","Skill"],"personalFields":["email","name"]},"write":{"credentialCategories":["Achievement"]}}',
                ],
                removed: [],
                changed: [],
            },
            featurePaths: {
                added: ['/pathways'],
                removed: [],
                changed: [],
            },
            counterKeys: {
                added: ['streak'],
                removed: [],
                changed: [],
            },
            requiresReview: true,
        });
    });
});
