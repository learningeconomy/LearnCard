import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/react';
import {
    addOutline,
    alertCircleOutline,
    arrowForwardOutline,
    chevronForwardOutline,
    rocketOutline,
} from 'ionicons/icons';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { useDeveloperPortalContext } from '../DeveloperPortalContext';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { DEFAULT_APP_ICON_URL } from '../submit/constants';
import type { ListingMode } from '../submit/listingLifecycle';
import { STATUS_LABELS, getAppStatusPath, toMyApps } from './myApps';
import type { MyApp } from './myApps';
import { LAUNCH_TYPE_LABELS } from '../submit/launchSettings';
import { DEVELOPER_DOCS_URL, NewAppSheet } from './NewAppSheet';
import { openExternalLink } from '../../../helpers/externalLinkHelpers';
import { DeleteAppMenu } from './DeleteAppMenu';

const PILL_CLASS: Record<ListingMode, string> = {
    'draft': 'bg-grayscale-100 text-grayscale-700',
    'in-review': 'bg-amber-50 text-amber-700',
    'live': 'bg-emerald-50 text-emerald-700',
    'update-in-review': 'bg-emerald-50 text-emerald-700',
    'removed': 'bg-red-50 text-red-700',
};

const PROGRESS: Record<ListingMode, { width: string; color: string }> = {
    'draft': { width: '15%', color: 'bg-grayscale-300' },
    'in-review': { width: '60%', color: 'bg-amber-400' },
    'update-in-review': { width: '100%', color: 'bg-emerald-500' },
    'live': { width: '100%', color: 'bg-emerald-500' },
    'removed': { width: '0%', color: 'bg-red-300' },
};

const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    onOpen: () => void
): void => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpen();
    }
};

const AppCard: React.FC<{ app: MyApp; onOpen: () => void }> = ({ app, onOpen }) => {
    const { listing, mode, nudge, integrationId } = app;
    const progress = PROGRESS[mode];

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`Open ${listing.display_name}`}
            onClick={onOpen}
            onKeyDown={event => handleCardKeyDown(event, onOpen)}
            className="group relative text-left w-full bg-white rounded-[20px] border border-grayscale-200 p-5 hover:border-grayscale-300 hover:shadow-md transition-all cursor-pointer"
        >
            <div className="flex items-start gap-4">
                <img
                    src={listing.icon_url || DEFAULT_APP_ICON_URL}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover border border-grayscale-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-grayscale-900 truncate">
                            {listing.display_name}
                        </h3>
                        <div className="flex items-center gap-0.5 shrink-0">
                            <DeleteAppMenu
                                listingId={listing.listing_id}
                                integrationId={integrationId}
                                displayName={listing.display_name}
                                mode={mode}
                            />
                            <IonIcon
                                icon={chevronForwardOutline}
                                className="text-grayscale-400 group-hover:text-grayscale-700 transition-colors"
                            />
                        </div>
                    </div>
                    <p className="text-sm text-grayscale-500 truncate">{listing.tagline}</p>
                    <div className="mt-2 flex items-center gap-2 min-w-0">
                        <span
                            className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${PILL_CLASS[mode]}`}
                        >
                            {STATUS_LABELS[mode]}
                        </span>
                        {listing.launch_type !== 'EMBEDDED_IFRAME' && (
                            <span className="text-xs text-grayscale-500 truncate">
                                {LAUNCH_TYPE_LABELS[listing.launch_type]}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 h-1 rounded-full bg-grayscale-100 overflow-hidden">
                <div
                    className={`h-full rounded-full ${progress.color}`}
                    style={{ width: progress.width }}
                />
            </div>

            {nudge && (
                <p className="mt-3 text-xs font-medium text-grayscale-700 flex items-center gap-1">
                    {nudge}
                    <IonIcon icon={arrowForwardOutline} />
                </p>
            )}
        </div>
    );
};

const MyAppsPage: React.FC = () => {
    const history = useHistory();
    const { integrations, isLoadingIntegrations } = useDeveloperPortalContext();
    const { useMyApps } = useDeveloperPortal();
    const { data, isLoading, isError, refetch } = useMyApps(
        isLoadingIntegrations ? undefined : integrations
    );

    const apps = toMyApps(data ?? []);
    const [isNewAppOpen, setIsNewAppOpen] = useState(false);
    const openNewApp = () => setIsNewAppOpen(true);
    const loading = isLoadingIntegrations || isLoading;

    return (
        <IonPage>
            <AppStoreHeader title="Your Apps" />
            <IonContent>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-poppins">
                    <div className="mb-8 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-grayscale-900">Your apps</h1>
                            <p className="text-sm text-grayscale-600 mt-1">
                                Everything you've built for LearnCard, in one place.
                            </p>
                        </div>
                        {apps.length > 0 && (
                            <button
                                type="button"
                                onClick={openNewApp}
                                className="shrink-0 flex items-center gap-1.5 py-2.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                <IonIcon icon={addOutline} className="text-base" />
                                New App
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <IonSpinner name="crescent" />
                        </div>
                    ) : isError ? (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                            <IonIcon
                                icon={alertCircleOutline}
                                className="text-red-400 text-lg mt-0.5 shrink-0"
                            />
                            <span className="flex-1 text-sm text-red-700">
                                We couldn't load your apps.
                            </span>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="text-sm font-medium text-red-700 hover:underline"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : apps.length === 0 ? (
                        <div className="bg-white rounded-[20px] border border-grayscale-200 p-10 text-center animate-fade-in-up">
                            <div className="w-16 h-16 rounded-full bg-grayscale-100 flex items-center justify-center mx-auto mb-4">
                                <IonIcon
                                    icon={rocketOutline}
                                    className="text-3xl text-grayscale-700"
                                />
                            </div>
                            <h2 className="text-xl font-semibold text-grayscale-900">
                                Build your first app
                            </h2>
                            <p className="text-sm text-grayscale-600 mt-1 max-w-sm mx-auto">
                                Make it in Lovable or your own code, then use the Publish to
                                LearnCard link to bring it here.
                            </p>
                            <button
                                type="button"
                                onClick={openNewApp}
                                className="mt-6 py-3 px-5 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
                            {apps.map(app => (
                                <AppCard
                                    key={app.listing.listing_id}
                                    app={app}
                                    onOpen={() =>
                                        history.push(getAppStatusPath(app.listing.listing_id))
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {isNewAppOpen && (
                        <NewAppSheet
                            onClose={() => setIsNewAppOpen(false)}
                            onBuildApp={() => history.push('/app-store/developer/guides/embed-app')}
                            onListExisting={type =>
                                history.push(`/app-store/developer/apps/new?type=${type}`)
                            }
                            onOpenDocs={() => openExternalLink(DEVELOPER_DOCS_URL)}
                        />
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default MyAppsPage;
