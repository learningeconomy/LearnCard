import React, { useState } from 'react';
import { Navigate, useLocation, useParams, useNavigate } from 'react-router';
import { AppIcon } from 'learn-card-base/ui/icon';
import { alertCircleOutline, arrowBackOutline } from 'learn-card-base/icons/ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getLogger, useWallet } from 'learn-card-base';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { AppStatusView } from '../submit/AppStatusView';
import { getListingMode, withPendingChanges } from '../submit/listingLifecycle';
import { getAppStatusPath } from './myApps';
import { DeleteAppMenu } from './DeleteAppMenu';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';

const log = getLogger('app-status-page');

const AppStatusPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { listingId } = useParams() as { listingId: string };
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const [isWorking, setIsWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['developer', 'listing', 'status', listingId],
        queryFn: async () => {
            const wallet = await initWallet();
            const [listing, integration] = await Promise.all([
                wallet.invoke.getAppStoreListing(listingId),
                wallet.invoke.getIntegrationForListing(listingId),
            ]);
            return listing ? { listing, integrationId: integration?.id ?? null } : null;
        },
        enabled: Boolean(listingId),
    });

    if (isLoading) {
        return (
            <AppPage>
                <AppStoreHeader title="Your app" />
                <AppContent className="ion-padding">
                    <div className="flex justify-center items-center h-full">
                        <AppSpinner name="crescent" />
                    </div>
                </AppContent>
            </AppPage>
        );
    }

    if (!data) {
        return (
            <AppPage>
                <AppStoreHeader title="Your app" />
                <AppContent>
                    <div className="max-w-md mx-auto mt-16 p-6 text-center font-poppins">
                        <h1 className="text-xl font-semibold text-grayscale-900 mb-2">
                            We couldn't find this app
                        </h1>
                        <p className="text-sm text-grayscale-600">
                            It may have been deleted, or it belongs to another account.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/app-store/developer')}
                            className="mt-6 py-3 px-6 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            Back to Your Apps
                        </button>
                    </div>
                </AppContent>
            </AppPage>
        );
    }

    const { listing, integrationId } = data;
    const mode = getListingMode(listing);
    const editPath = integrationId
        ? `/app-store/developer/integrations/${integrationId}/apps/${listingId}/listing`
        : null;

    if (mode === 'draft' && editPath) return <Navigate replace to={editPath} />;
    if (mode === 'draft') return <Navigate replace to="/app-store/developer" />;

    const makeChanges = async () => {
        setIsWorking(true);
        setError(null);
        try {
            const wallet = await initWallet();
            if (mode === 'update-in-review') {
                await wallet.invoke.withdrawAppStoreListingUpdate(listingId);
            } else {
                await wallet.invoke.unsubmitAppStoreListing(listingId);
            }
            await queryClient.invalidateQueries({ queryKey: ['developer', 'listings'] });
            await queryClient.invalidateQueries({ queryKey: ['developer', 'listing'] });
            if (editPath) navigate(editPath);
        } catch (e) {
            log.error('listing.withdraw.failed', e, { listingId });
            setError('Something went wrong. Please try again.');
        } finally {
            setIsWorking(false);
        }
    };

    const viewInStore = () => {
        if (mode === 'live') {
            navigate(`/app/${listingId}`);
            return;
        }
        navigate(
            { pathname: `/app/${listingId}` },
            { state: { listing: withPendingChanges(listing), isPreview: true } }
        );
    };

    return (
        <AppPage>
            <AppStoreHeader title="Your app" />
            <AppContent>
                <div className="px-4 sm:px-6 pt-6">
                    <div className="max-w-[560px] mx-auto">
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/app-store/developer')}
                                className="flex items-center gap-1.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                <AppIcon icon={arrowBackOutline} />
                                Your apps
                            </button>
                            <DeleteAppMenu
                                listingId={listingId}
                                integrationId={integrationId}
                                displayName={listing.display_name}
                                mode={mode}
                                onDeleted={() => navigate('/app-store/developer')}
                            />
                        </div>
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                                <AppIcon
                                    icon={alertCircleOutline}
                                    className="text-red-400 text-lg mt-0.5 shrink-0"
                                />
                                <span className="text-sm text-red-700 leading-relaxed">
                                    {error}
                                </span>
                            </div>
                        )}
                    </div>
                    <AppStatusView
                        listing={listing}
                        mode={mode}
                        celebrate={Boolean(location.state?.celebrate)}
                        hasNewAppChanges={false}
                        isWorking={isWorking}
                        shareUrl={`${window.location.origin}${getAppStatusPath(listingId)}`}
                        onMakeChanges={makeChanges}
                        onEdit={() => editPath && navigate(editPath)}
                        onViewInStore={viewInStore}
                        onOpenDashboard={() =>
                            integrationId &&
                            navigate(`/app-store/developer/integrations/${integrationId}`)
                        }
                    />
                </div>
            </AppContent>
        </AppPage>
    );
};

export default AppStatusPage;
