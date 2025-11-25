import React, { useState, useEffect } from 'react';
import { Search, Filter, Inbox, Loader2, RefreshCw } from 'lucide-react';
import type { AppListingStatus, PromotionLevel } from '../../types/app-store';
import type { AppStoreListing } from '@learncard/types';
import { ListingCard } from './ListingCard';
import { ListingDetail } from './ListingDetail';
import { useLearnCardStore } from '../../stores/learncard';

type FilterStatus = AppListingStatus | 'ALL';

export const AdminDashboard: React.FC = () => {
    const {
        listings,
        isLoadingListings,
        loadAllListings,
        adminUpdateStatus,
        adminUpdatePromotion,
    } = useLearnCardStore();

    const [selectedListing, setSelectedListing] = useState<AppStoreListing | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDING_REVIEW');
    const [searchQuery, setSearchQuery] = useState('');

    // Load listings on mount and when filter changes
    useEffect(() => {
        if (filterStatus === 'ALL') {
            loadAllListings();
        } else {
            loadAllListings(filterStatus as AppListingStatus);
        }
    }, [filterStatus]);

    const filteredListings = listings.filter(listing => {
        const matchesSearch =
            !searchQuery ||
            listing.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            listing.tagline.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    const pendingCount = listings.filter(l => l.app_listing_status === 'PENDING_REVIEW').length;

    const handleStatusChange = async (listingId: string, status: AppListingStatus) => {
        const success = await adminUpdateStatus(listingId, status);

        if (success && selectedListing?.listing_id === listingId) {
            setSelectedListing(prev => (prev ? { ...prev, app_listing_status: status } : null));
        }
    };

    const handlePromotionChange = async (listingId: string, level: PromotionLevel) => {
        const success = await adminUpdatePromotion(listingId, level);

        if (success && selectedListing?.listing_id === listingId) {
            setSelectedListing(prev => (prev ? { ...prev, promotion_level: level } : null));
        }
    };

    const handleRefresh = () => {
        if (filterStatus === 'ALL') {
            loadAllListings();
        } else {
            loadAllListings(filterStatus as AppListingStatus);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Sidebar - Listings List */}
            <div className="w-96 border-r border-apple-gray-200 bg-white flex flex-col">
                {/* Search and Filters */}
                <div className="p-4 border-b border-apple-gray-200 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-gray-400" />

                        <input
                            type="text"
                            placeholder="Search apps..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-apple-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {(
                            [
                                { value: 'PENDING_REVIEW', label: 'Pending' },
                                { value: 'ALL', label: 'All' },
                                { value: 'LISTED', label: 'Listed' },
                                { value: 'DRAFT', label: 'Draft' },
                                { value: 'ARCHIVED', label: 'Archived' },
                            ] as { value: FilterStatus; label: string }[]
                        ).map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => setFilterStatus(filter.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                    filterStatus === filter.value
                                        ? 'bg-apple-blue text-white'
                                        : 'bg-apple-gray-100 text-apple-gray-500 hover:bg-apple-gray-200'
                                }`}
                            >
                                {filter.label}
                                {filter.value === 'PENDING_REVIEW' && pendingCount > 0 && (
                                    <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Refresh button */}
                <div className="px-4 py-2 border-b border-apple-gray-100">
                    <button
                        onClick={handleRefresh}
                        disabled={isLoadingListings}
                        className="flex items-center gap-2 text-sm text-apple-gray-500 hover:text-apple-gray-600 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoadingListings ? 'animate-spin' : ''}`} />
                        {isLoadingListings ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {/* Listings */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoadingListings ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 text-apple-blue mx-auto mb-3 animate-spin" />

                            <p className="text-apple-gray-500 text-sm">Loading listings...</p>
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <div className="text-center py-12">
                            <Inbox className="w-12 h-12 text-apple-gray-300 mx-auto mb-3" />

                            <p className="text-apple-gray-500 text-sm">No listings found</p>
                        </div>
                    ) : (
                        filteredListings.map(listing => (
                            <ListingCard
                                key={listing.listing_id}
                                listing={listing}
                                onSelect={setSelectedListing}
                                isSelected={selectedListing?.listing_id === listing.listing_id}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Main Content - Detail View */}
            <div className="flex-1 bg-apple-gray-50">
                {selectedListing ? (
                    <ListingDetail
                        listing={selectedListing}
                        onStatusChange={handleStatusChange}
                        onPromotionChange={handlePromotionChange}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <Filter className="w-16 h-16 text-apple-gray-300 mx-auto mb-4" />

                            <h3 className="text-lg font-medium text-apple-gray-500 mb-2">
                                Select an app to review
                            </h3>

                            <p className="text-sm text-apple-gray-400">
                                Choose a listing from the sidebar to view details
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
