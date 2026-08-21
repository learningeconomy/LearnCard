import { afterEach, describe, expect, it } from 'vitest';

import * as Sentry from '@sentry/react';

import { submitSentryFeedback } from './sentryFeedbackTransport';
import type { FeedbackReport } from './types';

type CapturedEnvelope = [Record<string, unknown>, Array<[Record<string, unknown>, unknown]>];

const report: FeedbackReport = {
    kind: 'bug',
    source: 'settings',
    capturedAt: '2026-08-21T12:00:00.000Z',
    message: 'The screen stopped responding',
    context: {
        currentRoute: '/connect/:profileId',
        recentRoutes: ['/wallet', '/connect/:profileId'],
        tenantId: 'learncard',
        app: { platform: 'web', displayVersion: '1.98.3' },
        network: { connected: true, label: 'wifi' },
    },
};

describe('submitSentryFeedback installed SDK boundary', () => {
    afterEach(async () => {
        Sentry.getGlobalScope().clear();
        Sentry.getIsolationScope().clear();
        Sentry.getCurrentScope().clear();
        await Sentry.close(1_000);
    });

    it('delivers one allowlisted feedback envelope without inherited identity or scope data', async () => {
        const envelopes: CapturedEnvelope[] = [];

        Sentry.init({
            dsn: 'https://public@example.com/1',
            defaultIntegrations: false,
            transport: () => ({
                send: async envelope => {
                    envelopes.push(envelope as CapturedEnvelope);
                    return { statusCode: 200, headers: {} };
                },
                flush: async () => true,
            }),
        });

        const globalScope = Sentry.getGlobalScope();
        globalScope.setTag('global-secret', 'must-not-leak');
        globalScope.setExtra('global-extra', 'must-not-leak');
        globalScope.setContext('global-context', { secret: 'must-not-leak' });
        globalScope.addBreadcrumb({ category: 'global', message: 'must-not-leak' });

        const isolationScope = Sentry.getIsolationScope();
        isolationScope.setUser({ id: 'did:key:must-not-leak' });
        isolationScope.setTag('identified-tag', 'must-not-leak');
        isolationScope.setExtra('identified-extra', 'must-not-leak');
        isolationScope.setContext('identified-context', { secret: 'must-not-leak' });
        isolationScope.addBreadcrumb({ category: 'identified', message: 'must-not-leak' });
        isolationScope.setFingerprint(['must-not-leak']);
        isolationScope.setTransactionName('must-not-leak');

        const result = await submitSentryFeedback(report);

        expect(envelopes).toHaveLength(1);
        const feedbackItem = envelopes[0][1].find(([header]) => header.type === 'feedback');
        expect(feedbackItem).toBeDefined();

        const event = feedbackItem?.[1] as Record<string, unknown>;
        expect(result.id).toBe(event.event_id);
        expect(event.tags).toEqual({
            feedbackType: 'bug',
            feedbackSource: 'settings',
            route: '/connect/:profileId',
            tenant: 'learncard',
            platform: 'web',
            appVersion: '1.98.3',
        });
        expect(event.extra).toEqual({
            app: { platform: 'web', displayVersion: '1.98.3' },
            network: { connected: true, label: 'wifi' },
            recentRoutes: ['/wallet', '/connect/:profileId'],
        });
        expect(event.contexts).toEqual({
            feedback: { message: 'The screen stopped responding' },
        });
        expect(event.user).toBeUndefined();
        expect(event.breadcrumbs).toBeUndefined();
        expect(event.fingerprint).toBeUndefined();
        expect(event.transaction).toBeUndefined();
        expect(JSON.stringify(event)).not.toContain('must-not-leak');
        expect(JSON.stringify(event)).not.toContain('did:key');
    });
});
