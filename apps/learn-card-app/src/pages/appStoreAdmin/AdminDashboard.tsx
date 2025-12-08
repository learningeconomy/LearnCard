import React, { useState } from 'react';
import { IonPage, IonContent, IonSpinner, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle } from '@ionic/react';
import { Search, Filter, Inbox, Loader2, RefreshCw, ExternalLink, ShieldAlert, CheckCircle, XCircle, Star, TrendingUp, Minus, ArrowDown, RotateCcw, Check, Image, Play, BookOpen, PenTool, Eye, ChevronLeft } from 'lucide-react';

import { useModal, ModalTypes, useWallet, contractCategoryNameToCategoryMetadata } from 'learn-card-base';
import { useQuery } from '@tanstack/react-query';

import { useDeveloperPortal } from '../appStoreDeveloper/useDeveloperPortal';
import { StatusBadge } from '../appStoreDeveloper/components/StatusBadge';
import { AppStoreHeader } from '../appStoreDeveloper/components/AppStoreHeader';
import { AppPreviewModal } from '../appStoreDeveloper/components/AppPreviewModal';
import FullScreenConsentFlow from '../consentFlow/FullScreenConsentFlow';
import FullScreenGameFlow from '../consentFlow/GameFlow/FullScreenGameFlow';
import { LAUNCH_TYPE_INFO, CATEGORY_OPTIONS, PERMISSION_OPTIONS, PROMOTION_LEVEL_INFO, type AppListingStatus, type PromotionLevel, type ExtendedAppStoreListing, type AppPermission } from '../appStoreDeveloper/types';
import type { ConsentFlowContractDetails } from '@learncard/types';

type FilterStatus = AppListingStatus | 'ALL';

