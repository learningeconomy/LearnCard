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
        for (let index = 0; index < 11; index += 1) recordFeedbackRoute(`/route-${index}`);
        expect(getRecentFeedbackRoutes()).toHaveLength(10);
        expect(getRecentFeedbackRoutes()[0]).toBe('/route-1');
        expect(getRecentFeedbackRoutes()[9]).toBe('/route-10');
    });

    it('returns a defensive copy', () => {
        recordFeedbackRoute('/wallet');
        const first = getRecentFeedbackRoutes();
        first.push('/mutated');
        expect(getRecentFeedbackRoutes()).toEqual(['/wallet']);
    });
});
