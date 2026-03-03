import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
    ExternalLink,
    ShieldAlert,
    Check,
    Image,
    Eye,
    ChevronLeft,
    ChevronDown,
    Monitor,
    Layout,
    Play,
} from 'lucide-react';

import { useModal, ModalTypes } from 'learn-card-base';

import { StatusBadge } from '../../appStoreDeveloper/components/StatusBadge';
import { AppPreviewModal } from '../../appStoreDeveloper/components/AppPreviewModal';
import AppStoreDetailModal from '../../launchPad/AppStoreDetailModal';
import {
    LAUNCH_TYPE_INFO,
    CATEGORY_OPTIONS,
    PERMISSION_OPTIONS,
    type AppListingStatus,
    type PromotionLevel,
    type ExtendedAppStoreListing,
    type AppPermission,
} from '../../appStoreDeveloper/types';

import { ListingActions } from './ListingActions';
import { PromotionMenu } from './PromotionMenu';
import { ConsentContractPreview } from './ConsentContractPreview';

interface ListingDetailProps {
    listing: ExtendedAppStoreListing;
    onStatusChange: (listingId: string, status: AppListingStatus) => Promise<void>;
    onPromotionChange: (listingId: string, level: PromotionLevel) => Promise<void>;
    isUpdating: boolean;
    onBack: () => void;
}

