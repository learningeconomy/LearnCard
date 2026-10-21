import React from 'react';
import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

vi.mock('learn-card-base', () => ({ CredentialCategoryEnum: {} }));
vi.mock('launchdarkly-react-client-sdk', () => ({ useFlags: () => ({}) }));
vi.mock('../../../theme/hooks/useTheme', () => ({
    useTheme: () => ({
        getColorSet: () => ({ primaryColor: 'emerald-700', primaryColorShade: 'emerald-500' }),
        getStyleSet: () => ({ tabs: { borderRadius: 'rounded-full' } }),
    }),
}));
vi.mock('../../../paraglide/messages.js', () =>
    Object.fromEntries(
        [
            'myApps',
            'ai',
            'learning',
            'games',
            'tools',
            'employment',
            'credentials',
            'other',
            'plugins',
            'all',
        ].map(name => [`launchpad.tabs.${name}`, () => name])
    )
);

import LaunchPadAppTabs, { LaunchPadTabEnum } from './LaunchPadAppTabs';

it('removes each global drag reset listener with the same event and callback on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    try {
        const { unmount } = render(
            <LaunchPadAppTabs tab={LaunchPadTabEnum.myApps} setTab={() => undefined} />
        );
        const subscriptions = add.mock.calls.filter(([name]) =>
            ['mouseup', 'pointerup', 'pointercancel', 'blur'].includes(name)
        );
        expect(subscriptions).toHaveLength(4);
        unmount();
        for (const [event, callback] of subscriptions) {
            expect(remove).toHaveBeenCalledWith(event, callback);
        }
    } finally {
        add.mockRestore();
        remove.mockRestore();
    }
});
