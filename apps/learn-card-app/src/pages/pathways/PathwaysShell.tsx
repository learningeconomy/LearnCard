/**
 * PathwaysShell — the one shell that hosts the four modes, onboard, and
 * proposals. Switching modes is a viewport change, never a data fetch
 * (docs § 4, § 10).
 *
 * Mounted at `/pathways` from Routes.tsx behind a tenant feature flag.
 */

import React, { Suspense } from 'react';

import { IonContent, IonPage } from '@ionic/react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { lazyWithRetry } from 'learn-card-base';

import { MainHeader } from '../../components/main-header/MainHeader';

import CompletionRoot from './completion/CompletionRoot';
import JourneysSubHeader from './onboard/JourneysSubHeader';
import PathwaysHeader from './PathwaysHeader';
import { pathwayStore } from '../../stores/pathways';
import { useCostSnapshot } from './hooks/useCostSnapshot';
import { installPathwaysDevGlobals } from './dev/pathwaysDevGlobals';

// Attach `window.__pathwaysDev` once on first import. No-op in production
// builds (guarded by `import.meta.env.DEV` inside the installer), idempotent
// across hot-reloads. See the module doc for the demo flow.
installPathwaysDevGlobals();

const PathwaysErrorFallback: React.FC = () => (
    <div className="max-w-md mx-auto px-4 py-12 font-poppins text-center">
        <h2 className="text-lg font-semibold text-grayscale-900 mb-2">
            Something went wrong
        </h2>
        <p className="text-sm text-grayscale-600 leading-relaxed">
            Pathways hit an unexpected error. Please try again.
        </p>
    </div>
);

const TodayMode = lazyWithRetry(() => import('./today/TodayMode'));
const MapMode = lazyWithRetry(() => import('./map/MapMode'));
const WhatIfMode = lazyWithRetry(() => import('./what-if/WhatIfMode'));
const BuildMode = lazyWithRetry(() => import('./build/BuildMode'));
const OnboardRoute = lazyWithRetry(() => import('./onboard/OnboardRoute'));
const ProposalsRoute = lazyWithRetry(() => import('./proposals/ProposalsRoute'));
const NodeDetail = lazyWithRetry(() => import('./node/NodeDetail'));

const ModeFallback: React.FC = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 font-poppins">
        <div className="h-24 rounded-[20px] bg-grayscale-100 animate-pulse" />
    </div>
);

const PathwaysShell: React.FC = () => {
    const activePathway = pathwayStore.use.activePathway();

    // Whether we're on the cold-start discovery surface. Used to
    // suppress the shell header — see the JSX block below for why.
    const isOnOnboard = !!useRouteMatch('/pathways/onboard');

    // Emit the daily cost snapshot once per UTC day.
    useCostSnapshot();

    return (
        <IonPage>
            <ErrorBoundary fallback={<PathwaysErrorFallback />}>
                <IonContent fullscreen>
                    {/*
                        Tenant chrome — LearnCard wordmark + profile /
                        notifications / QR-scanner buttons + back arrow.
                        Mounted via `MainHeader` (the same Ionic
                        `IonHeader`-backed component used by AI
                        Pathways and other top-level routes), which
                        also handles iOS safe-area top inset so the
                        page no longer butts against the status bar.
                        Always rendered: the wordmark is the
                        learner's escape hatch back to /wallet on
                        every Journeys surface, including the
                        cold-start onboard route.
                    */}
                    <MainHeader showBackButton hidePlusBtn />

                    {/*
                        Brand subheader — mirrors the
                        AI-Pathways/AI-Insights/AI-Sessions
                        treatment so Journeys reads as a peer
                        feature on its cold-start screen. Only
                        rendered on /pathways/onboard; deeper
                        surfaces use `PathwaysHeader`'s
                        contextual chrome (pathway switcher +
                        mode tabs) instead, to avoid stacking
                        three rows of header.
                    */}
                    {isOnOnboard && <JourneysSubHeader />}

                    <div className="min-h-full bg-white">
                        {/*
                            Suppress the in-shell mode header on the
                            cold-start route: without an active pathway,
                            the header's title ("No pathways yet") and
                            the Today/Map/What-if/Build tab row are
                            either meaningless or actively broken
                            (those three modes redirect back here, so
                            the tabs look like a no-op). The onboard
                            page provides its own "Welcome to Journeys"
                            heading; the shell stays quiet until the
                            learner has something to be oriented in.
                        */}
                        {!isOnOnboard && (
                            <PathwaysHeader
                                title={activePathway?.title ?? 'Pathways'}
                                subtitle={activePathway?.goal}
                            />
                        )}

                        <Suspense fallback={<ModeFallback />}>
                            <Switch>
                                <Route exact path="/pathways">
                                    {/*
                                        Land returning learners on
                                        Map, not Today. Map is the
                                        spatial home — it shows the
                                        whole journey at a glance,
                                        which is the orienting view
                                        a learner re-entering from
                                        the side menu actually
                                        wants. Today is a great
                                        focus surface but doesn't
                                        answer "where am I in the
                                        bigger picture" on first
                                        sight. Mirrors the
                                        post-import landing target
                                        (`history.replace('/pathways/map')`)
                                        used by `DiscoverStart`.
                                    */}
                                    {activePathway ? (
                                        <Redirect to="/pathways/map" />
                                    ) : (
                                        <Redirect to="/pathways/onboard" />
                                    )}
                                </Route>

                                {/*
                                    Today / Map / What-if have nothing
                                    useful to show without an active
                                    pathway — their empty states were
                                    three different "pick a pathway
                                    first" cards, which is worse than
                                    just routing the learner into the
                                    discovery flow. Build stays mounted
                                    because its empty state *is* the
                                    import entry point. Redirects are
                                    inline (not a wrapper component) so
                                    the activePathway subscription in
                                    the shell re-evaluates on store
                                    change and the learner lands back
                                    on their intended tab automatically
                                    once a pathway is loaded.
                                */}
                                <Route exact path="/pathways/today">
                                    {activePathway ? (
                                        <TodayMode />
                                    ) : (
                                        <Redirect to="/pathways/onboard" />
                                    )}
                                </Route>
                                <Route exact path="/pathways/map">
                                    {activePathway ? (
                                        <MapMode />
                                    ) : (
                                        <Redirect to="/pathways/onboard" />
                                    )}
                                </Route>
                                <Route exact path="/pathways/what-if">
                                    {activePathway ? (
                                        <WhatIfMode />
                                    ) : (
                                        <Redirect to="/pathways/onboard" />
                                    )}
                                </Route>
                                <Route exact path="/pathways/build" component={BuildMode} />
                                <Route exact path="/pathways/onboard" component={OnboardRoute} />
                                <Route
                                    exact
                                    path="/pathways/proposals"
                                    component={ProposalsRoute}
                                />
                                <Route
                                    exact
                                    path="/pathways/node/:pathwayId/:nodeId"
                                    component={NodeDetail}
                                />

                                <Route>
                                    <Redirect to="/pathways" />
                                </Route>
                            </Switch>
                        </Suspense>
                    </div>

                    {/*
                        Completion ceremonies — mounted at shell
                        level so the overlay survives mode
                        switches and route changes (the learner
                        finishes a node via NodeDetail and gets
                        redirected to Today/Map; the celebration
                        renders on top of whichever mode landed
                        underneath). Reads
                        `pathwayStore.recentCelebration` and
                        renders nothing when there's nothing to
                        celebrate, so the cost is a single store
                        subscription on every shell render.
                    */}
                    <CompletionRoot />
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default PathwaysShell;
