import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestHistory, TestRouter } from 'learn-card-base/test-utils/testRouter';

const mocks = vi.hoisted(() => ({
    gate: vi.fn(async () => ({ prompted: false })),
}));

vi.mock('@sentry/browser', () => ({ setTag: vi.fn() }));
vi.mock('@capgo/capacitor-updater', () => ({ CapacitorUpdater: { current: vi.fn() } }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@ionic/react', () => ({
    IonMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonMenuToggle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({ useIsLoggedIn: () => true }));
vi.mock('learn-card-base/hooks/useDeviceTypeByWidth', () => ({
    useDeviceTypeByWidth: () => ({ isMobile: false }),
}));
vi.mock('learn-card-base/stores/firstStartupStore', () => ({
    default: { useTracked: { version: () => '1.0.0' }, set: { version: vi.fn() } },
}));
vi.mock('learn-card-base/stores/sideMenuStore', () => ({
    default: { set: { isCollapsed: vi.fn() } },
}));
vi.mock('learn-card-base/components/headerBranding/headerBrandingHelpers', () => ({
    BrandingEnum: { learncard: 'learncard' },
}));
vi.mock('learn-card-base/svgs/LeftArrow', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/GearPlusIcon', () => ({ default: () => null }));
vi.mock('@analytics', () => ({ useAnalytics: () => ({ page: vi.fn() }) }));
vi.mock('../../hooks/useAiSession', () => ({
    default: () => ({ openNewAiSessionModal: vi.fn() }),
}));
vi.mock('../../hooks/useBoostRecoveryCheck', () => ({
    default: () => ({ checkAndPromptRecovery: (proceed: () => void) => proceed() }),
}));
vi.mock('../network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: mocks.gate }),
}));
vi.mock('../../config/brandingAssets', () => ({ useTenantBrandingAssets: () => ({}) }));
vi.mock('../../constants/aiRoutes', () => ({ AI_ROUTES: [] }));
vi.mock('../../theme/hooks/useTheme', () => ({
    default: () => ({ getColorSet: () => ({}) }),
}));
vi.mock('../../theme/colors', () => ({ ColorSetEnum: { sideMenu: 'sideMenu' } }));
vi.mock('../../theme/components/ThemeSelector', () => ({
    default: () => null,
    themeSelectorViewMode: { Compact: 'compact' },
}));
vi.mock('./SideMenuFooter', () => ({ default: () => null }));
vi.mock('./SideMenuRootLinks', () => ({ default: () => null }));
vi.mock('./SideMenuSecondaryLinks', () => ({ default: () => null }));
vi.mock('./LanguagePicker', () => ({ default: () => null }));
vi.mock('../svgs/LearnCardTextLogo', () => ({ default: () => null }));
vi.mock('../svgs/Settings', () => ({ default: () => null }));
vi.mock('../learncard/checklist/CheckListButton', () => ({ default: () => null }));
vi.mock('../learncard/useOpenMyLearnCard', () => ({ default: () => vi.fn() }));
vi.mock('../learncard/MyLearnCardModal', () => ({ myLearnCardIntentHandlers: {} }));
vi.mock('../generic/GenericErrorBoundary', () => ({
    default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('../../paraglide/messages.js', () => ({
    'issue.title': () => 'Issue Credentials',
    'sidemenu.closeMenu': () => 'Close menu',
    'sidemenu.settings': () => 'Settings',
}));

import SideMenu from './SideMenu';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

const clickIssueCredentials = (pathname: string) => {
    const history = createTestHistory({ initialEntries: [pathname] });
    render(
        <TestRouter history={history}>
            <SideMenu branding={BrandingEnum.learncard} />
        </TestRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Issue Credentials' }));
    return history;
};

describe('SideMenu Issue Credentials button', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it.each(['/boost-a-friend', '/wallet'])('opens /issue from %s', async pathname => {
        const history = clickIssueCredentials(pathname);

        await waitFor(() => expect(history.location.pathname).toBe('/issue'));
    });

    it.each(['/boost', '/boost/update'])('stays put on the Boost CMS route %s', async pathname => {
        const history = clickIssueCredentials(pathname);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mocks.gate).not.toHaveBeenCalled();
        expect(history.location.pathname).toBe(pathname);
        expect(history.entries).toEqual([]);
    });
});
