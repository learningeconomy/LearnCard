import React, { useEffect, useState } from 'react';
import { 
    FileEdit, 
    Clock, 
    CheckCircle2, 
    Plus, 
    Loader2, 
    RefreshCw,
    Eye,
    Trash2,
    Send,
    AlertCircle,
    ChevronRight,
    Pencil,
    Archive
} from 'lucide-react';
import { useLearnCardStore } from '../../stores/learncard';
import type { AppStoreListing } from '@learncard/types';
import { StatusBadge } from '../ui/StatusBadge';

type Tab = 'DRAFT' | 'PENDING_REVIEW' | 'LISTED' | 'ARCHIVED';

interface PartnerDashboardProps {
    onCreateNew: () => void;
    onEditListing: (listing: AppStoreListing) => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ onCreateNew, onEditListing }) => {
    const {
        learnCard,
        selectedIntegrationId,
        listings,
        isLoadingListings,
        loadListingsForIntegration,
        submitForReview,
        deleteListing,
    } = useLearnCardStore();

    const [activeTab, setActiveTab] = useState<Tab>('DRAFT');
    const [selectedListing, setSelectedListing] = useState<AppStoreListing | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (learnCard && selectedIntegrationId) {
            loadListingsForIntegration(selectedIntegrationId);
        }
    }, [learnCard, selectedIntegrationId]);

    const draftListings = listings.filter(l => l.app_listing_status === 'DRAFT');
    const pendingListings = listings.filter(l => l.app_listing_status === 'PENDING_REVIEW');
    const listedListings = listings.filter(l => l.app_listing_status === 'LISTED');
    const archivedListings = listings.filter(l => l.app_listing_status === 'ARCHIVED');

    const getFilteredListings = () => {
        switch (activeTab) {
            case 'DRAFT': return draftListings;
            case 'PENDING_REVIEW': return pendingListings;
            case 'LISTED': return listedListings;
            case 'ARCHIVED': return archivedListings;
            default: return [];
        }
    };

    const filteredListings = getFilteredListings();

    const handleSubmitForReview = async (listingId: string) => {
        setActionLoading(listingId);

        const success = await submitForReview(listingId);

        if (success) {
            setSelectedListing(null);
        }

        setActionLoading(null);
    };

    const handleDelete = async (listingId: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;

        setActionLoading(listingId);

        const success = await deleteListing(listingId);

        if (success) {
            setSelectedListing(null);
        }

        setActionLoading(null);
    };

    const handleRefresh = () => {
        if (selectedIntegrationId) {
            loadListingsForIntegration(selectedIntegrationId);
        }
    };

    const tabs = [
        { id: 'DRAFT' as Tab, label: 'Drafts', icon: FileEdit, count: draftListings.length },
        { id: 'PENDING_REVIEW' as Tab, label: 'Pending Review', icon: Clock, count: pendingListings.length },
        { id: 'LISTED' as Tab, label: 'Published', icon: CheckCircle2, count: listedListings.length },
        { id: 'ARCHIVED' as Tab, label: 'Rejected', icon: Archive, count: archivedListings.length },
    ];

    if (!selectedIntegrationId) {
        return (
            <div className="card-elevated text-center py-12">
                <AlertCircle className="w-12 h-12 text-apple-gray-300 mx-auto mb-4" />

                <h3 className="text-lg font-medium text-apple-gray-500 mb-2">
                    Select an Integration
                </h3>

                <p className="text-sm text-apple-gray-400">
                    Choose or create an integration above to view your listings
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Create button */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-apple-gray-600">Your App Listings</h2>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isLoadingListings}
                        className="btn-ghost"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoadingListings ? 'animate-spin' : ''}`} />
                    </button>

                    <button onClick={onCreateNew} className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        New Listing
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-apple-gray-200 pb-px">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setSelectedListing(null);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-apple-blue text-apple-blue'
                                : 'border-transparent text-apple-gray-500 hover:text-apple-gray-600'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />

                        {tab.label}

                        {tab.count > 0 && (
                            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                                activeTab === tab.id
                                    ? 'bg-apple-blue/10 text-apple-blue'
                                    : 'bg-apple-gray-100 text-apple-gray-500'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Listings List */}
                <div className="space-y-3">
                    {isLoadingListings ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 text-apple-blue mx-auto animate-spin" />

                            <p className="text-sm text-apple-gray-500 mt-3">Loading listings...</p>
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <div className="card-elevated text-center py-12">
                            <div className="w-12 h-12 bg-apple-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                {activeTab === 'DRAFT' && <FileEdit className="w-6 h-6 text-apple-gray-400" />}
                                {activeTab === 'PENDING_REVIEW' && <Clock className="w-6 h-6 text-apple-gray-400" />}
                                {activeTab === 'LISTED' && <CheckCircle2 className="w-6 h-6 text-apple-gray-400" />}
                                {activeTab === 'ARCHIVED' && <Archive className="w-6 h-6 text-apple-gray-400" />}
                            </div>

                            <h3 className="text-sm font-medium text-apple-gray-500 mb-1">
                                {activeTab === 'DRAFT' && 'No draft listings'}
                                {activeTab === 'PENDING_REVIEW' && 'No pending listings'}
                                {activeTab === 'LISTED' && 'No published listings'}
                                {activeTab === 'ARCHIVED' && 'No rejected listings'}
                            </h3>

                            <p className="text-xs text-apple-gray-400">
                                {activeTab === 'DRAFT' && 'Create a new listing to get started'}
                                {activeTab === 'PENDING_REVIEW' && 'Submit drafts for review to see them here'}
                                {activeTab === 'LISTED' && 'Your approved apps will appear here'}
                                {activeTab === 'ARCHIVED' && 'Rejected apps will appear here for review'}
                            </p>
                        </div>
                    ) : (
                        filteredListings.map(listing => (
                            <button
                                key={listing.listing_id}
                                onClick={() => setSelectedListing(listing)}
                                className={`w-full text-left p-4 rounded-apple-lg border transition-all ${
                                    selectedListing?.listing_id === listing.listing_id
                                        ? 'border-apple-blue bg-apple-blue/5 shadow-apple-sm'
                                        : 'border-apple-gray-200 bg-white hover:border-apple-gray-300'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <img
                                        src={listing.icon_url}
                                        alt={listing.display_name}
                                        className="w-12 h-12 rounded-apple object-cover flex-shrink-0"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-apple-gray-600 truncate">
                                                {listing.display_name}
                                            </h4>

                                            <StatusBadge status={listing.app_listing_status} />
                                        </div>

                                        <p className="text-sm text-apple-gray-400 truncate mt-0.5">
                                            {listing.tagline}
                                        </p>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-apple-gray-300 flex-shrink-0" />
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Detail Panel */}
                {selectedListing ? (
                    <div className="card-elevated">
                        <div className="flex items-start gap-4 mb-6">
                            <img
                                src={selectedListing.icon_url}
                                alt={selectedListing.display_name}
                                className="w-16 h-16 rounded-apple-lg object-cover"
                            />

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold text-apple-gray-600">
                                        {selectedListing.display_name}
                                    </h3>

                                    <StatusBadge status={selectedListing.app_listing_status} />
                                </div>

                                <p className="text-sm text-apple-gray-500">
                                    {selectedListing.tagline}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-medium text-apple-gray-400 uppercase tracking-wide">
                                    Description
                                </label>

                                <p className="text-sm text-apple-gray-600 mt-1 whitespace-pre-wrap">
                                    {selectedListing.full_description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-apple-gray-400 uppercase tracking-wide">
                                        Launch Type
                                    </label>

                                    <p className="text-sm text-apple-gray-600 mt-1">
                                        {selectedListing.launch_type.replace(/_/g, ' ')}
                                    </p>
                                </div>

                                {selectedListing.category && (
                                    <div>
                                        <label className="text-xs font-medium text-apple-gray-400 uppercase tracking-wide">
                                            Category
                                        </label>

                                        <p className="text-sm text-apple-gray-600 mt-1">
                                            {selectedListing.category}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-medium text-apple-gray-400 uppercase tracking-wide">
                                    Listing ID
                                </label>

                                <p className="text-xs text-apple-gray-500 mt-1 font-mono">
                                    {selectedListing.listing_id}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-apple-gray-100">
                            {selectedListing.app_listing_status === 'DRAFT' && (
                                <>
                                    <button
                                        onClick={() => onEditListing(selectedListing)}
                                        className="btn-secondary flex-1"
                                    >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Edit Draft
                                    </button>

                                    <button
                                        onClick={() => handleSubmitForReview(selectedListing.listing_id)}
                                        disabled={actionLoading === selectedListing.listing_id}
                                        className="btn-primary flex-1"
                                    >
                                        {actionLoading === selectedListing.listing_id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Submit for Review
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(selectedListing.listing_id)}
                                        disabled={actionLoading === selectedListing.listing_id}
                                        className="btn-ghost text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}

                            {selectedListing.app_listing_status === 'PENDING_REVIEW' && (
                                <>
                                    <button
                                        onClick={() => onEditListing(selectedListing)}
                                        className="btn-secondary"
                                    >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Edit
                                    </button>

                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-apple flex-1">
                                        <Clock className="w-4 h-4" />

                                        <span className="text-sm">Waiting for admin approval</span>
                                    </div>
                                </>
                            )}

                            {selectedListing.app_listing_status === 'LISTED' && (
                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-apple flex-1">
                                    <CheckCircle2 className="w-4 h-4" />

                                    <span className="text-sm">Your app is live in the App Store</span>
                                </div>
                            )}

                            {selectedListing.app_listing_status === 'ARCHIVED' && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-apple flex-1">
                                    <Archive className="w-4 h-4" />

                                    <span className="text-sm">
                                        This app was rejected. An admin can send it back to drafts for revision.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card-elevated flex items-center justify-center text-center py-16">
                        <div>
                            <Eye className="w-12 h-12 text-apple-gray-300 mx-auto mb-3" />

                            <p className="text-sm text-apple-gray-500">
                                Select a listing to view details
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
