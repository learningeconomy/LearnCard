import { describe, expect, it } from 'vitest';
import type { CapturedAppManifest } from '@learncard/partner-connect-core';

import { describeManifest, getPermissionLabel } from './appCapabilities';

describe('getPermissionLabel', () => {
    it('uses plain language for known permissions', () => {
        expect(getPermissionLabel('request_identity')).toBe('Sign people in');
        expect(getPermissionLabel('template_issuance')).toBe('Check who received a credential');
    });

    it('humanizes anything unknown', () => {
        expect(getPermissionLabel('read_learner_goals')).toBe('Read learner goals');
    });
});

describe('describeManifest', () => {
    it('summarizes what the app does', () => {
        const manifest: CapturedAppManifest = {
            manifestVersion: 1,
            appUrl: 'https://quizquest.app/',
            permissions: ['request_identity', 'request_consent'],
            templates: [],
            consentRequests: [],
            featuresLaunched: [],
            counterKeys: ['coins'],
            usedLearnerContext: false,
            usedNotifications: false,
            firstCapturedAt: '2026-01-01T00:00:00.000Z',
            lastUpdatedAt: '2026-01-01T00:00:00.000Z',
        };

        expect(describeManifest(manifest)).toEqual([
            'Signs people in with their account',
            'Asks permission before using learner info',
            'Tracks progress',
        ]);
    });
});
