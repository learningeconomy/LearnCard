import { getLogger } from 'learn-card-base';
const log = getLogger('apps-landing-page');

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowRight, Loader2, Code2, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';

import * as m from '../../paraglide/messages.js';

import { AppStoreHeader } from './components/AppStoreHeader';
import { useDeveloperPortalContext } from './DeveloperPortalContext';
import { useDeveloperPortal } from './useDeveloperPortal';
import { useWallet } from 'learn-card-base';

import { USE_CASES, UseCaseId } from './guides/types';
import type { LCNIntegration, AppStoreListing } from '@learncard/types';

type FlatItem =
    | {
          type: 'listing';
          integration: LCNIntegration;
          listing: AppStoreListing;
          hasSiblings: boolean;
      }
    | { type: 'setup'; integration: LCNIntegration }
    | { type: 'headless'; integration: LCNIntegration };

const getKindChip = (guideType?: string) => {
    switch (guideType) {
        case 'embed-app':
            return 'Embedded';
        case 'issue-credentials':
            return 'API';
        case 'embed-claim':
            return 'Claim Button';
        case 'consent-flow':
            return 'Consent';
        case 'course-catalog':
            return 'Catalog';
        default:
            return 'App';
    }
};

const ProjectSection: React.FC<{ integration: LCNIntegration }> = ({ integration }) => {
    const { useListingsForIntegration } = useDeveloperPortal();
    const { data: listingsData, isLoading } = useListingsForIntegration(integration.id);
    const listings = listingsData || [];
    const history = useHistory();

    const isSetupInProgress = integration.status === 'setup';
    const guideName = integration.guideType && USE_CASES[integration.guideType as UseCaseId]?.title;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-grayscale-500 uppercase tracking-wider">
                        {integration.name}
                    </h3>
                    <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            integration.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-amber-50 text-amber-600'
                        }`}
                    >
                        {integration.status === 'active' ? 'Active' : 'In Setup'}
                    </span>
                </div>
                <button
                    onClick={() =>
                        history.push(`/app-store/developer/integrations/${integration.id}`)
                    }
                    className="text-xs font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
                >
                    Project settings
                </button>
            </div>

            <div className="space-y-2">
                {isLoading ? (
                    <div className="w-full h-16 bg-grayscale-100 rounded-xl animate-pulse" />
                ) : (
                    <>
                        {listings.map(listing => (
                            <button
                                key={listing.listing_id}
                                onClick={() => {
                                    const targetUrl =
                                        integration.guideType === 'embed-app'
                                            ? `/app-store/developer/integrations/${integration.id}`
                                            : `/app-store/developer/integrations/${integration.id}/apps`;
                                    history.push(targetUrl);
                                }}
                                className="w-full p-3 bg-white border border-grayscale-200 rounded-xl hover:bg-grayscale-10 transition-colors flex items-center gap-4 text-left group"
                            >
                                <img
                                    src={
                                        listing.icon_url ||
                                        'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb'
                                    }
                                    alt={listing.display_name}
                                    className="w-10 h-10 rounded-lg object-cover border border-grayscale-200"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm text-grayscale-900 group-hover:text-emerald-700 transition-colors">
                                            {listing.display_name || 'Untitled App'}
                                        </h4>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                listing.app_listing_status === 'LISTED'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : listing.app_listing_status ===
                                                      'PENDING_REVIEW'
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-grayscale-100 text-grayscale-600'
                                            }`}
                                        >
                                            {listing.app_listing_status === 'LISTED'
                                                ? 'Live'
                                                : listing.app_listing_status === 'PENDING_REVIEW'
                                                ? 'In review'
                                                : 'Draft'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-grayscale-500 truncate mt-0.5">
                                        {listing.tagline || 'No tagline'}
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-grayscale-300 group-hover:text-emerald-500 transition-colors" />
                            </button>
                        ))}

                        {isSetupInProgress && guideName && (
                            <button
                                onClick={() =>
                                    history.push(
                                        `/app-store/developer/integrations/${integration.id}/guides/${integration.guideType}`
                                    )
                                }
                                className="w-full p-3 bg-white border border-grayscale-200 rounded-xl hover:bg-grayscale-10 transition-colors flex items-center gap-3 text-left group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                    <RefreshCw className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-grayscale-900 group-hover:text-emerald-700 transition-colors">
                                        ⟳ {guideName} setup
                                    </h4>
                                    <p className="text-xs text-amber-600 mt-0.5">In progress</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-grayscale-300 group-hover:text-emerald-500 transition-colors" />
                            </button>
                        )}

                        {listings.length === 0 && !isSetupInProgress && (
                            <div className="w-full p-3 bg-grayscale-50 border border-grayscale-200 border-dashed rounded-xl flex items-center gap-4 text-left">
                                <div className="w-10 h-10 rounded-lg bg-grayscale-100 flex items-center justify-center text-grayscale-400">
                                    <Code2 className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-grayscale-500">
                                        No apps yet
                                    </h4>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() =>
                                history.push(
                                    `/app-store/developer/integrations/${integration.id}/guides`
                                )
                            }
                            className="w-full p-3 bg-transparent border border-transparent rounded-xl hover:bg-grayscale-50 transition-colors flex items-center gap-2 text-left group"
                        >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-grayscale-400 group-hover:text-emerald-600 transition-colors">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-grayscale-500 group-hover:text-emerald-600 transition-colors">
                                New
                            </span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const AppsLandingPage: React.FC = () => {
    const history = useHistory();
    const [newProjectName, setNewProjectName] = useState('');
    const [isOrganizeView, setIsOrganizeView] = useState(() => {
        return localStorage.getItem('lc_app_store_organize_view') === 'true';
    });

    const { integrations, isLoadingIntegrations, createIntegration, isCreatingIntegration } =
        useDeveloperPortalContext();

    const { initWallet } = useWallet();

    const listingQueries = useQueries({
        queries: integrations.map(integration => ({
            // Distinct from useListingsForIntegration's ['developer', 'listings', id] key,
            // which caches a bare AppStoreListing[] — sharing it would poison this shape.
            queryKey: ['developer', 'landing-listings', integration.id],
            queryFn: async (): Promise<{
                integration: LCNIntegration;
                listings: AppStoreListing[];
            }> => {
                const wallet = await initWallet();
                const result = await wallet.invoke.getListingsForIntegration(integration.id, {
                    limit: 100,
                });
                return { integration, listings: result.records };
            },
            staleTime: 1000 * 60 * 2,
        })),
    });

    const isLoadingListings = listingQueries.some(q => q.isLoading);
    const hasListingErrors = listingQueries.some(q => q.error);

    const flatItems: FlatItem[] = [];
    listingQueries.forEach(q => {
        if (q.data) {
            const data = q.data as { integration: LCNIntegration; listings: AppStoreListing[] };
            const { integration, listings } = data;
            if (!integration) return;
            const isSetupInProgress = integration.status === 'setup';

            if (listings.length > 0) {
                listings.forEach(listing => {
                    flatItems.push({
                        type: 'listing',
                        integration,
                        listing,
                        hasSiblings: listings.length > 1,
                    });
                });
            } else if (isSetupInProgress) {
                flatItems.push({ type: 'setup', integration });
            } else {
                flatItems.push({ type: 'headless', integration });
            }
        }
    });

    const handleCreateFirstProject = async () => {
        if (!newProjectName.trim()) return;

        try {
            const id = await createIntegration(newProjectName.trim());
            setNewProjectName('');
            history.push(`/app-store/developer/integrations/${id}/apps`);
        } catch (error) {
            log.error('Failed to create project:', error);
        }
    };

    const toggleOrganizeView = () => {
        const newValue = !isOrganizeView;
        setIsOrganizeView(newValue);
        localStorage.setItem('lc_app_store_organize_view', String(newValue));
    };

    if (isLoadingIntegrations) {
        return (
            <IonPage>
                <AppStoreHeader title={m['developerPortal.shell.title']()} />
                <IonContent className="ion-padding">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-emerald-500 mx-auto animate-spin" />
                            <p className="text-sm text-grayscale-500 mt-3">Loading apps...</p>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (integrations.length === 0) {
        return (
            <IonPage>
                <AppStoreHeader title={m['developerPortal.shell.title']()} />
                <IonContent className="ion-padding">
                    <div className="max-w-2xl mx-auto py-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-grayscale-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <Code2 className="w-8 h-8 text-grayscale-400" />
                            </div>
                            <h2 className="text-2xl font-semibold text-grayscale-900 mb-2">
                                Nothing here yet — build your first app
                            </h2>
                            <p className="text-grayscale-500 max-w-md mx-auto">
                                Get started by creating a new app.
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={() => history.push('/app-store/developer/guides')}
                                className="px-5 py-3 bg-grayscale-900 text-white rounded-[20px] font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Create App
                            </button>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <AppStoreHeader title={m['developerPortal.shell.title']()} />
            <IonContent className="ion-padding">
                <div className="max-w-3xl mx-auto py-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-semibold text-grayscale-900 mb-1">
                                Your Apps
                            </h1>
                            <p className="text-sm text-grayscale-500">Manage your apps.</p>
                        </div>
                        <button
                            onClick={toggleOrganizeView}
                            className="text-sm font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
                        >
                            {isOrganizeView ? 'Flat view' : 'Organize'}
                        </button>
                    </div>

                    {isOrganizeView ? (
                        <div>
                            {integrations.map(integration => (
                                <ProjectSection key={integration.id} integration={integration} />
                            ))}
                            <div className="mt-8 pt-6 border-t border-grayscale-200">
                                <div className="flex items-center gap-3 max-w-md">
                                    <input
                                        type="text"
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        onKeyDown={e =>
                                            e.key === 'Enter' && handleCreateFirstProject()
                                        }
                                        placeholder="New project name..."
                                        className="flex-1 px-4 py-2 bg-grayscale-50 border border-transparent hover:border-grayscale-200 focus:bg-white focus:border-emerald-500 rounded-xl text-sm text-grayscale-900 placeholder-grayscale-400 focus:outline-none transition-colors"
                                        disabled={isCreatingIntegration}
                                    />
                                    <button
                                        onClick={handleCreateFirstProject}
                                        disabled={!newProjectName.trim() || isCreatingIntegration}
                                        className="px-4 py-2 bg-transparent text-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                                    >
                                        {isCreatingIntegration ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                Create
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {hasListingErrors && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                                    <span className="text-sm text-red-700 leading-relaxed">
                                        Some apps couldn't be loaded. Refresh to try again.
                                    </span>
                                </div>
                            )}
                            {isLoadingListings ? (
                                <div className="w-full h-16 bg-grayscale-100 rounded-xl animate-pulse" />
                            ) : flatItems.length === 0 ? (
                                <div className="w-full p-6 bg-grayscale-50 border border-grayscale-200 border-dashed rounded-xl flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-grayscale-100 flex items-center justify-center text-grayscale-400 mb-3">
                                        <Code2 className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-medium text-grayscale-900 mb-1">
                                        Nothing here yet — build your first app
                                    </h4>
                                    <button
                                        onClick={() => history.push('/app-store/developer/guides')}
                                        className="mt-4 px-4 py-2 bg-grayscale-900 text-white rounded-[20px] text-sm font-medium hover:opacity-90 transition-opacity"
                                    >
                                        Create App
                                    </button>
                                </div>
                            ) : (
                                flatItems.map((item, index) => {
                                    const { type, integration } = item;
                                    const guideType = integration.guideType;
                                    const kindChip = getKindChip(guideType);

                                    const targetUrl =
                                        guideType === 'embed-app'
                                            ? `/app-store/developer/integrations/${integration.id}`
                                            : `/app-store/developer/integrations/${integration.id}/apps`;

                                    if (type === 'listing') {
                                        const { listing, hasSiblings } = item;
                                        return (
                                            <button
                                                key={`${integration.id}-${listing.listing_id}`}
                                                onClick={() => history.push(targetUrl)}
                                                className="w-full p-4 bg-white border border-grayscale-200 rounded-xl hover:bg-grayscale-10 transition-colors flex items-center gap-4 text-left group"
                                            >
                                                <img
                                                    src={
                                                        listing.icon_url ||
                                                        'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb'
                                                    }
                                                    alt={listing.display_name}
                                                    className="w-12 h-12 rounded-lg object-cover border border-grayscale-200"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-base text-grayscale-900 group-hover:text-emerald-700 transition-colors">
                                                            {listing.display_name || 'Untitled App'}
                                                        </h4>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-grayscale-100 text-grayscale-600">
                                                            {kindChip}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                                listing.app_listing_status ===
                                                                'LISTED'
                                                                    ? 'bg-emerald-50 text-emerald-600'
                                                                    : listing.app_listing_status ===
                                                                      'PENDING_REVIEW'
                                                                    ? 'bg-amber-50 text-amber-600'
                                                                    : 'bg-grayscale-100 text-grayscale-600'
                                                            }`}
                                                        >
                                                            {listing.app_listing_status === 'LISTED'
                                                                ? 'Live'
                                                                : listing.app_listing_status ===
                                                                  'PENDING_REVIEW'
                                                                ? 'In review'
                                                                : 'Draft'}
                                                        </span>
                                                    </div>
                                                    {hasSiblings && (
                                                        <p className="text-xs text-grayscale-400">
                                                            Shared project: {integration.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-grayscale-300 group-hover:text-emerald-500 transition-colors" />
                                            </button>
                                        );
                                    }

                                    if (type === 'setup') {
                                        return (
                                            <button
                                                key={`setup-${integration.id}`}
                                                onClick={() =>
                                                    history.push(
                                                        `/app-store/developer/integrations/${integration.id}/guides/${integration.guideType}`
                                                    )
                                                }
                                                className="w-full p-4 bg-white border border-grayscale-200 rounded-xl hover:bg-grayscale-10 transition-colors flex items-center gap-4 text-left group"
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                                    <RefreshCw className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-base text-grayscale-900 group-hover:text-emerald-700 transition-colors">
                                                            Untitled app
                                                        </h4>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-grayscale-100 text-grayscale-600">
                                                            {kindChip}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600">
                                                            Setup in progress
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-grayscale-300 group-hover:text-emerald-500 transition-colors" />
                                            </button>
                                        );
                                    }

                                    if (type === 'headless') {
                                        return (
                                            <button
                                                key={`headless-${integration.id}`}
                                                onClick={() => history.push(targetUrl)}
                                                className="w-full p-4 bg-white border border-grayscale-200 rounded-xl hover:bg-grayscale-10 transition-colors flex items-center gap-4 text-left group"
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-grayscale-100 flex items-center justify-center text-grayscale-500">
                                                    <Code2 className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-base text-grayscale-900 group-hover:text-emerald-700 transition-colors">
                                                            {integration.name || 'Untitled App'}
                                                        </h4>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-grayscale-100 text-grayscale-600">
                                                            {kindChip}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-grayscale-100 text-grayscale-600">
                                                            Waiting for code…
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-grayscale-300 group-hover:text-emerald-500 transition-colors" />
                                            </button>
                                        );
                                    }

                                    return null;
                                })
                            )}
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AppsLandingPage;
