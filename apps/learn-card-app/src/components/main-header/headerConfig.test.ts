import { isTopLevelRoute, resolveShowBackButton } from './headerConfig';

describe('headerConfig', () => {
    describe('isTopLevelRoute', () => {
        it('treats the tab/root routes as top-level', () => {
            for (const r of [
                '/dashboard',
                '/passport',
                '/wallet',
                '/home',
                '/launchpad',
                '/contacts',
            ]) {
                expect(isTopLevelRoute(r)).toBe(true);
            }
        });

        it('treats child/drill-in routes as NOT top-level', () => {
            expect(isTopLevelRoute('/launchpad/browse')).toBe(false);
            expect(isTopLevelRoute('/passport/abc123')).toBe(false);
            expect(isTopLevelRoute('/ai/topics')).toBe(false);
        });
    });

    describe('resolveShowBackButton', () => {
        it('defaults the back button OFF on top-level routes', () => {
            expect(resolveShowBackButton('/launchpad')).toBe(false);
            expect(resolveShowBackButton('/dashboard')).toBe(false);
        });

        it('defaults the back button ON for deep pages reached from the launchpad', () => {
            for (const r of [
                '/ai/insights',
                '/pathways',
                '/ai/topics',
                '/resume-builder',
                '/skills',
                '/privacy-and-data',
                '/families',
                '/launchpad/browse',
            ]) {
                expect(resolveShowBackButton(r)).toBe(true);
            }
        });

        it('lets an explicit prop override the route default', () => {
            expect(resolveShowBackButton('/ai/topics', false)).toBe(false);
            expect(resolveShowBackButton('/launchpad', true)).toBe(true);
        });
    });
});
