import React, { useState } from 'react';
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
    ChevronRight,
    ChevronLeft,
    Pencil,
    Archive,
    Play,
    Sparkles,
    Rocket,
} from 'lucide-react';

import { useModal, ModalTypes } from 'learn-card-base';

import type { ExtendedAppStoreListing, AppListingStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { AppPreviewModal } from './AppPreviewModal';

type Tab = 'DRAFT' | 'PENDING_REVIEW' | 'LISTED' | 'ARCHIVED';

interface PartnerDashboardProps {
    listings: ExtendedAppStoreListing[];
    isLoading: boolean;
    onRefresh: () => void;
    onCreateNew: () => void;
    onEditListing: (listing: ExtendedAppStoreListing) => void;
    onSubmitForReview: (listingId: string) => Promise<void>;
    onDeleteListing: (listingId: string) => Promise<void>;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({
    listings,
    isLoading,
    onRefresh,
    onCreateNew,
    onEditListing,
    onSubmitForReview,
    onDeleteListing,
}) => {
    const { newModal } = useModal();
    const [activeTab, setActiveTab] = useState<Tab>('DRAFT');
    const [selectedListing, setSelectedListing] = useState<ExtendedAppStoreListing | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handlePreview = (listing: ExtendedAppStoreListing) => {
        newModal(
            <AppPreviewModal listing={listing} />,
            { hideButton: true },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const draftListings = listings.filter(l => l.app_listing_status === 'DRAFT');
    const pendingListings = listings.filter(l => l.app_listing_status === 'PENDING_REVIEW');
    const listedListings = listings.filter(l => l.app_listing_status === 'LISTED');
    const archivedListings = listings.filter(l => l.app_listing_status === 'ARCHIVED');

    const getFilteredListings = () => {
        switch (activeTab) {
            case 'DRAFT':
                return draftListings;
            case 'PENDING_REVIEW':
                return pendingListings;
            case 'LISTED':
                return listedListings;
            case 'ARCHIVED':
                return archivedListings;
            default:
                return [];
        }
    };

    const filteredListings = getFilteredListings();

    const handleSubmitForReview = async (listingId: string) => {
        setActionLoading(listingId);
        await onSubmitForReview(listingId);
        setSelectedListing(null);
        setActionLoading(null);
    };

    const handleDelete = async (listingId: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;

        setActionLoading(listingId);
        await onDeleteListing(listingId);
        setSelectedListing(null);
        setActionLoading(null);
    };

    const tabs = [
        { id: 'DRAFT' as Tab, label: 'Drafts', icon: FileEdit, count: draftListings.length },
        { id: 'PENDING_REVIEW' as Tab, label: 'Pending', icon: Clock, count: pendingListings.length },
        { id: 'LISTED' as Tab, label: 'Published', icon: CheckCircle2, count: listedListings.length },
        { id: 'ARCHIVED' as Tab, label: 'Rejected', icon: Archive, count: archivedListings.length },
    ];

    // Show welcome/onboarding view when no listings exist
    if (!isLoading && listings.length === 0) {
        const steps = [
            {
                number: 1,
                title: 'Create',
                description: 'Build your app listing with details, icon, screenshots, and integration settings.',
                icon: Sparkles,
                color: 'bg-violet-100 text-violet-600',
            },
            {
                number: 2,
                title: 'Submit',
                description: 'Submit your listing for review. Our team will verify it meets our guidelines.',
                icon: Send,
                color: 'bg-amber-100 text-amber-600',
            },
            {
                number: 3,
                title: 'Publish',
                description: 'Once approved, your app goes live in the App Store for users to discover.',
                icon: Rocket,
                color: 'bg-emerald-100 text-emerald-600',
            },
        ];

        return (
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
                    {steps.map((step, index) => (
                        <div
                            key={step.number}
                            className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                        >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${step.color}`}>
                                <step.icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Step {step.number}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-gray-800 mb-0.5">{step.title}</h3>

                                <p className="text-sm text-gray-500">{step.description}</p>
                            </div>

                            {index < steps.length - 1 && (
                                <div className="absolute left-[2.15rem] top-[4.5rem] w-px h-4 bg-gray-200" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        onClick={onCreateNew}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl text-base font-medium hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-200"
                    >
                        <Plus className="w-5 h-5" />
                        Create Your First Listing
                    </button>

                    <p className="text-xs text-gray-400 mt-4">
                        Free to publish • No coding required
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header with Create button */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-700">Your App Listings</h2>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={onCreateNew}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl text-sm font-medium hover:bg-cyan-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Listing
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 pb-px overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setSelectedListing(null);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'border-cyan-500 text-cyan-600'
                                : 'border-transparent text-gray-500 hover:text-gray-600'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />

                        {tab.label}

                        {tab.count > 0 && (
                            <span
                                className={`px-1.5 py-0.5 text-xs rounded-full ${
                                    activeTab === tab.id
                                        ? 'bg-cyan-100 text-cyan-600'
                                        : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Listings List - hidden on mobile when a listing is selected */}
                <div className={`space-y-2 ${selectedListing ? 'hidden lg:block' : ''}`}>
                    {isLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 text-cyan-500 mx-auto animate-spin" />

                            <p className="text-sm text-gray-500 mt-3">Loading listings...</p>
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 text-center py-12 px-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                {activeTab === 'DRAFT' && <FileEdit className="w-6 h-6 text-gray-400" />}
                                {activeTab === 'PENDING_REVIEW' && <Clock className="w-6 h-6 text-gray-400" />}
                                {activeTab === 'LISTED' && <CheckCircle2 className="w-6 h-6 text-gray-400" />}
                                {activeTab === 'ARCHIVED' && <Archive className="w-6 h-6 text-gray-400" />}
                            </div>

                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                                {activeTab === 'DRAFT' && 'No draft listings'}
                                {activeTab === 'PENDING_REVIEW' && 'No pending listings'}
                                {activeTab === 'LISTED' && 'No published listings'}
                                {activeTab === 'ARCHIVED' && 'No rejected listings'}
                            </h3>

                            <p className="text-xs text-gray-400">
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
                                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
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

                                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Detail Panel - full width on mobile when visible */}
                {selectedListing ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        {/* Mobile back button */}
                        <button
                            onClick={() => setSelectedListing(null)}
                            className="lg:hidden flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 -mt-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to listings
                        </button>
                        <div className="flex items-start gap-4 mb-5">
                            <img
                                src={selectedListing.icon_url}
                                alt={selectedListing.display_name}
                                className="w-14 h-14 rounded-xl object-cover"
                                onError={e => {
                                    (e.target as HTMLImageElement).src =
                                        'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                                }}
                            />

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="text-base font-semibold text-gray-700">
                                        {selectedListing.display_name}
                                    </h3>

                                    <StatusBadge status={selectedListing.app_listing_status as AppListingStatus} />
                                </div>

                                <p className="text-sm text-gray-500">{selectedListing.tagline}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-5">
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                    Description
                                </label>

                                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap line-clamp-4">
                                    {selectedListing.full_description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                        Launch Type
                                    </label>

                                    <p className="text-sm text-gray-600 mt-1">
                                        {selectedListing.launch_type.replace(/_/g, ' ')}
                                    </p>
                                </div>

                                {selectedListing.category && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Category
                                        </label>

                                        <p className="text-sm text-gray-600 mt-1">{selectedListing.category}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                    Listing ID
                                </label>

                                <p className="text-xs text-gray-500 mt-1 font-mono">
                                    {selectedListing.listing_id}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                            {selectedListing.app_listing_status === 'DRAFT' && (
                                <>
                                    <button
                                        onClick={() => onEditListing(selectedListing)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Edit Draft
                                    </button>

                                    <button
                                        onClick={() => handlePreview(selectedListing)}
                                        className="flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                                    >
                                        <Play className="w-4 h-4" />
                                        Preview
                                    </button>

                                    <button
                                        onClick={() => handleSubmitForReview(selectedListing.listing_id)}
                                        disabled={actionLoading === selectedListing.listing_id}
                                        className="flex items-center gap-2 px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === selectedListing.listing_id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Submit for Review
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(selectedListing.listing_id)}
                                        disabled={actionLoading === selectedListing.listing_id}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}

                            {selectedListing.app_listing_status === 'PENDING_REVIEW' && (
                                <>
                                    <button
                                        onClick={() => onEditListing(selectedListing)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handlePreview(selectedListing)}
                                        className="flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                                    >
                                        <Play className="w-4 h-4" />
                                        Preview
                                    </button>

                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg flex-1">
                                        <Clock className="w-4 h-4" />

                                        <span className="text-sm">Waiting for admin approval</span>
                                    </div>
                                </>
                            )}

                            {selectedListing.app_listing_status === 'LISTED' && (
                                <>
                                    <button
                                        onClick={() => handlePreview(selectedListing)}
                                        className="flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                                    >
                                        <Play className="w-4 h-4" />
                                        Preview
                                    </button>

                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg flex-1">
                                        <CheckCircle2 className="w-4 h-4" />

                                        <span className="text-sm">Your app is live in the App Store</span>
                                    </div>
                                </>
                            )}

                            {selectedListing.app_listing_status === 'ARCHIVED' && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg flex-1">
                                    <Archive className="w-4 h-4" />

                                    <span className="text-sm">
                                        This app was rejected. Contact an admin for revision.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:flex bg-white rounded-xl border border-gray-200 items-center justify-center text-center py-16">
                        <div>
                            <Eye className="w-10 h-10 text-gray-300 mx-auto mb-2" />

                            <p className="text-sm text-gray-500">Select a listing to view details</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
