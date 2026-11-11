import { describe, expect, it } from 'vitest';

import { findIntegrationForApp, getAppIntegrationRepair, getAppMatch } from './appIntegration';

const appUrl = 'http://localhost:4321/';

describe('findIntegrationForApp', () => {
    it('prefers the project that remembers this app address', () => {
        const integrations = [
            { id: 'by-host', name: 'localhost:4321' },
            { id: 'by-url', name: 'Quiz Quest', guideState: { publishedFromAppUrl: appUrl } },
        ];

        expect(findIntegrationForApp(integrations, appUrl)?.id).toBe('by-url');
    });

    it('does not fall back to projects named after the host', () => {
        expect(
            findIntegrationForApp([{ id: 'old', name: 'localhost:4321' }], appUrl)
        ).toBeUndefined();
    });

    it('prefers a stable key even when the address changed', () => {
        const keyed = { id: 'key', name: 'App', guideState: { publishedAppKey: 'a' } };
        expect(
            findIntegrationForApp(
                [{ id: 'legacy', name: 'Old', guideState: { publishedFromAppUrl: appUrl } }, keyed],
                appUrl,
                'a'
            )
        ).toBe(keyed);
        expect(getAppMatch(keyed, 'a')).toBe('reuse');
    });

    it('excludes another app key, including for older captures', () => {
        const keyed = {
            id: 'key',
            name: 'App',
            guideState: { publishedAppKey: 'b', publishedFromAppUrl: appUrl },
        };
        expect(findIntegrationForApp([keyed], appUrl, 'a')).toBeUndefined();
        expect(getAppMatch(keyed, 'a')).toBe('exclude');
        expect(getAppMatch(keyed)).toBe('exclude');
    });

    it('asks about address-only matches except an unkeyed same-name capture', () => {
        const legacy = { id: 'old', name: 'App', guideState: { publishedFromAppUrl: appUrl } };
        expect(getAppMatch(legacy, 'a', 'App', 'App')).toBe('confirm');
        expect(getAppMatch(legacy, undefined, 'Old App', 'New App')).toBe('confirm');
        expect(getAppMatch(legacy, undefined, 'App', 'App')).toBe('reuse');
    });
});

describe('getAppIntegrationRepair', () => {
    it('records the confirmed key without dropping guide state', () => {
        expect(
            getAppIntegrationRepair(
                {
                    id: '1',
                    name: 'App',
                    guideType: 'embed-app',
                    guideState: { step: 2, publishedFromAppUrl: appUrl },
                },
                { appUrl, appName: 'App', appKey: 'a' }
            )
        ).toEqual({ guideState: { step: 2, publishedFromAppUrl: appUrl, publishedAppKey: 'a' } });
    });
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
