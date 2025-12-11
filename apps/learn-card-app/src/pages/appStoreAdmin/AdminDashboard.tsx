import React, { useState } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { Filter, ShieldAlert } from 'lucide-react';

import { useDeveloperPortal } from '../appStoreDeveloper/useDeveloperPortal';
import { AppStoreHeader } from '../appStoreDeveloper/components/AppStoreHeader';
import type { AppListingStatus, PromotionLevel, ExtendedAppStoreListing } from '../appStoreDeveloper/types';

import { ListingSidebar, ListingDetail, type FilterStatus } from './components';

const AdminDashboard: React.FC = () => {
    const { useIsAdmin, useAdminListings, useAdminUpdateStatus, useAdminUpdatePromotion } =
        useDeveloperPortal();

    const { data: isAdmin, isLoading: isCheckingAdmin } = useIsAdmin();

    const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDING_REVIEW');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedListing, setSelectedListing] = useState<ExtendedAppStoreListing | null>(null);

    const {
        data: listings,
        isLoading: isLoadingListings,
        refetch: refetchListings,
    } = useAdminListings(filterStatus === 'ALL' ? undefined : (filterStatus as AppListingStatus));

    const updateStatusMutation = useAdminUpdateStatus();
    const updatePromotionMutation = useAdminUpdatePromotion();

    const pendingCount = (listings || []).filter(
        l => l.app_listing_status === 'PENDING_REVIEW'
    ).length;

    const handleStatusChange = async (listingId: string, status: AppListingStatus) => {
        await updateStatusMutation.mutateAsync({ listingId, status });

        if (selectedListing?.listing_id === listingId) {
            setSelectedListing(prev => (prev ? { ...prev, app_listing_status: status } : null));
        }
    };

    const handlePromotionChange = async (listingId: string, level: PromotionLevel) => {
        await updatePromotionMutation.mutateAsync({ listingId, level });

        if (selectedListing?.listing_id === listingId) {
            setSelectedListing(prev => (prev ? { ...prev, promotion_level: level } : null));
        }
    };

    // Loading state
    if (isCheckingAdmin) {
        return (
            <IonPage>
                <IonContent className="ion-padding">
                    <div className="flex justify-center items-center h-full">
                        <IonSpinner name="crescent" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Access denied state
    if (!isAdmin) {
        return (
            <IonPage>
                <AppStoreHeader title="Admin Dashboard" />
                <IonContent className="ion-padding">
                    <div className="max-w-md mx-auto text-center py-12">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
                        <p className="text-gray-500">You don't have admin permissions.</p>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <AppStoreHeader title="Admin Dashboard" />
            <IonContent>
                <div className="flex h-full">
                    {/* Sidebar */}
                    <ListingSidebar
                        listings={(listings || []) as ExtendedAppStoreListing[]}
                        selectedListing={selectedListing}
                        onSelectListing={setSelectedListing}
                        filterStatus={filterStatus}
                        onFilterChange={setFilterStatus}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        isLoading={isLoadingListings}
                        onRefresh={() => refetchListings()}
                        pendingCount={pendingCount}
                        isHidden={!!selectedListing}
                    />

                    {/* Detail Panel */}
                    <div className={`flex-1 bg-gray-50 ${!selectedListing ? 'hidden md:block' : ''}`}>
                        {selectedListing ? (
                            <ListingDetail
                                listing={selectedListing}
                                onStatusChange={handleStatusChange}
                                onPromotionChange={handlePromotionChange}
                                isUpdating={
                                    updateStatusMutation.isPending || updatePromotionMutation.isPending
                                }
                                onBack={() => setSelectedListing(null)}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <Filter className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-base font-medium text-gray-500 mb-1">
                                        Select an app to review
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Choose a listing from the sidebar
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AdminDashboard;
