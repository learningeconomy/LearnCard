import React, { useState } from 'react';
import {
    ExternalLink,
    Code,
    ShieldAlert,
    CheckCircle,
    XCircle,
    Loader2,
    Star,
    TrendingUp,
    Minus,
    ArrowDown,
    RotateCcw,
    Check,
    Image,
} from 'lucide-react';
import type { AppStoreListing, PromotionLevel, AppPermission } from '../../types/app-store';
import { LAUNCH_TYPE_INFO, PROMOTION_LEVEL_INFO, CATEGORY_OPTIONS, PERMISSION_OPTIONS } from '../../types/app-store';
import { StatusBadge } from '../ui/StatusBadge';

interface ListingDetailProps {
    listing: AppStoreListing;
    onStatusChange: (listingId: string, status: AppStoreListing['app_listing_status']) => void;
    onPromotionChange: (listingId: string, level: PromotionLevel) => void;
}

export const ListingDetail: React.FC<ListingDetailProps> = ({
    listing,
    onStatusChange,
    onPromotionChange,
}) => {
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isUnarchiving, setIsUnarchiving] = useState(false);
    const [isUnlisting, setIsUnlisting] = useState(false);
    const [showPromotionMenu, setShowPromotionMenu] = useState(false);

    const launchTypeInfo = LAUNCH_TYPE_INFO[listing.launch_type];
    const categoryLabel = CATEGORY_OPTIONS.find(c => c.value === listing.category)?.label;

    let parsedConfig: Record<string, unknown> = {};
    try {
        parsedConfig = JSON.parse(listing.launch_config_json);
    } catch {
        // Keep empty
    }

    const permissions = Array.isArray(parsedConfig.permissions) ? parsedConfig.permissions as AppPermission[] : [];

    const handleApprove = async () => {
        setIsApproving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onStatusChange(listing.listing_id, 'LISTED');
        setIsApproving(false);
    };

    const handleReject = async () => {
        setIsRejecting(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onStatusChange(listing.listing_id, 'ARCHIVED');
        setIsRejecting(false);
    };

    const handleUnarchive = async () => {
        setIsUnarchiving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onStatusChange(listing.listing_id, 'DRAFT');
        setIsUnarchiving(false);
    };

    const handleUnlist = async () => {
        setIsUnlisting(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onStatusChange(listing.listing_id, 'ARCHIVED');
        setIsUnlisting(false);
    };

    const promotionIcons: Record<PromotionLevel, React.FC<{ className?: string }>> = {
        FEATURED_CAROUSEL: Star,
        CURATED_LIST: TrendingUp,
        STANDARD: Minus,
        DEMOTED: ArrowDown,
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-apple-gray-200">
                <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-apple-lg bg-apple-gray-100 overflow-hidden flex-shrink-0">
                        <img
                            src={listing.icon_url}
                            alt={listing.display_name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-apple-gray-600">
                                    {listing.display_name}
                                </h2>

                                <p className="text-apple-gray-500 mt-1">{listing.tagline}</p>
                            </div>

                            <StatusBadge status={listing.app_listing_status} />
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                            {categoryLabel && (
                                <span className="px-2.5 py-1 bg-apple-gray-100 rounded-full text-xs font-medium text-apple-gray-500">
                                    {categoryLabel}
                                </span>
                            )}

                            <span className="px-2.5 py-1 bg-apple-blue/10 rounded-full text-xs font-medium text-apple-blue">
                                {launchTypeInfo.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Description */}
                <div>
                    <h3 className="text-sm font-medium text-apple-gray-600 mb-2">Description</h3>

                    <p className="text-sm text-apple-gray-500 whitespace-pre-wrap">
                        {listing.full_description}
                    </p>
                </div>

                {/* Highlights */}
                {listing.highlights && listing.highlights.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-apple-gray-600 mb-3">Highlights</h3>

                        <ul className="space-y-2">
                            {listing.highlights.map((highlight, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />

                                    <span className="text-sm text-apple-gray-500">{highlight}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Screenshots */}
                {listing.screenshots && listing.screenshots.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Image className="w-4 h-4 text-apple-gray-400" />

                            <h3 className="text-sm font-medium text-apple-gray-600">
                                Screenshots ({listing.screenshots.length})
                            </h3>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {listing.screenshots.map((screenshot, index) => (
                                <a
                                    key={index}
                                    href={screenshot}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 block"
                                >
                                    <img
                                        src={screenshot}
                                        alt={`Screenshot ${index + 1}`}
                                        className="h-48 w-auto rounded-apple border border-apple-gray-200 hover:border-apple-blue transition-colors"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Launch Configuration */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />

                        <h3 className="text-sm font-medium text-apple-gray-600">
                            Launch Configuration (Security Review)
                        </h3>
                    </div>

                    <div className="p-4 bg-apple-gray-600 rounded-apple">
                        <pre className="text-sm text-apple-gray-100 overflow-x-auto">
                            <code>{JSON.stringify(parsedConfig, null, 2)}</code>
                        </pre>
                    </div>

                    {/* Permissions Display */}
                    {listing.launch_type === 'EMBEDDED_IFRAME' && permissions.length > 0 && (
                        <div className="mt-3">
                            <h4 className="text-xs font-medium text-apple-gray-500 mb-2">Requested Permissions</h4>

                            <div className="flex flex-wrap gap-2">
                                {permissions.map(permission => {
                                    const permInfo = PERMISSION_OPTIONS.find(p => p.value === permission);
                                    return (
                                        <span
                                            key={permission}
                                            className="px-2 py-1 bg-apple-blue/10 text-apple-blue rounded text-xs font-medium"
                                            title={permInfo?.description}
                                        >
                                            {permInfo?.label || permission}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Links */}
                <div>
                    <h3 className="text-sm font-medium text-apple-gray-600 mb-3">External Links</h3>

                    <div className="space-y-2">
                        {parsedConfig.url && (
                            <a
                                href={String(parsedConfig.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-apple-blue hover:underline"
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
                                className="flex items-center gap-2 text-sm text-apple-blue hover:underline"
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
                                className="flex items-center gap-2 text-sm text-apple-blue hover:underline"
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
                                className="flex items-center gap-2 text-sm text-apple-blue hover:underline"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Terms of Service
                            </a>
                        )}
                    </div>
                </div>

                {/* App Store IDs */}
                {(listing.ios_app_store_id || listing.android_app_store_id) && (
                    <div>
                        <h3 className="text-sm font-medium text-apple-gray-600 mb-3">Native App Links</h3>

                        <div className="space-y-2">
                            {listing.ios_app_store_id && (
                                <a
                                    href={`https://apps.apple.com/us/app/learncard/id${listing.ios_app_store_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-apple-blue hover:underline"
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
                                    className="flex items-center gap-2 text-sm text-apple-blue hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Google Play Store ({listing.android_app_store_id})
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Promotion Level */}
                {listing.app_listing_status === 'LISTED' && (
                    <div>
                        <h3 className="text-sm font-medium text-apple-gray-600 mb-3">
                            Promotion Level
                        </h3>

                        <div className="relative">
                            <button
                                onClick={() => setShowPromotionMenu(!showPromotionMenu)}
                                className="w-full p-3 bg-apple-gray-50 rounded-apple flex items-center justify-between hover:bg-apple-gray-100 transition-colors"
                            >
                                <span className="text-sm text-apple-gray-600">
                                    {listing.promotion_level
                                        ? PROMOTION_LEVEL_INFO[listing.promotion_level].label
                                        : 'Standard'}
                                </span>

                                <Code className="w-4 h-4 text-apple-gray-400" />
                            </button>

                            {showPromotionMenu && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-apple shadow-apple-lg border border-apple-gray-200 z-10">
                                    {(Object.entries(PROMOTION_LEVEL_INFO) as [PromotionLevel, typeof PROMOTION_LEVEL_INFO[PromotionLevel]][]).map(
                                        ([level, info]) => {
                                            const Icon = promotionIcons[level];

                                            return (
                                                <button
                                                    key={level}
                                                    onClick={() => {
                                                        onPromotionChange(listing.listing_id, level);
                                                        setShowPromotionMenu(false);
                                                    }}
                                                    className={`w-full p-3 text-left flex items-center gap-3 hover:bg-apple-gray-50 transition-colors ${
                                                        listing.promotion_level === level
                                                            ? 'bg-apple-blue/5'
                                                            : ''
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4 text-apple-gray-400" />

                                                    <div>
                                                        <p className="text-sm font-medium text-apple-gray-600">
                                                            {info.label}
                                                        </p>

                                                        <p className="text-xs text-apple-gray-400">
                                                            {info.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions for Listed */}
            {listing.app_listing_status === 'LISTED' && (
                <div className="p-6 border-t border-apple-gray-200 bg-apple-gray-50">
                    <button
                        onClick={handleUnlist}
                        disabled={isUnlisting}
                        className="w-full py-3 px-4 rounded-full border-2 border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isUnlisting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <XCircle className="w-4 h-4" />
                        )}
                        Unlist App
                    </button>
                </div>
            )}

            {/* Actions for Pending Review */}
            {listing.app_listing_status === 'PENDING_REVIEW' && (
                <div className="p-6 border-t border-apple-gray-200 bg-apple-gray-50">
                    <div className="flex gap-3">
                        <button
                            onClick={handleReject}
                            disabled={isRejecting || isApproving}
                            className="flex-1 py-3 px-4 rounded-full border-2 border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isRejecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <XCircle className="w-4 h-4" />
                            )}
                            Reject
                        </button>

                        <button
                            onClick={handleApprove}
                            disabled={isApproving || isRejecting}
                            className="flex-1 py-3 px-4 rounded-full bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isApproving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                            Approve
                        </button>
                    </div>
                </div>
            )}

            {/* Actions for Archived */}
            {listing.app_listing_status === 'ARCHIVED' && (
                <div className="p-6 border-t border-apple-gray-200 bg-apple-gray-50">
                    <div className="flex flex-col gap-3">
                        <p className="text-sm text-apple-gray-500 text-center">
                            This listing was rejected/archived. You can send it back to the partner as a draft for revision.
                        </p>

                        <button
                            onClick={handleUnarchive}
                            disabled={isUnarchiving}
                            className="w-full py-3 px-4 rounded-full bg-apple-blue text-white font-medium text-sm hover:bg-apple-blue/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isUnarchiving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RotateCcw className="w-4 h-4" />
                            )}
                            Send Back to Draft
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
