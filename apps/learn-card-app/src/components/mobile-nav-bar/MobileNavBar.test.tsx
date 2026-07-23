// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    renderTabBar: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useLocation: () => ({ pathname: '/dashboard' }),
}));

vi.mock('@ionic/react', () => {
    const Container = ({ children }: React.PropsWithChildren) => <div>{children}</div>;

    return {
        IonLabel: Container,
        IonMenuToggle: Container,
        IonRouterOutlet: Container,
        IonTabButton: Container,
        IonTabs: Container,
        IonTabBar: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
            mocks.renderTabBar(props);

            return <nav>{children}</nav>;
        },
    };
});

vi.mock('learn-card-base', () => ({
    getNavBarColor: () => '',
    lazyWithRetry: () => () => null,
    showNavBar: () => true,
    useIsLoggedIn: () => true,
    walletStore: {
        useTracked: {
            syncState: () => ({ status: 'idle' }),
        },
    },
    WalletSyncState: {
        Completed: 'completed',
        Syncing: 'syncing',
    },
}));

vi.mock('../../theme/hooks/useTheme', () => ({
    default: () => ({
        getColorSet: () => ({}),
        getIconSet: () => ({}),
        theme: {
            colors: { defaults: { primaryColor: 'grayscale-900' } },
            navbar: [],
        },
    }),
}));

vi.mock('../../theme/icons', () => ({
    IconSetEnum: { navbar: 'navbar' },
}));

vi.mock('../../theme/colors', () => ({
    ColorSetEnum: { navbar: 'navbar' },
}));

vi.mock('../../paraglide/messages.js', () => ({
    'sidemenu.links.passport': () => 'Passport',
}));

vi.mock('./mobileNavBarI18n', () => ({
    getNavBarLinkLabel: () => '',
}));

vi.mock('../generic/GenericErrorBoundary', () => ({
    default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('../svgs/CustomSpinner', () => ({
    default: () => null,
}));

vi.mock('../../components/svgs/Burger', () => ({
    default: () => null,
}));

import MobileNavBar from './MobileNavBar';

describe('MobileNavBar safe-area layout', () => {
    beforeEach(() => {
        mocks.renderTabBar.mockClear();
    });

    it('combines the design padding with Ionic’s live bottom inset', () => {
        render(<MobileNavBar />);

        expect(mocks.renderTabBar).toHaveBeenCalledOnce();
        expect(mocks.renderTabBar).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'lc-footer-nav',
                style: {
                    paddingBottom: 'calc(15px + var(--ion-safe-area-bottom, 0px))',
                },
            })
        );
    });
});
