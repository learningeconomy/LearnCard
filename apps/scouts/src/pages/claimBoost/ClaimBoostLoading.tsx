import React from 'react';
import * as m from '../../paraglide/messages.js';

import { LoadingSpinner } from 'learn-card-base/components/loaders/LoadingSpinner';
import { AppContent, AppHeader, AppPage } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

const ClaimBoostLoading: React.FC = () => {
    return (
        <AppPage className="claim-boost-loading">
            <AppContent className="">
                <AppCol className="flex m-auto items-center flex-wrap w-full h-full">
                    <div className="flex flex-col w-full h-full items-center justify-center">
                        <h3 className="text-black text-2xl font-medium">
                            {m['claimBoost.claiming']()}
                        </h3>
                        <div className="max-w-[150px]">
                            <LoadingSpinner />
                        </div>
                    </div>
                </AppCol>
            </AppContent>
        </AppPage>
    );
};

export default ClaimBoostLoading;
