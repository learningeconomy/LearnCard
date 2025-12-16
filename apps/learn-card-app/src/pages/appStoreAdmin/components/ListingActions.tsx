import React, { useState } from 'react';
import { Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

import type { AppListingStatus } from '../../appStoreDeveloper/types';

interface ListingActionsProps {
    status: AppListingStatus;
    listingId: string;
    onStatusChange: (listingId: string, status: AppListingStatus) => Promise<void>;
    isUpdating: boolean;
}

export const ListingActions: React.FC<ListingActionsProps> = ({
    status,
    listingId,
    onStatusChange,
    isUpdating,
}) => {
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isUnarchiving, setIsUnarchiving] = useState(false);
    const [isUnlisting, setIsUnlisting] = useState(false);

    const handleApprove = async () => {
        setIsApproving(true);
        await onStatusChange(listingId, 'LISTED');
        setIsApproving(false);
    };

    const handleReject = async () => {
        setIsRejecting(true);
        await onStatusChange(listingId, 'ARCHIVED');
        setIsRejecting(false);
    };

    const handleUnarchive = async () => {
        setIsUnarchiving(true);
        await onStatusChange(listingId, 'DRAFT');
        setIsUnarchiving(false);
    };

    const handleUnlist = async () => {
        setIsUnlisting(true);
        await onStatusChange(listingId, 'ARCHIVED');
        setIsUnlisting(false);
    };

    if (status === 'LISTED') {
        return (
            <div className="p-5 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={handleUnlist}
                    disabled={isUnlisting || isUpdating}
                    className="w-full py-2.5 px-4 rounded-xl border-2 border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isUnlisting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <XCircle className="w-4 h-4" />
                    )}
                    Unlist App
                </button>
            </div>
        );
    }

    if (status === 'PENDING_REVIEW') {
        return (
            <div className="p-3 sm:p-5 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={handleReject}
                        disabled={isRejecting || isApproving || isUpdating}
                        className="flex-1 py-2.5 px-4 rounded-xl border-2 border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                        disabled={isApproving || isRejecting || isUpdating}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
        );
    }

    if (status === 'ARCHIVED') {
        return (
            <div className="p-5 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500 text-center mb-3">
                    This listing was rejected. Send it back as a draft for revision.
                </p>

                <button
                    onClick={handleUnarchive}
                    disabled={isUnarchiving || isUpdating}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isUnarchiving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <RotateCcw className="w-4 h-4" />
                    )}
                    Send Back to Draft
                </button>
            </div>
        );
    }

    return null;
};
