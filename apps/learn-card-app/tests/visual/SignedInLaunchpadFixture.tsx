import React, { Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { AppRoot } from 'learn-card-base/ui/app-shell/AppRoot';
import { BrandingEnum } from 'learn-card-base';
import { AppShellRouter } from 'learn-card-base/ui/app-shell/AppShellRouter';
import { AppSplitPane } from 'learn-card-base/ui/app-shell/AppSplitPane';
import SideMenu from '../../src/components/sidemenu/SideMenu';
import MobileNavBar from '../../src/components/mobile-nav-bar/MobileNavBar';

/** Production navigation and page chrome, with test-only identity/query data. */
export const SignedInLaunchpadFixture: React.FC = () => (
    <Suspense fallback={<p>Loading app...</p>}>
        <MemoryRouter initialEntries={['/launchpad']}>
            <AppShellRouter>
                <AppRoot>
                    <div id="app-router">
                        <AppSplitPane
                            contentId="main"
                            className="side-menu-split-pane-container-visible"
                        >
                            <SideMenu branding={BrandingEnum.learncard} />
                            <main id="main" tabIndex={-1} className="w-full">
                                <MobileNavBar />
                            </main>
                        </AppSplitPane>
                    </div>
                </AppRoot>
            </AppShellRouter>
        </MemoryRouter>
    </Suspense>
);
