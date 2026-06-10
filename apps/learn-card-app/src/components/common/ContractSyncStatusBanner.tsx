import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, closeOutline } from 'ionicons/icons';

import type { PendingContractSyncJob } from 'learn-card-base';

type ContractSyncStatusBannerProps = {
    job: PendingContractSyncJob;
    variant: 'active' | 'complete';
    onDismiss?: () => void;
};

export const ContractSyncStatusBanner: React.FC<ContractSyncStatusBannerProps> = ({
    job,
    variant,
    onDismiss,
}) => {
    const isComplete = variant === 'complete';
    const countText =
        job.totalCredentials > 0 ? ` ${job.processedCredentials}/${job.totalCredentials}` : '';

    return (
        <div
            className={[
                'fixed top-3 left-1/2 z-[1000] -translate-x-1/2 rounded-[20px] border px-4 py-2 shadow-lg font-poppins safe-area-top-margin',
                isComplete ? 'border-emerald-100 bg-emerald-50' : 'border-grayscale-200 bg-white',
            ].join(' ')}
        >
            <div className="flex items-center gap-2">
                <span
                    className={[
                        'h-3 w-3 rounded-full border-2 shrink-0',
                        isComplete
                            ? 'border-emerald-200 border-t-emerald-600'
                            : 'border-grayscale-300 border-t-emerald-500 animate-spin',
                    ].join(' ')}
                />
                <span
                    className={[
                        'flex items-center gap-2 text-xs font-medium leading-none',
                        isComplete ? 'text-emerald-700' : 'text-grayscale-700',
                    ].join(' ')}
                >
                    {isComplete && (
                        <IonIcon
                            icon={checkmarkCircleOutline}
                            className="text-emerald-600 text-sm shrink-0"
                        />
                    )}
                    {isComplete ? 'Syncing complete' : 'Syncing your data'}
                    {isComplete
                        ? ` ${job.processedCredentials}/${job.totalCredentials}`
                        : countText}
                    {!isComplete ? '...' : ''}
                </span>
                {isComplete && onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="ml-2 rounded-full p-1 text-emerald-500 hover:bg-emerald-100 transition-colors"
                        aria-label="Dismiss sync complete"
                    >
                        <IonIcon icon={closeOutline} className="text-sm" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ContractSyncStatusBanner;
