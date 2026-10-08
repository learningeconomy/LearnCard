import { describe, expect, it } from 'vitest';

import { findIntegrationForApp, getAppIntegrationRepair } from './appIntegration';

const appUrl = 'http://localhost:4321/';

describe('findIntegrationForApp', () => {
    it('prefers the project that remembers this app address', () => {
        const integrations = [
            { id: 'by-host', name: 'localhost:4321' },
            { id: 'by-url', name: 'Quiz Quest', guideState: { publishedFromAppUrl: appUrl } },
        ];

        expect(findIntegrationForApp(integrations, appUrl)?.id).toBe('by-url');
    });

    it('falls back to projects named after the host', () => {
        expect(findIntegrationForApp([{ id: 'old', name: 'localhost:4321' }], appUrl)?.id).toBe(
            'old'
        );
    });
});

describe('getAppIntegrationRepair', () => {
    it('renames host-named projects and switches them to the app dashboard', () => {
        expect(
            getAppIntegrationRepair(
                { id: '1', name: 'localhost:4321', guideState: { step: 2 } },
                { appUrl, appName: 'Quiz Quest' }
            )
        ).toEqual({
            name: 'Quiz Quest',
            guideType: 'embed-app',
            guideState: { step: 2, publishedFromAppUrl: appUrl },
        });
    });

    it('keeps a name the developer chose', () => {
        expect(
            getAppIntegrationRepair(
                {
                    id: '1',
                    name: 'My Project',
                    guideType: 'embed-app',
                    guideState: { publishedFromAppUrl: appUrl },
                },
                { appUrl, appName: 'Quiz Quest' }
            )
        ).toBeNull();
    });
});
