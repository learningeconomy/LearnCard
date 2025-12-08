import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { Sparkles, Send, Rocket, ArrowRight, Loader2 } from 'lucide-react';

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
        useCreateIntegration,
        useListingsForIntegration,
        useDeleteListing,
        useSubmitForReview,
    } = useDeveloperPortal();

    const [newProjectName, setNewProjectName] = useState('');

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
    const createIntegrationMutation = useCreateIntegration();

    const handleCreateFirstProject = async () => {
        if (!newProjectName.trim()) return;

        try {
            const integrationId = await createIntegrationMutation.mutateAsync(newProjectName.trim());
            setSelectedIntegrationId(integrationId);
            setNewProjectName('');
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

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
                    {/* (<div className="text-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-700 tracking-tight">Partner Portal</h1>
                        <p className="text-gray-500 mt-1">Manage your app listings and track their approval status</p>
                    </div>)} */}

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
                        <div className="max-w-2xl mx-auto py-8">
                            <div className="text-center mb-10">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-200">
                                    <Rocket className="w-8 h-8 text-white" />
                                </div>

                                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                    Publish Your App
                                </h2>

                                <p className="text-gray-500 max-w-md mx-auto">
                                    Share your app with thousands of users. It only takes a few minutes to get started.
                                </p>
                            </div>

                            <div className="space-y-4 mb-10">
                                <div className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-100 text-violet-600">
                                        <Sparkles className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Step 1</span>

                                        <h3 className="font-semibold text-gray-800 mb-0.5">Create</h3>

                                        <p className="text-sm text-gray-500">
                                            Build your app listing with details, icon, screenshots, and integration settings.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-600">
                                        <Send className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Step 2</span>

                                        <h3 className="font-semibold text-gray-800 mb-0.5">Submit</h3>

                                        <p className="text-sm text-gray-500">
                                            Submit your listing for review. Our team will verify it meets our guidelines.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100 text-emerald-600">
                                        <Rocket className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Step 3</span>

                                        <h3 className="font-semibold text-gray-800 mb-0.5">Publish</h3>

                                        <p className="text-sm text-gray-500">
                                            Once approved, your app goes live in the App Store for users to discover.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="max-w-md mx-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                    Name your first project
                                </label>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreateFirstProject()}
                                        placeholder="e.g. My Awesome App"
                                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-sm"
                                        disabled={createIntegrationMutation.isPending}
                                    />

                                    <button
                                        onClick={handleCreateFirstProject}
                                        disabled={!newProjectName.trim() || createIntegrationMutation.isPending}
                                        className="px-5 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-200 flex items-center gap-2"
                                    >
                                        {createIntegrationMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Get Started
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                <p className="text-xs text-gray-400 mt-4 text-center">
                                    Free to publish • No coding required
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default DeveloperPortal;
