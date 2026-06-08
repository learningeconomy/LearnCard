import React from 'react';
import { m } from '../../paraglide/messages.js';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import CheckListButton from '../../components/learncard/checklist/CheckListButton';

export const AiInsightsEmptyPlaceholder: React.FC<{ isSharedView?: boolean }> = ({
    isSharedView = false,
}) => {
    const brandingConfig = useBrandingConfig();

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 px-[15px] py-[18px] rounded-[15px] mt-4">
            <div className="w-full flex-col flex items-center justify-center gap-4">
                <AiInsightsIconWithShape className="w-auto h-[60px]" />
                <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">
                        {m['aiInsights.noInsightsYet']()}
                    </h2>
                    <p className="text-sm text-grayscale-700 font-notoSans text-center">
                        {isSharedView
                            ? m['aiInsights.noInsightsSharedView']()
                            : m['aiInsights.buildYourProfile']({ brand: brandingConfig?.name ?? '' })}
                    </p>
                </div>
                {!isSharedView && <CheckListButton />}
            </div>
        </div>
    );
};

export default AiInsightsEmptyPlaceholder;
