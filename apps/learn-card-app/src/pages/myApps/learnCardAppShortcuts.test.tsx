import { LEARNCARD_APP_SHORTCUTS } from './learnCardAppShortcuts';

describe('LEARNCARD_APP_SHORTCUTS', () => {
    it('defines the 8 shortcuts in the ticket order', () => {
        expect(LEARNCARD_APP_SHORTCUTS.map(s => s.title)).toEqual([
            'Skill Insights',
            'Pathways',
            'AI Sessions',
            'Resume Builder',
            'Skills Hub',
            'Data Sharing',
            'Families',
            'Boost a Friend',
        ]);
    });

    it('routes the 7 navigation shortcuts to the expected paths', () => {
        const push = vi.fn();
        const openBoost = vi.fn();
        const helpers = { push, openBoost };
        const byTitle = Object.fromEntries(LEARNCARD_APP_SHORTCUTS.map(s => [s.title, s]));

        byTitle['Skill Insights'].getAction(helpers)();
        byTitle.Pathways.getAction(helpers)();
        byTitle['AI Sessions'].getAction(helpers)();
        byTitle['Resume Builder'].getAction(helpers)();
        byTitle['Skills Hub'].getAction(helpers)();
        byTitle['Data Sharing'].getAction(helpers)();
        byTitle.Families.getAction(helpers)();

        expect(push.mock.calls.map(c => c[0])).toEqual([
            '/ai/insights',
            '/pathways',
            '/ai/topics',
            '/resume-builder',
            '/skills',
            '/privacy-and-data',
            '/families',
        ]);
        expect(openBoost).not.toHaveBeenCalled();
    });

    it('wires Boost a Friend to the boost-template opener, not a route', () => {
        const push = vi.fn();
        const openBoost = vi.fn();
        const boost = LEARNCARD_APP_SHORTCUTS.find(s => s.title === 'Boost a Friend')!;
        boost.getAction({ push, openBoost })();
        expect(openBoost).toHaveBeenCalledTimes(1);
        expect(push).not.toHaveBeenCalled();
    });

    it('gives every shortcut an icon and gradient stops', () => {
        for (const s of LEARNCARD_APP_SHORTCUTS) {
            expect(s.Icon).toBeTruthy();
            expect(s.gradientFrom).toMatch(/^#/);
            expect(s.gradientTo).toMatch(/^#/);
        }
    });
});
