import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { AlertCircle } from 'lucide-react';

import { useDeveloperPortal } from './useDeveloperPortal';
import { HeaderIntegrationSelector } from './components/HeaderIntegrationSelector';
import { PartnerDashboard } from './components/PartnerDashboard';
import { AppStoreHeader } from './components/AppStoreHeader';
import type { ExtendedAppStoreListing } from './types';

const DeveloperPortal: React.FC = () => {
    const history = useHistory();
    const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);

    const {
        useIntegrations,
        useListingsForIntegration,
        useDeleteListing,
        useSubmitForReview,
    } = useDeveloperPortal();

    const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();

    // Default to first integration when loaded
    useEffect(() => {
        if (!selectedIntegrationId && integrations && integrations.length > 0) {
            setSelectedIntegrationId(integrations[0].id);
        }
    }, [integrations, selectedIntegrationId]);
    const { data: listings, isLoading: isLoadingListings, refetch: refetchListings } = useListingsForIntegration(selectedIntegrationId);

    const deleteMutation = useDeleteListing();
    const submitMutation = useSubmitForReview();

    const handleCreateNew = () => {
        if (selectedIntegrationId) {
            history.push(`/app-store/developer/new?integrationId=${selectedIntegrationId}`);
        }
    };

    const handleEditListing = (listing: ExtendedAppStoreListing) => {
        history.push({
            pathname: `/app-store/developer/edit/${listing.listing_id}`,
            search: `?integrationId=${selectedIntegrationId}`,
            state: { listing },
        });
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
            integrations={integrations || []}
            selectedId={selectedIntegrationId}
            onSelect={setSelectedIntegrationId}
            isLoading={isLoadingIntegrations}
        />
    );

    return (
        <IonPage>
            <AppStoreHeader title="Developer Portal" rightContent={integrationSelector} />

            <IonContent className="ion-padding">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-700 tracking-tight">Partner Portal</h1>
                        <p className="text-gray-500 mt-1">Manage your app listings and track their approval status</p>
                    </div>

                    {selectedIntegrationId && (
                        <PartnerDashboard
                            listings={(listings || []) as ExtendedAppStoreListing[]}
                            isLoading={isLoadingListings}
                            onRefresh={handleRefresh}
                            onCreateNew={handleCreateNew}
                            onEditListing={handleEditListing}
                            onSubmitForReview={handleSubmitForReview}
                            onDeleteListing={handleDeleteListing}
                        />
                    )}

                    {!selectedIntegrationId && !isLoadingIntegrations && integrations?.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 text-center py-12 px-4">
                            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-base font-medium text-gray-500 mb-1">No Integrations Yet</h3>
                            <p className="text-sm text-gray-400">Create an integration using the dropdown in the header to get started</p>
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default DeveloperPortal;
