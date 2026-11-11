import React, { Suspense } from 'react';
import { createMemoryHistory } from 'history';
import { IonReactRouter } from '@ionic/react-router';
import { IonApp, IonSplitPane } from '@ionic/react';
import { BrandingEnum } from 'learn-card-base';
import SideMenu from '../../src/components/sidemenu/SideMenu';
import MobileNavBar from '../../src/components/mobile-nav-bar/MobileNavBar';

const history = createMemoryHistory({ initialEntries: ['/launchpad'] });

/** Production navigation and page chrome, with test-only identity/query data. */
export const SignedInLaunchpadFixture: React.FC = () => (
    <Suspense fallback={<p>Loading app...</p>}>
        <IonReactRouter history={history}>
            <IonApp>
                <div id="app-router">
                    <IonSplitPane
                        contentId="main"
                        className="side-menu-split-pane-container-visible"
                    >
                        <SideMenu branding={BrandingEnum.learncard} />
                        <main id="main" tabIndex={-1} className="w-full">
                            <MobileNavBar />
                        </main>
                    </IonSplitPane>
                </div>
            </IonApp>
        </IonReactRouter>
    </Suspense>
);
