import React from 'react';

import type { PendingContractSyncJob } from 'learn-card-base';

type ContractSyncStatusBannerProps = {
    activeContractSyncJob: PendingContractSyncJob;
};

export const ContractSyncStatusBanner: React.FC<ContractSyncStatusBannerProps> = ({
    activeContractSyncJob,
}) => {
    return (
        <div className="fixed top-3 left-1/2 z-[1000] -translate-x-1/2 rounded-[20px] border border-grayscale-200 bg-white px-4 py-2 shadow-lg font-poppins safe-area-top-margin">
            <span className="flex items-center gap-2 text-xs font-medium text-grayscale-700">
                <span className="h-3 w-3 rounded-full border-2 border-grayscale-300 border-t-emerald-500 animate-spin" />
                Syncing your data
                {activeContractSyncJob.totalCredentials > 0
                    ? ` ${activeContractSyncJob.completedCredentials}/${activeContractSyncJob.totalCredentials}`
                    : ''}
                ...
            </span>
        </div>
    );
};

export default ContractSyncStatusBanner;
