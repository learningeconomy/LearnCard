/**
 * PathwaysShell — the one shell that hosts the four modes, onboard, and
 * proposals. Switching modes is a viewport change, never a data fetch
 * (docs § 4, § 10).
 *
 * Mounted at `/pathways` from Routes.tsx behind a tenant feature flag.
 */

import React, { Suspense } from 'react';

import { IonContent, IonPage } from '@ionic/react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { lazyWithRetry } from 'learn-card-base';

import PathwaysHeader from './PathwaysHeader';
import { pathwayStore } from '../../stores/pathways';
import { useCostSnapshot } from './hooks/useCostSnapshot';

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

    // Emit the daily cost snapshot once per UTC day.
    useCostSnapshot();

    return (
        <IonPage>
            <ErrorBoundary fallback={<PathwaysErrorFallback />}>
                <IonContent fullscreen>
                    <div className="min-h-full bg-white">
                        <PathwaysHeader
                            title={activePathway?.title ?? 'Pathways'}
                            subtitle={activePathway?.goal}
                        />

                        <Suspense fallback={<ModeFallback />}>
                            <Switch>
                                <Route exact path="/pathways">
                                    {activePathway ? (
                                        <Redirect to="/pathways/today" />
                                    ) : (
                                        <Redirect to="/pathways/onboard" />
                                    )}
                                </Route>

                                <Route exact path="/pathways/today" component={TodayMode} />
                                <Route exact path="/pathways/map" component={MapMode} />
                                <Route exact path="/pathways/what-if" component={WhatIfMode} />
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
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default PathwaysShell;
