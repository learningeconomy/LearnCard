/**
 * AppListingsTab - Manage App Store Listings
 * 
 * For embed-app integrations: create, edit, and manage app listings
 * that appear in the LearnCard app store.
 * 
 * Mirrors functionality from EmbedAppGuide's GettingStartedStep.
 */

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Layout,
    Check,
    Loader2,
    Edit3,
    Trash2,
    ExternalLink,
    Globe,
    Copy,
    Image as ImageIcon,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Link as LinkIcon,
    Eye,
    Settings,
} from 'lucide-react';
import type { LCNIntegration, AppStoreListing } from '@learncard/types';

import { useToast, ToastTypeEnum } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { useDeveloperPortal } from '../../useDeveloperPortal';

interface AppListingsTabProps {
    integration: LCNIntegration;
    onListingSelect?: (listing: AppStoreListing | null) => void;
    selectedListing?: AppStoreListing | null;
}

export const AppListingsTab: React.FC<AppListingsTabProps> = ({
    integration,
    onListingSelect,
    selectedListing: externalSelectedListing,
}) => {
    const { presentToast } = useToast();

    const { useListingsForIntegration, useCreateListing, useUpdateListing, useDeleteListing } = useDeveloperPortal();
    const { data: listings, isLoading, refetch } = useListingsForIntegration(integration.id);
    const createListingMutation = useCreateListing();
    const updateListingMutation = useUpdateListing();
    const deleteListingMutation = useDeleteListing();

    const [selectedListing, setSelectedListing] = useState<AppStoreListing | null>(externalSelectedListing || null);
    const [isCreating, setIsCreating] = useState(false);
    const [newListingName, setNewListingName] = useState('');
    const [editingListing, setEditingListing] = useState<AppStoreListing | null>(null);
    const [editForm, setEditForm] = useState({
        display_name: '',
        tagline: '',
        full_description: '',
        icon_url: '',
        launch_url: '',
    });
    const [copied, setCopied] = useState<string | null>(null);
    const [expandedListing, setExpandedListing] = useState<string | null>(null);

    // Sync external selection
    useEffect(() => {
        if (externalSelectedListing) {
            setSelectedListing(externalSelectedListing);
        }
    }, [externalSelectedListing]);

    // Auto-select first listing
    useEffect(() => {
        if (listings && listings.length > 0 && !selectedListing) {
            const first = listings[0];
            setSelectedListing(first);
            onListingSelect?.(first);
        }
    }, [listings, selectedListing, onListingSelect]);

    const handleCreateListing = async () => {
        if (!newListingName.trim()) return;

        try {
            await createListingMutation.mutateAsync({
                integrationId: integration.id,
                listing: {
                    display_name: newListingName.trim(),
                    tagline: `${newListingName.trim()} - An embedded LearnCard app`,
                    full_description: `${newListingName.trim()} is an embedded application that integrates with the LearnCard wallet.`,
                    icon_url: 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb',
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify({ url: '' }),
                },
            });

            await refetch();
            setNewListingName('');
            setIsCreating(false);
            presentToast('App listing created!', { type: ToastTypeEnum.Success, hasDismissButton: true });
        } catch (err) {
            console.error('Failed to create listing:', err);
            presentToast('Failed to create app listing', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const handleSelectListing = (listing: AppStoreListing) => {
        setSelectedListing(listing);
        onListingSelect?.(listing);
    };

    const handleStartEdit = (listing: AppStoreListing) => {
        let launchUrl = '';
        try {
            const config = JSON.parse(listing.launch_config_json || '{}');
            launchUrl = config.url || '';
        } catch (e) {
            // ignore
        }

        setEditForm({
            display_name: listing.display_name,
            tagline: listing.tagline || '',
            full_description: listing.full_description || '',
            icon_url: listing.icon_url || '',
            launch_url: launchUrl,
        });
        setEditingListing(listing);
    };

    const handleSaveEdit = async () => {
        if (!editingListing) return;

        try {
            await updateListingMutation.mutateAsync({
                listingId: editingListing.listing_id,
                updates: {
                    display_name: editForm.display_name,
                    tagline: editForm.tagline,
                    full_description: editForm.full_description,
                    icon_url: editForm.icon_url,
                    launch_config_json: JSON.stringify({ url: editForm.launch_url }),
                },
            });

            await refetch();
            setEditingListing(null);
            presentToast('App listing updated!', { type: ToastTypeEnum.Success, hasDismissButton: true });
        } catch (err) {
            console.error('Failed to update listing:', err);
            presentToast('Failed to update app listing', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const handleDeleteListing = async (listing: AppStoreListing) => {
        if (!confirm(`Delete "${listing.display_name}"? This cannot be undone.`)) return;

        try {
            await deleteListingMutation.mutateAsync(listing.listing_id);
            await refetch();

            if (selectedListing?.listing_id === listing.listing_id) {
                setSelectedListing(null);
                onListingSelect?.(null);
            }

            presentToast('App listing deleted', { type: ToastTypeEnum.Success, hasDismissButton: true });
        } catch (err) {
            console.error('Failed to delete listing:', err);
            presentToast('Failed to delete app listing', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const handleIconUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm(prev => ({ ...prev, icon_url: e.target.value }));
    };

    const handleCopy = async (value: string, id: string) => {
        await Clipboard.write({ string: value });
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
        presentToast('Copied!', { hasDismissButton: true });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'LISTED':
                return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Live</span>;
            case 'PENDING_REVIEW':
                return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">In Review</span>;
            default:
                return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Draft</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">App Listings</h2>
                    <p className="text-sm text-gray-500">Manage your apps in the LearnCard app store</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New App
                    </button>
                </div>
            </div>

            {/* Create New App Form */}
            {isCreating && (
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                        <input
                            type="text"
                            value={newListingName}
                            onChange={(e) => setNewListingName(e.target.value)}
                            placeholder="My Awesome App"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateListing();
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleCreateListing}
                            disabled={!newListingName.trim() || createListingMutation.isPending}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                        >
                            {createListingMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Create App
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => { setIsCreating(false); setNewListingName(''); }}
                            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && (!listings || listings.length === 0) && !isCreating && (
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
                    <Layout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-1">No apps yet</p>
                    <p className="text-sm text-gray-500 mb-4">Create your first app to get started</p>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create App
                    </button>
                </div>
            )}

            {/* App Listings */}
            {!isLoading && listings && listings.length > 0 && (
                <div className="space-y-3">
                    {listings.map((listing) => {
                        const isSelected = selectedListing?.listing_id === listing.listing_id;
                        const isExpanded = expandedListing === listing.listing_id;
                        const isEditing = editingListing?.listing_id === listing.listing_id;

                        let launchUrl = '';
                        try {
                            const config = JSON.parse(listing.launch_config_json || '{}');
                            launchUrl = config.url || '';
                        } catch (e) {
                            // ignore
                        }

                        return (
                            <div
                                key={listing.listing_id}
                                className={`border rounded-xl overflow-hidden transition-all ${
                                    isSelected ? 'border-cyan-500 bg-cyan-50/50' : 'border-gray-200 bg-white'
                                }`}
                            >
                                {/* Header */}
                                <div
                                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                                    onClick={() => handleSelectListing(listing)}
                                >
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
                                        isSelected ? 'bg-cyan-100' : 'bg-gray-100'
                                    }`}>
                                        {listing.icon_url ? (
                                            <img
                                                src={listing.icon_url}
                                                alt={listing.display_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Layout className={`w-6 h-6 ${isSelected ? 'text-cyan-600' : 'text-gray-400'}`} />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-semibold truncate ${isSelected ? 'text-cyan-700' : 'text-gray-800'}`}>
                                                {listing.display_name}
                                            </p>
                                            {getStatusBadge(listing.app_listing_status)}
                                        </div>

                                        <p className="text-sm text-gray-500 truncate">
                                            {listing.tagline || 'No tagline set'}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => setExpandedListing(isExpanded ? null : listing.listing_id)}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>

                                        <button
                                            onClick={() => handleStartEdit(listing)}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteListing(listing)}
                                            disabled={deleteListingMutation.isPending}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Selection Indicator */}
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-gray-300'
                                    }`}>
                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && !isEditing && (
                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Listing ID</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <code className="text-sm text-gray-700 font-mono truncate">{listing.listing_id}</code>
                                                    <button
                                                        onClick={() => handleCopy(listing.listing_id, 'listing-id')}
                                                        className="p-1 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {copied === 'listing-id' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Launch URL</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {launchUrl ? (
                                                        <>
                                                            <code className="text-sm text-gray-700 font-mono truncate">{launchUrl}</code>
                                                            <a
                                                                href={launchUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1 text-gray-400 hover:text-gray-600"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-amber-600">Not configured</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {listing.full_description && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Description</label>
                                                <p className="text-sm text-gray-600 mt-1">{listing.full_description}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Edit Form */}
                                {isEditing && (
                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                                                <input
                                                    type="text"
                                                    value={editForm.display_name}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                                                <input
                                                    type="text"
                                                    value={editForm.tagline}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, tagline: e.target.value }))}
                                                    placeholder="A short description..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Launch URL</label>
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-gray-400" />
                                                <input
                                                    type="url"
                                                    value={editForm.launch_url}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, launch_url: e.target.value }))}
                                                    placeholder="https://your-app.com"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">The URL of your app that will be embedded in LearnCard</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                value={editForm.full_description}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, full_description: e.target.value }))}
                                                rows={3}
                                                placeholder="Tell users what your app does..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">App Icon URL</label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {editForm.icon_url ? (
                                                        <img src={editForm.icon_url} alt="Icon" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>

                                                <input
                                                    type="url"
                                                    value={editForm.icon_url}
                                                    onChange={handleIconUrlChange}
                                                    placeholder="https://example.com/icon.png"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                onClick={() => setEditingListing(null)}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                onClick={handleSaveEdit}
                                                disabled={updateListingMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                                            >
                                                {updateListingMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info Banner */}
            {selectedListing && (
                <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <Layout className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-violet-800">Selected: {selectedListing.display_name}</p>
                            <p className="text-sm text-violet-700 mt-0.5">
                                Use the Partner Connect tab to get integration code for this app.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
