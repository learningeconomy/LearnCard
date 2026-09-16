import { beforeEach, describe, expect, it } from 'vitest';

import {
    clearFeedbackRouteHistory,
    getRecentFeedbackRoutes,
    recordFeedbackRoute,
} from './routeHistory';

describe('routeHistory', () => {
    beforeEach(clearFeedbackRouteHistory);

    it('keeps the newest ten routes and collapses consecutive duplicates', () => {
        recordFeedbackRoute('/wallet');
        recordFeedbackRoute('/wallet');
        const routes = [
            '/route-a',
            '/route-b',
            '/route-c',
            '/route-d',
            '/route-e',
            '/route-f',
            '/route-g',
            '/route-h',
            '/route-i',
            '/route-j',
            '/route-k',
        ];
        routes.forEach(recordFeedbackRoute);
        expect(getRecentFeedbackRoutes()).toHaveLength(10);
        expect(getRecentFeedbackRoutes()[0]).toBe('/route-b');
        expect(getRecentFeedbackRoutes()[9]).toBe('/route-k');
    });

    it('returns a defensive copy', () => {
        recordFeedbackRoute('/wallet');
        const first = getRecentFeedbackRoutes();
        first.push('/mutated');
        expect(getRecentFeedbackRoutes()).toEqual(['/wallet']);
    });

    it.each(['/connect/alice', '/connect/alice-smith'])(
        'normalizes alphabetic profile ids before recording %s',
        route => {
            recordFeedbackRoute(route);
            expect(getRecentFeedbackRoutes()).toEqual(['/connect/:profileId']);
        }
    );
});
