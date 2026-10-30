import React from 'react';
import type { CampaignDispatchConfirmationProps } from './types';
import { CampaignMark, buttonClass, primaryClass } from './ui';

export const CampaignDispatchConfirmation: React.FC<CampaignDispatchConfirmationProps> = ({
    campaignName,
    preview,
    blockedReason,
    onConfirm,
    onCancel,
}) => (
    <div className="flex flex-col gap-5 bg-white p-6 font-poppins text-grayscale-900 sm:p-8">
        <div className="flex items-start gap-3">
            <CampaignMark />
            <div className="min-w-0">
                <h2 className="text-xl font-semibold">Send notifications?</h2>
                <p className="mt-1 break-words text-sm text-grayscale-600">{campaignName}</p>
            </div>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-grayscale-100 p-4">
            <p className="text-xl font-semibold">
                {preview.recipientCount.toLocaleString()} eligible{' '}
                {preview.recipientCount === 1 ? 'recipient' : 'recipients'}
            </p>
            <p className="text-xs leading-relaxed text-grayscale-600">
                {preview.audienceCount.toLocaleString()} stored members ·{' '}
                {preview.alreadyNotifiedCount.toLocaleString()} already notified
            </p>
        </div>
        <p className="text-sm leading-relaxed text-grayscale-600">
            {blockedReason ??
                'Send an inbox notification to these members and attempt push? Eligibility is checked again during delivery.'}
        </p>
        <div className="flex flex-col gap-3 border-t border-grayscale-200 pt-5 sm:flex-row">
            <button type="button" className={buttonClass} onClick={onCancel}>
                Cancel
            </button>
            <button
                type="button"
                className={`${primaryClass} flex-1`}
                disabled={Boolean(blockedReason) || preview.recipientCount === 0}
                onClick={onConfirm}
            >
                Confirm notification send
            </button>
        </div>
    </div>
);
