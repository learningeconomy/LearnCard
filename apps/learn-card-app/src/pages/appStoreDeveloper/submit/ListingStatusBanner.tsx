import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, timeOutline } from 'ionicons/icons';

import type { ListingMode } from './listingLifecycle';

interface ListingStatusBannerProps {
    mode: ListingMode;
    submittedAt?: string;
    hasPendingChanges: boolean;
    isWorking: boolean;
    onMakeChanges: () => void;
    onDiscardChanges: () => void;
}

const formatDate = (iso?: string): string => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return ` since ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

const Spinner: React.FC = () => (
    <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
);

export const ListingStatusBanner: React.FC<ListingStatusBannerProps> = ({
    mode,
    submittedAt,
    hasPendingChanges,
    isWorking,
    onMakeChanges,
    onDiscardChanges,
}) => {
    const [confirming, setConfirming] = useState<'withdraw' | 'discard' | null>(null);

    if (mode === 'draft') return null;

    const inReview = mode === 'in-review' || mode === 'update-in-review';

    const message: Record<Exclude<ListingMode, 'draft'>, string> = {
        'in-review': `In review${formatDate(submittedAt)}. Need to change something?`,
        'update-in-review': `Your update is in review${formatDate(
            submittedAt
        )}. Your app stays live until it's approved.`,
        'live': hasPendingChanges
            ? 'Live in the store. Your changes go to review before learners see them.'
            : 'Live in the store. Changes you make here go to review before learners see them.',
        'removed': 'This app was removed from the store.',
    };

    const confirmText =
        confirming === 'withdraw'
            ? 'Take it out of review so you can edit? You can resubmit anytime.'
            : 'Throw away your unsubmitted changes? The live app stays as it is.';

    return (
        <div className="mb-6 p-4 bg-white border border-grayscale-200 rounded-2xl font-poppins">
            <div className="flex items-start gap-2.5">
                <IonIcon
                    icon={inReview ? timeOutline : checkmarkCircleOutline}
                    className={`text-lg mt-0.5 shrink-0 ${
                        inReview ? 'text-amber-500' : 'text-emerald-500'
                    }`}
                />
                <p className="flex-1 text-sm text-grayscale-700 leading-relaxed">
                    {confirming ? confirmText : message[mode]}
                </p>
            </div>

            {confirming ? (
                <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        disabled={isWorking}
                        className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (confirming === 'withdraw') onMakeChanges();
                            else onDiscardChanges();
                            setConfirming(null);
                        }}
                        disabled={isWorking}
                        className="py-2 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                        {confirming === 'withdraw' ? 'Withdraw and Edit' : 'Discard Changes'}
                    </button>
                </div>
            ) : (
                (inReview || (mode === 'live' && hasPendingChanges)) && (
                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setConfirming(inReview ? 'withdraw' : 'discard')}
                            disabled={isWorking}
                            className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 flex items-center gap-2"
                        >
                            {isWorking && <Spinner />}
                            {inReview ? 'Make Changes' : 'Discard Changes'}
                        </button>
                    </div>
                )
            )}
        </div>
    );
};