export const ListingDetail: React.FC<ListingDetailProps> = ({
    listing,
    onStatusChange,
    onPromotionChange,
    isUpdating,
    onBack,
}) => {
    const { newModal } = useModal();
    const history = useHistory();
    const [showPreviewMenu, setShowPreviewMenu] = useState(false);

    const launchTypeInfo = LAUNCH_TYPE_INFO[listing.launch_type];
    const categoryLabel = CATEGORY_OPTIONS.find(c => c.value === listing.category)?.label;

    let parsedConfig: Record<string, unknown> = {};
    try {
        parsedConfig = JSON.parse(listing.launch_config_json);
    } catch {}

    const permissions = Array.isArray(parsedConfig.permissions)
        ? (parsedConfig.permissions as AppPermission[])
        : [];

    const contractUri =
        typeof parsedConfig.contractUri === 'string' ? parsedConfig.contractUri : null;

    // Preview handlers
    const handlePreviewModal = () => {
        setShowPreviewMenu(false);
        newModal(
            <AppStoreDetailModal listing={listing} isPreview />,
            { hideButton: true },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handlePreviewPage = () => {
        setShowPreviewMenu(false);
        history.push({
            pathname: `/app/${listing.listing_id}`,
            state: { listing, isPreview: true },
        });
    };

    const handlePreviewDeveloper = () => {
        setShowPreviewMenu(false);
        newModal(
            <AppPreviewModal listing={listing} />,
            { hideButton: true },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 bg-white">
                {/* Mobile back button */}
                <button
                    onClick={onBack}
                    className="md:hidden flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to listings
                </button>

                <div className="flex items-start gap-3">
                    <img
                        src={listing.icon_url}
                        alt={listing.display_name}
                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0"
                        onError={e => {
                            (e.target as HTMLImageElement).src =
                                'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                        }}
                    />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-semibold text-gray-700 leading-tight">
                                    {listing.display_name}
                                </h2>
                                <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                                    {listing.tagline}
                                </p>
                            </div>

                            {/* Preview Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowPreviewMenu(!showPreviewMenu)}
                                    className="flex-shrink-0 flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs md:text-sm font-medium hover:bg-indigo-200 transition-colors"
                                >
                                    <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="hidden sm:inline">Preview</span>
                                    <ChevronDown className="w-3 h-3" />
                                </button>

                                {showPreviewMenu && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                        <button
                                            onClick={handlePreviewModal}
                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Layout className="w-4 h-4 text-gray-400" />
                                            Preview Modal
                                        </button>

                                        <button
                                            onClick={handlePreviewPage}
                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Monitor className="w-4 h-4 text-gray-400" />
                                            Preview Page
                                        </button>

                                        {listing.launch_type === 'EMBEDDED_IFRAME' && (
                                            <button
                                                onClick={handlePreviewDeveloper}
                                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                                            >
                                                <Play className="w-4 h-4 text-gray-400" />
                                                Test Embed
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {categoryLabel && (
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-500">
                                    {categoryLabel}
                                </span>
                            )}
                            <span className="px-1.5 py-0.5 bg-cyan-100 rounded text-xs font-medium text-cyan-700">
                                {launchTypeInfo?.label}
                            </span>
                            <StatusBadge status={listing.app_listing_status as AppListingStatus} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Description */}
                <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Description</h3>
                    <p className="text-sm text-gray-500 whitespace-pre-wrap">
                        {listing.full_description}
                    </p>
                </div>

                {/* Highlights */}
                {listing.highlights && listing.highlights.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Highlights</h3>
                        <ul className="space-y-1.5">
                            {listing.highlights.map((h, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-500">{h}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Screenshots */}
                {listing.screenshots && listing.screenshots.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Image className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-600">
                                Screenshots ({listing.screenshots.length})
                            </h3>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {listing.screenshots.map((s, i) => (
                                <a
                                    key={i}
                                    href={s}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0"
                                >
                                    <img
                                        src={s}
                                        alt={`Screenshot ${i + 1}`}
                                        className="h-40 w-auto rounded-lg border border-gray-200 hover:border-cyan-500 transition-colors"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Launch Configuration */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-medium text-gray-600">Launch Configuration</h3>
                    </div>
                    <pre className="p-3 bg-gray-800 text-gray-100 rounded-lg text-xs overflow-x-auto">
                        <code>{JSON.stringify(parsedConfig, null, 2)}</code>
                    </pre>

                    {listing.launch_type === 'EMBEDDED_IFRAME' && permissions.length > 0 && (
                        <div className="mt-2">
                            <h4 className="text-xs font-medium text-gray-500 mb-1.5">
                                Requested Permissions
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {permissions.map(p => {
                                    const info = PERMISSION_OPTIONS.find(o => o.value === p);
                                    return (
                                        <span
                                            key={p}
                                            className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium"
                                            title={info?.description}
                                        >
                                            {info?.label || p}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Consent Flow Contract */}
                {listing.launch_type === 'CONSENT_REDIRECT' && contractUri && (
                    <ConsentContractPreview contractUri={contractUri} />
                )}

                {/* External Links */}
                <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">External Links</h3>
                    <div className="space-y-1.5">
                        {typeof parsedConfig.url === 'string' && parsedConfig.url && (
                            <a
                                href={parsedConfig.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Application URL
                            </a>
                        )}
                        {listing.promo_video_url && (
                            <a
                                href={listing.promo_video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Promo Video
                            </a>
                        )}
                        {listing.privacy_policy_url && (
                            <a
                                href={listing.privacy_policy_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Privacy Policy
                            </a>
                        )}
                        {listing.terms_url && (
                            <a
                                href={listing.terms_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Terms of Service
                            </a>
                        )}
                    </div>
                </div>

                {/* Native App Links */}
                {(listing.ios_app_store_id || listing.android_app_store_id) && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Native App Links</h3>
                        <div className="space-y-1.5">
                            {listing.ios_app_store_id && (
                                <a
                                    href={`https://apps.apple.com/us/app/id${listing.ios_app_store_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    iOS App Store ({listing.ios_app_store_id})
                                </a>
                            )}
                            {listing.android_app_store_id && (
                                <a
                                    href={`https://play.google.com/store/apps/details?id=${listing.android_app_store_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Google Play Store ({listing.android_app_store_id})
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Promotion Menu (only for listed apps) */}
                {listing.app_listing_status === 'LISTED' && (
                    <PromotionMenu
                        currentLevel={listing.promotion_level as PromotionLevel | undefined}
                        listingId={listing.listing_id}
                        onPromotionChange={onPromotionChange}
                    />
                )}
            </div>

            {/* Action Buttons */}
            <ListingActions
                status={listing.app_listing_status as AppListingStatus}
                listingId={listing.listing_id}
                onStatusChange={onStatusChange}
                isUpdating={isUpdating}
            />
        </div>
    );
};
