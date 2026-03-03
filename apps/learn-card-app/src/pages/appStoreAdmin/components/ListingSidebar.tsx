import React from 'react';
import { Search, Inbox, Loader2, RefreshCw } from 'lucide-react';

import { StatusBadge } from '../../appStoreDeveloper/components/StatusBadge';
import type { AppListingStatus, ExtendedAppStoreListing } from '../../appStoreDeveloper/types';

type FilterStatus = AppListingStatus | 'ALL';

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: 'PENDING_REVIEW', label: 'Pending' },
    { value: 'ALL', label: 'All' },
    { value: 'LISTED', label: 'Listed' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ARCHIVED', label: 'Archived' },
];

interface ListingSidebarProps {
    listings: ExtendedAppStoreListing[];
    selectedListing: ExtendedAppStoreListing | null;
    onSelectListing: (listing: ExtendedAppStoreListing) => void;
    filterStatus: FilterStatus;
    onFilterChange: (status: FilterStatus) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isLoading: boolean;
    onRefresh: () => void;
    pendingCount: number;
    isHidden?: boolean;
}

export const ListingSidebar: React.FC<ListingSidebarProps> = ({
    listings,
    selectedListing,
    onSelectListing,
    filterStatus,
    onFilterChange,
    searchQuery,
    onSearchChange,
    isLoading,
    onRefresh,
    pendingCount,
    isHidden,
}) => {
    const filteredListings = listings.filter(
        l =>
            !searchQuery ||
            l.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.tagline.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div
            className={`w-full md:w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0 ${
                isHidden ? 'hidden md:flex' : ''
            }`}
        >
            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <input
                        type="text"
                        placeholder="Search apps..."
                        value={searchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1">
                    {FILTER_OPTIONS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => onFilterChange(f.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                filterStatus === f.value
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {f.label}
                            {f.value === 'PENDING_REVIEW' && pendingCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Refresh button */}
            <div className="px-4 py-2 border-b border-gray-100">
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* Listings */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 text-cyan-500 mx-auto mb-3 animate-spin" />
                        <p className="text-gray-500 text-sm">Loading...</p>
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="text-center py-12">
                        <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No listings found</p>
                    </div>
                ) : (
                    filteredListings.map(listing => (
                        <button
                            key={listing.listing_id}
                            onClick={() => onSelectListing(listing)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                                selectedListing?.listing_id === listing.listing_id
                                    ? 'border-cyan-500 bg-cyan-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <img
                                    src={listing.icon_url}
                                    alt={listing.display_name}
                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                    onError={e => {
                                        (e.target as HTMLImageElement).src =
                                            'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                                    }}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-700 text-sm truncate">
                                            {listing.display_name}
                                        </h4>
                                        <StatusBadge status={listing.app_listing_status as AppListingStatus} />
                                    </div>

                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                        {listing.tagline}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export type { FilterStatus };
