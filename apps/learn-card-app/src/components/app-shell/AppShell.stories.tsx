import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IonLabel } from '@ionic/react';

import { AppSplitPane } from './AppSplitPane';
import { AppMenu } from './AppMenu';
import { AppMenuToggle } from './AppMenuToggle';
import { AppTabs, AppTabBar, AppTabButton } from './AppTabs';
import { AppOutlet } from './AppOutlet';

const LINKS = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard' },
    { id: 'wallet', path: '/passport', label: 'Passport' },
    { id: 'launchpad', path: '/launchpad', label: 'Apps' },
];

/**
 * Synthetic app shell: the side menu (docked from 992px, a drawer below) and the bottom tab
 * bar, with placeholder content instead of the real SideMenu / routes. Resize the viewport to
 * switch between the docked pane and the drawer.
 */
const AppShellPreview: React.FC = () => (
    <div id="app-router" className="relative h-screen w-full">
        <AppSplitPane contentId="main" className="side-menu-split-pane-container-visible">
            <AppMenu contentId="main" swipeGesture menuId="appSideMenu">
                <div className="flex h-full flex-col gap-3 bg-white p-6 font-poppins">
                    <p className="text-[17px] font-semibold text-grayscale-900">Side menu</p>
                    {LINKS.map(link => (
                        <AppMenuToggle key={link.id} autoHide={false} className="w-full">
                            <button
                                type="button"
                                className="w-full rounded-[10px] px-[10px] py-[5px] text-left text-grayscale-900"
                            >
                                {link.label}
                            </button>
                        </AppMenuToggle>
                    ))}
                </div>
            </AppMenu>
            <div id="main" tabIndex={-1} className="w-full">
                <AppTabs>
                    <AppOutlet>
                        <div className="ion-page bg-grayscale-100 p-6 font-poppins">
                            <AppMenuToggle menu="appSideMenu">
                                <button
                                    type="button"
                                    className="rounded-full bg-white px-4 py-2 text-grayscale-900 shadow-soft-bottom"
                                >
                                    Open menu
                                </button>
                            </AppMenuToggle>
                            <p className="mt-4 text-grayscale-700">Page content</p>
                        </div>
                    </AppOutlet>
                    <AppTabBar
                        className="lc-footer-nav"
                        style={{ paddingBottom: 'calc(15px + var(--ion-safe-area-bottom, 0px))' }}
                    >
                        <AppTabButton
                            tab="/"
                            href="#"
                            className="mobile-nav-hamburger-button"
                            aria-label="Open menu"
                        >
                            <AppMenuToggle menu="appSideMenu">
                                <span className="m-[10px] block text-[28px] text-grayscale-900">
                                    ≡
                                </span>
                            </AppMenuToggle>
                        </AppTabButton>
                        {LINKS.map(link => (
                            <AppTabButton key={link.id} tab={link.id} href={link.path}>
                                <IonLabel className="font-poppins font-semibold text-[11px] mt-[3px] text-grayscale-900">
                                    {link.label}
                                </IonLabel>
                            </AppTabButton>
                        ))}
                    </AppTabBar>
                </AppTabs>
            </div>
        </AppSplitPane>
    </div>
);

const meta: Meta<typeof AppShellPreview> = {
    title: 'App Shell/Side menu and tab bar',
    component: AppShellPreview,
    parameters: { layout: 'fullscreen', chromatic: { viewports: [390, 1280] } },
};

export default meta;

type Story = StoryObj<typeof AppShellPreview>;

export const Default: Story = {};
