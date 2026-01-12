import React from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { Loader2 } from 'lucide-react';

import { useDeveloperPortal } from './useDeveloperPortal';
import { useDeveloperPortalContext } from './DeveloperPortalContext';
import { HeaderIntegrationSelector } from './components/HeaderIntegrationSelector';
import { PartnerDashboard } from './components/PartnerDashboard';
import { AppStoreHeader } from './components/AppStoreHeader';
import type { ExtendedAppStoreListing } from './types';

/**
 * DeveloperPortal - Apps listing page for a specific integration
 * Route: /app-store/developer/integrations/:integrationId/apps
 */
const DeveloperPortal: React.FC = () => {
    const history = useHistory();

    // Use context for integration state (derived from URL)
    const {
        currentIntegrationId,
        currentIntegration,
        integrations,
        isLoadingIntegrations,
        selectIntegration,
    } = useDeveloperPortalContext();

    // For listing management
    const {
        useListingsForIntegration,
        useDeleteListing,
        useSubmitForReview,
    } = useDeveloperPortal();

    const { data: listings, isLoading: isLoadingListings, refetch: refetchListings } = useListingsForIntegration(currentIntegrationId);

    const deleteMutation = useDeleteListing();
    const submitMutation = useSubmitForReview();

    // If no integration ID in URL, redirect to landing page
    if (!currentIntegrationId && !isLoadingIntegrations) {
        return <Redirect to="/app-store/developer" />;
    }

    const handleCreateNew = () => {
        if (currentIntegrationId) {
            history.push(`/app-store/developer/integrations/${currentIntegrationId}/apps/new`);
        }
    };

    const handleEditListing = (listing: ExtendedAppStoreListing) => {
        if (currentIntegrationId) {
            history.push({
                pathname: `/app-store/developer/integrations/${currentIntegrationId}/apps/${listing.listing_id}`,
                state: { listing },
            });
        }
    };

    const handleDeleteListing = async (listingId: string) => {
        await deleteMutation.mutateAsync(listingId);
    };

    const handleSubmitForReview = async (listingId: string) => {
        await submitMutation.mutateAsync(listingId);
    };

    const handleRefresh = () => {
        refetchListings();
    };

    const integrationSelector = (
        <HeaderIntegrationSelector
            integrations={integrations}
            selectedId={currentIntegrationId}
            onSelect={selectIntegration}
            isLoading={isLoadingIntegrations}
        />
    );

    // Show loader while loading
    if (isLoadingIntegrations) {
        return (
            <IonPage>
                <AppStoreHeader title="Developer Portal" rightContent={integrationSelector} />

                <IonContent className="ion-padding">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                            <p className="text-sm text-gray-500 mt-3">Loading...</p>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <AppStoreHeader title="Developer Portal" rightContent={integrationSelector} />

            <IonContent className="ion-padding">
                <div className="max-w-5xl mx-auto">
                    {/* Project name header
                    {currentIntegration && (
                        <div className="mb-4">
                            <h1 className="text-xl font-semibold text-gray-800">
                                {currentIntegration.name}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Manage app listings for this project
                            </p>
                        </div>
                    )} */}

                    <PartnerDashboard
                        listings={(listings || []) as ExtendedAppStoreListing[]}
                        isLoading={isLoadingListings}
                        onRefresh={handleRefresh}
                        onCreateNew={handleCreateNew}
                        onEditListing={handleEditListing}
                        onSubmitForReview={handleSubmitForReview}
                        onDeleteListing={handleDeleteListing}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default DeveloperPortal;
