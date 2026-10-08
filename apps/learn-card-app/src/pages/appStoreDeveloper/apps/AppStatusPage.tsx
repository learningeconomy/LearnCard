import React, { useState } from 'react';
import { Redirect, useHistory, useLocation, useParams } from 'react-router-dom';
import { IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/react';
import { alertCircleOutline, arrowBackOutline } from 'ionicons/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getLogger, useWallet } from 'learn-card-base';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { AppStatusView } from '../submit/AppStatusView';
import { getListingMode, withPendingChanges } from '../submit/listingLifecycle';
import { getAppStatusPath } from './myApps';

const log = getLogger('app-status-page');

const AppStatusPage: React.FC = () => {
    const history = useHistory();
    const location = useLocation<{ celebrate?: boolean } | undefined>();
    const { listingId } = useParams<{ listingId: string }>();
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
            <IonPage>
                <AppStoreHeader title="Your app" />
                <IonContent className="ion-padding">
                    <div className="flex justify-center items-center h-full">
                        <IonSpinner name="crescent" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!data) {
        return (
            <IonPage>
                <AppStoreHeader title="Your app" />
                <IonContent>
                    <div className="max-w-md mx-auto mt-16 p-6 text-center font-poppins">
                        <h1 className="text-xl font-semibold text-grayscale-900 mb-2">
                            We couldn't find this app
                        </h1>
                        <p className="text-sm text-grayscale-600">
                            It may have been deleted, or it belongs to another account.
                        </p>
                        <button
                            type="button"
                            onClick={() => history.push('/app-store/developer')}
                            className="mt-6 py-3 px-6 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            Back to Your Apps
                        </button>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const { listing, integrationId } = data;
    const mode = getListingMode(listing);
    const editPath = integrationId
        ? `/app-store/developer/integrations/${integrationId}/apps/${listingId}/listing`
        : null;

    if (mode === 'draft' && editPath) return <Redirect to={editPath} />;
    if (mode === 'draft') return <Redirect to="/app-store/developer" />;

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
            if (editPath) history.push(editPath);
        } catch (e) {
            log.error('listing.withdraw.failed', e, { listingId });
            setError('Something went wrong. Please try again.');
        } finally {
            setIsWorking(false);
        }
    };

    const viewInStore = () => {
        if (mode === 'live') {
            history.push(`/app/${listingId}`);
            return;
        }
        history.push({
            pathname: `/app/${listingId}`,
            state: { listing: withPendingChanges(listing), isPreview: true },
        });
    };

    return (
        <IonPage>
            <AppStoreHeader title="Your app" />
            <IonContent>
                <div className="px-4 sm:px-6 pt-6">
                    <div className="max-w-[560px] mx-auto">
                        <button
                            type="button"
                            onClick={() => history.push('/app-store/developer')}
                            className="flex items-center gap-1.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                        >
                            <IonIcon icon={arrowBackOutline} />
                            Your apps
                        </button>
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                                <IonIcon
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
                        onEdit={() => editPath && history.push(editPath)}
                        onViewInStore={viewInStore}
                        onOpenDashboard={() =>
                            integrationId &&
                            history.push(`/app-store/developer/integrations/${integrationId}`)
                        }
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AppStatusPage;