const AdminDashboard: React.FC = () => {
    const { useIsAdmin, useAdminListings, useAdminUpdateStatus, useAdminUpdatePromotion } = useDeveloperPortal();
    const { data: isAdmin, isLoading: isCheckingAdmin } = useIsAdmin();
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDING_REVIEW');
    const [searchQuery, setSearchQuery] = useState('');
    const { data: listings, isLoading: isLoadingListings, refetch: refetchListings } = useAdminListings(filterStatus === 'ALL' ? undefined : (filterStatus as AppListingStatus));
    const updateStatusMutation = useAdminUpdateStatus();
    const updatePromotionMutation = useAdminUpdatePromotion();
    const [selectedListing, setSelectedListing] = useState<ExtendedAppStoreListing | null>(null);

    const filteredListings = (listings || []).filter(l => !searchQuery || l.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || l.tagline.toLowerCase().includes(searchQuery.toLowerCase())) as ExtendedAppStoreListing[];
    const pendingCount = (listings || []).filter(l => l.app_listing_status === 'PENDING_REVIEW').length;

    const handleStatusChange = async (listingId: string, status: AppListingStatus) => {
        await updateStatusMutation.mutateAsync({ listingId, status });
        if (selectedListing?.listing_id === listingId) setSelectedListing(prev => prev ? { ...prev, app_listing_status: status } : null);
    };

    const handlePromotionChange = async (listingId: string, level: PromotionLevel) => {
        await updatePromotionMutation.mutateAsync({ listingId, level });
        if (selectedListing?.listing_id === listingId) setSelectedListing(prev => prev ? { ...prev, promotion_level: level } : null);
    };

    if (isCheckingAdmin) return <IonPage><IonContent className="ion-padding"><div className="flex justify-center items-center h-full"><IonSpinner name="crescent" /></div></IonContent></IonPage>;

    if (!isAdmin) return (
        <IonPage>
            <AppStoreHeader title="Admin Dashboard" />
            <IonContent className="ion-padding">
                <div className="max-w-md mx-auto text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldAlert className="w-8 h-8 text-red-500" /></div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
                    <p className="text-gray-500">You don't have admin permissions.</p>
                </div>
            </IonContent>
        </IonPage>
    );

    return (
        <IonPage>
            <AppStoreHeader title="Admin Dashboard" />
            <IonContent>
                <div className="flex h-full">
                    {/* Sidebar - hidden on mobile when a listing is selected */}
                    <div className={`w-full md:w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0 ${selectedListing ? 'hidden md:flex' : ''}`}>
                        <div className="p-4 border-b border-gray-200 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" placeholder="Search apps..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div className="flex gap-1 overflow-x-auto pb-1">
                                {([{ value: 'PENDING_REVIEW', label: 'Pending' }, { value: 'ALL', label: 'All' }, { value: 'LISTED', label: 'Listed' }, { value: 'DRAFT', label: 'Draft' }, { value: 'ARCHIVED', label: 'Archived' }] as { value: FilterStatus; label: string }[]).map(f => (
                                    <button key={f.value} onClick={() => setFilterStatus(f.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === f.value ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                        {f.label}{f.value === 'PENDING_REVIEW' && pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full">{pendingCount}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="px-4 py-2 border-b border-gray-100">
                            <button onClick={() => refetchListings()} disabled={isLoadingListings} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600 transition-colors">
                                <RefreshCw className={`w-4 h-4 ${isLoadingListings ? 'animate-spin' : ''}`} />{isLoadingListings ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {isLoadingListings ? (
                                <div className="text-center py-12"><Loader2 className="w-8 h-8 text-cyan-500 mx-auto mb-3 animate-spin" /><p className="text-gray-500 text-sm">Loading...</p></div>
                            ) : filteredListings.length === 0 ? (
                                <div className="text-center py-12"><Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No listings found</p></div>
                            ) : (
                                filteredListings.map(listing => (
                                    <button key={listing.listing_id} onClick={() => setSelectedListing(listing)} className={`w-full text-left p-3 rounded-xl border transition-all ${selectedListing?.listing_id === listing.listing_id ? 'border-cyan-500 bg-cyan-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                        <div className="flex items-start gap-3">
                                            <img src={listing.icon_url} alt={listing.display_name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).src = 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb'; }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2"><h4 className="font-medium text-gray-700 text-sm truncate">{listing.display_name}</h4><StatusBadge status={listing.app_listing_status as AppListingStatus} /></div>
                                                <p className="text-xs text-gray-400 truncate mt-0.5">{listing.tagline}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                    {/* Detail panel - full width on mobile */}
                    <div className={`flex-1 bg-gray-50 ${!selectedListing ? 'hidden md:block' : ''}`}>
                        {selectedListing ? (
                            <ListingDetail listing={selectedListing} onStatusChange={handleStatusChange} onPromotionChange={handlePromotionChange} isUpdating={updateStatusMutation.isPending || updatePromotionMutation.isPending} onBack={() => setSelectedListing(null)} />
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center"><Filter className="w-14 h-14 text-gray-300 mx-auto mb-3" /><h3 className="text-base font-medium text-gray-500 mb-1">Select an app to review</h3><p className="text-sm text-gray-400">Choose a listing from the sidebar</p></div>
                            </div>
                        )}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

interface ListingDetailProps {
    listing: ExtendedAppStoreListing;
    onStatusChange: (listingId: string, status: AppListingStatus) => Promise<void>;
    onPromotionChange: (listingId: string, level: PromotionLevel) => Promise<void>;
    isUpdating: boolean;
    onBack: () => void;
}

const ListingDetail: React.FC<ListingDetailProps> = ({ listing, onStatusChange, onPromotionChange, isUpdating, onBack }) => {
    const { newModal } = useModal();
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isUnarchiving, setIsUnarchiving] = useState(false);
    const [isUnlisting, setIsUnlisting] = useState(false);
    const [showPromotionMenu, setShowPromotionMenu] = useState(false);

    const launchTypeInfo = LAUNCH_TYPE_INFO[listing.launch_type];
    const categoryLabel = CATEGORY_OPTIONS.find(c => c.value === listing.category)?.label;
    let parsedConfig: Record<string, unknown> = {};
    try { parsedConfig = JSON.parse(listing.launch_config_json); } catch {}
    const permissions = Array.isArray(parsedConfig.permissions) ? (parsedConfig.permissions as AppPermission[]) : [];

    // Consent flow contract handling - fetch the specific contract by URI
    const contractUri = typeof parsedConfig.contractUri === 'string' ? parsedConfig.contractUri : null;
    const { initWallet } = useWallet();

    const { data: selectedContract, isLoading: isLoadingContract } = useQuery<ConsentFlowContractDetails | null>({
        queryKey: ['getContract', contractUri],
        queryFn: async () => {
            if (!contractUri) return null;
            try {
                const wallet = await initWallet();
                return await wallet.invoke.getContract(contractUri);
            } catch (error) {
                console.error('Failed to fetch contract:', error);
                return null;
            }
        },
        enabled: !!contractUri,
    });

    const readCategories = selectedContract?.contract?.read?.credentials?.categories || {};
    const writeCategories = selectedContract?.contract?.write?.credentials?.categories || {};
    const hasReadCategories = Object.keys(readCategories).length > 0;
    const hasWriteCategories = Object.keys(writeCategories).length > 0;

    const handlePreviewContract = () => {
        if (!selectedContract) return;
        if (selectedContract.needsGuardianConsent) {
            newModal(<FullScreenGameFlow contractDetails={selectedContract} isPreview />, {}, { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen });
        } else {
            newModal(<FullScreenConsentFlow contractDetails={selectedContract} isPreview />, {}, { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen });
        }
    };

    const handlePreview = () => {
        newModal(
            <AppPreviewModal listing={listing} />,
            { hideButton: true },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const handleApprove = async () => { setIsApproving(true); await onStatusChange(listing.listing_id, 'LISTED'); setIsApproving(false); };
    const handleReject = async () => { setIsRejecting(true); await onStatusChange(listing.listing_id, 'ARCHIVED'); setIsRejecting(false); };
    const handleUnarchive = async () => { setIsUnarchiving(true); await onStatusChange(listing.listing_id, 'DRAFT'); setIsUnarchiving(false); };
    const handleUnlist = async () => { setIsUnlisting(true); await onStatusChange(listing.listing_id, 'ARCHIVED'); setIsUnlisting(false); };

    const promotionIcons: Record<PromotionLevel, React.FC<{ className?: string }>> = { FEATURED_CAROUSEL: Star, CURATED_LIST: TrendingUp, STANDARD: Minus, DEMOTED: ArrowDown };

    return (
        <div className="h-full flex flex-col">
            <div className="p-5 border-b border-gray-200 bg-white">
                {/* Mobile back button */}
                <button onClick={onBack} className="md:hidden flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
                    <ChevronLeft className="w-4 h-4" />
                    Back to listings
                </button>

                <div className="flex items-start gap-3">
                    <img src={listing.icon_url} alt={listing.display_name} className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).src = 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb'; }} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-semibold text-gray-700 leading-tight">{listing.display_name}</h2>
                                <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{listing.tagline}</p>
                            </div>
                            <button onClick={handlePreview} className="flex-shrink-0 flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs md:text-sm font-medium hover:bg-indigo-200 transition-colors">
                                <Play className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="hidden sm:inline">Preview</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {categoryLabel && <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-500">{categoryLabel}</span>}
                            <span className="px-1.5 py-0.5 bg-cyan-100 rounded text-xs font-medium text-cyan-700">{launchTypeInfo?.label}</span>
                            <StatusBadge status={listing.app_listing_status as AppListingStatus} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div><h3 className="text-sm font-medium text-gray-600 mb-1">Description</h3><p className="text-sm text-gray-500 whitespace-pre-wrap">{listing.full_description}</p></div>
                {listing.highlights && listing.highlights.length > 0 && <div><h3 className="text-sm font-medium text-gray-600 mb-2">Highlights</h3><ul className="space-y-1.5">{listing.highlights.map((h, i) => <li key={i} className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /><span className="text-sm text-gray-500">{h}</span></li>)}</ul></div>}
                {listing.screenshots && listing.screenshots.length > 0 && <div><div className="flex items-center gap-2 mb-2"><Image className="w-4 h-4 text-gray-400" /><h3 className="text-sm font-medium text-gray-600">Screenshots ({listing.screenshots.length})</h3></div><div className="flex gap-2 overflow-x-auto pb-2">{listing.screenshots.map((s, i) => <a key={i} href={s} target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src={s} alt={`Screenshot ${i + 1}`} className="h-40 w-auto rounded-lg border border-gray-200 hover:border-cyan-500 transition-colors" /></a>)}</div></div>}
                <div>
                    <div className="flex items-center gap-2 mb-2"><ShieldAlert className="w-4 h-4 text-amber-500" /><h3 className="text-sm font-medium text-gray-600">Launch Configuration</h3></div>
                    <pre className="p-3 bg-gray-800 text-gray-100 rounded-lg text-xs overflow-x-auto"><code>{JSON.stringify(parsedConfig, null, 2)}</code></pre>
                    {listing.launch_type === 'EMBEDDED_IFRAME' && permissions.length > 0 && <div className="mt-2"><h4 className="text-xs font-medium text-gray-500 mb-1.5">Requested Permissions</h4><div className="flex flex-wrap gap-1.5">{permissions.map(p => { const info = PERMISSION_OPTIONS.find(o => o.value === p); return <span key={p} className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium" title={info?.description}>{info?.label || p}</span>; })}</div></div>}
                </div>
                {listing.launch_type === 'CONSENT_REDIRECT' && contractUri && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-600">Consent Flow Contract</h3>
                            {selectedContract && (
                                <button onClick={handlePreviewContract} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg text-xs font-medium hover:bg-cyan-200 transition-colors">
                                    <Eye className="w-3.5 h-3.5" />Preview Contract
                                </button>
                            )}
                        </div>
                        {isLoadingContract ? (
                            <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                <span className="text-sm text-gray-500">Loading contract...</span>
                            </div>
                        ) : selectedContract ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                    {selectedContract.image ? (
                                        <img src={selectedContract.image} alt={selectedContract.name} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-cyan-600" /></div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{selectedContract.name}</p>
                                        {selectedContract.subtitle && <p className="text-xs text-gray-400">{selectedContract.subtitle}</p>}
                                    </div>
                                </div>
                                <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BookOpen className="w-4 h-4 text-cyan-600" />
                                        <span className="text-xs font-medium text-cyan-700">Read Access</span>
                                    </div>
                                    {hasReadCategories ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.keys(readCategories).map(category => {
                                                const metadata = contractCategoryNameToCategoryMetadata(category);
                                                return (
                                                    <span key={category} className="inline-flex items-center gap-1 px-2 py-1 bg-white text-cyan-700 rounded-full text-xs font-medium border border-cyan-200">
                                                        {metadata?.IconWithShape && <metadata.IconWithShape className="w-3.5 h-3.5" />}
                                                        {metadata?.title || category}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-cyan-600 italic">No read permissions requested</p>
                                    )}
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <PenTool className="w-4 h-4 text-emerald-600" />
                                        <span className="text-xs font-medium text-emerald-700">Write Access</span>
                                    </div>
                                    {hasWriteCategories ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.keys(writeCategories).map(category => {
                                                const metadata = contractCategoryNameToCategoryMetadata(category);
                                                return (
                                                    <span key={category} className="inline-flex items-center gap-1 px-2 py-1 bg-white text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                                                        {metadata?.IconWithShape && <metadata.IconWithShape className="w-3.5 h-3.5" />}
                                                        {metadata?.title || category}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-emerald-600 italic">No write permissions requested</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <p className="text-xs text-gray-500 font-mono break-all">{contractUri}</p>
                                <p className="text-xs text-gray-400 mt-1 italic">Contract details not available</p>
                            </div>
                        )}
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">External Links</h3>
                    <div className="space-y-1.5">
                        {typeof parsedConfig.url === 'string' && parsedConfig.url && <a href={parsedConfig.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"><ExternalLink className="w-4 h-4" />Application URL</a>}
                        {listing.promo_video_url && <a href={listing.promo_video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"><ExternalLink className="w-4 h-4" />Promo Video</a>}
                        {listing.privacy_policy_url && <a href={listing.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"><ExternalLink className="w-4 h-4" />Privacy Policy</a>}
                        {listing.terms_url && <a href={listing.terms_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"><ExternalLink className="w-4 h-4" />Terms of Service</a>}
                    </div>
                </div>
                {(listing.ios_app_store_id || listing.android_app_store_id) && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Native App Links</h3>
                        <div className="space-y-1.5">
                            {listing.ios_app_store_id && <a href={`https://apps.apple.com/us/app/id${listing.ios_app_store_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"><ExternalLink className="w-4 h-4" />iOS App Store ({listing.ios_app_store_id})</a>}
                            {listing.android_app_store_id && <a href={`https://play.google.com/store/apps/details?id=${listing.android_app_store_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"><ExternalLink className="w-4 h-4" />Google Play Store ({listing.android_app_store_id})</a>}
                        </div>
                    </div>
                )}
                {listing.app_listing_status === 'LISTED' && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Promotion Level</h3>
                        <div className="relative">
                            <button onClick={() => setShowPromotionMenu(!showPromotionMenu)} className="w-full p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors">
                                <span className="text-sm text-gray-600">{listing.promotion_level ? PROMOTION_LEVEL_INFO[listing.promotion_level as PromotionLevel].label : 'Standard'}</span>
                                <ArrowDown className="w-4 h-4 text-gray-400" />
                            </button>
                            {showPromotionMenu && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                    {(Object.entries(PROMOTION_LEVEL_INFO) as [PromotionLevel, typeof PROMOTION_LEVEL_INFO[PromotionLevel]][]).map(([level, info]) => {
                                        const Icon = promotionIcons[level];
                                        return (
                                            <button key={level} onClick={() => { onPromotionChange(listing.listing_id, level); setShowPromotionMenu(false); }} className={`w-full p-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${listing.promotion_level === level ? 'bg-cyan-50' : ''}`}>
                                                <Icon className="w-4 h-4 text-gray-400" />
                                                <div><p className="text-sm font-medium text-gray-600">{info.label}</p><p className="text-xs text-gray-400">{info.description}</p></div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {listing.app_listing_status === 'LISTED' && (
                <div className="p-5 border-t border-gray-200 bg-gray-50">
                    <button onClick={handleUnlist} disabled={isUnlisting || isUpdating} className="w-full py-2.5 px-4 rounded-xl border-2 border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {isUnlisting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}Unlist App
                    </button>
                </div>
            )}
            {listing.app_listing_status === 'PENDING_REVIEW' && (
                <div className="p-3 sm:p-5 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button onClick={handleReject} disabled={isRejecting || isApproving || isUpdating} className="flex-1 py-2.5 px-4 rounded-xl border-2 border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}Reject
                        </button>
                        <button onClick={handleApprove} disabled={isApproving || isRejecting || isUpdating} className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Approve
                        </button>
                    </div>
                </div>
            )}
            {listing.app_listing_status === 'ARCHIVED' && (
                <div className="p-5 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-500 text-center mb-3">This listing was rejected. Send it back as a draft for revision.</p>
                    <button onClick={handleUnarchive} disabled={isUnarchiving || isUpdating} className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {isUnarchiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}Send Back to Draft
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
