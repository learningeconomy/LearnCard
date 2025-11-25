import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import type { AppStoreListing } from '../../types/app-store';
import { LAUNCH_TYPE_INFO, CATEGORY_OPTIONS } from '../../types/app-store';
import { StatusBadge } from '../ui/StatusBadge';

interface ListingCardProps {
    listing: AppStoreListing;
    onSelect: (listing: AppStoreListing) => void;
    isSelected: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onSelect, isSelected }) => {
    const launchTypeInfo = LAUNCH_TYPE_INFO[listing.launch_type];
    const categoryLabel = CATEGORY_OPTIONS.find(c => c.value === listing.category)?.label;

    return (
        <button
            onClick={() => onSelect(listing)}
            className={`w-full text-left p-4 rounded-apple-lg border-2 transition-all duration-200 ${
                isSelected
                    ? 'border-apple-blue bg-apple-blue/5'
                    : 'border-apple-gray-200 hover:border-apple-gray-300 bg-white'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-apple bg-apple-gray-100 overflow-hidden flex-shrink-0">
                    <img
                        src={listing.icon_url}
                        alt={listing.display_name}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-apple-gray-600 truncate">
                            {listing.display_name}
                        </h3>

                        <StatusBadge status={listing.app_listing_status} size="sm" />
                    </div>

                    <p className="text-sm text-apple-gray-500 mt-1 line-clamp-1">
                        {listing.tagline}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                        {categoryLabel && (
                            <span className="text-xs text-apple-gray-400">{categoryLabel}</span>
                        )}

                        <span className="text-xs text-apple-gray-400">•</span>

                        <span className="text-xs text-apple-gray-400">{launchTypeInfo.label}</span>
                    </div>
                </div>
            </div>

            {listing.app_listing_status === 'PENDING_REVIEW' && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-apple-gray-100">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />

                    <span className="text-xs text-amber-600">Awaiting review</span>
                </div>
            )}
        </button>
    );
};
