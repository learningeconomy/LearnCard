import React from 'react';
import { useTranslation } from 'react-i18next';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import CheckListButton from '../../components/learncard/checklist/CheckListButton';

export const AiInsightsEmptyPlaceholder: React.FC<{ isSharedView?: boolean }> = ({
    isSharedView = false,
}) => {
    const { t } = useTranslation();
    const brandingConfig = useBrandingConfig();

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 px-[15px] py-[18px] rounded-[15px] mt-4">
            <div className="w-full flex-col flex items-center justify-center gap-4">
                <AiInsightsIconWithShape className="w-auto h-[60px]" />
                <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">
                        {t('aiInsights.noInsightsYet', 'No AI Insights yet.')}
                    </h2>
                    <p className="text-sm text-grayscale-700 font-notoSans text-center">
                        {isSharedView
                            ? t('aiInsights.noInsightsSharedView', 'This learner hasn\'t generated any AI Insights yet.')
                            : t('aiInsights.buildYourProfile', { ...{ brand: brandingConfig?.name ?? '' }, defaultValue: 'Build your {{brand}} to unlock personalized learning insights and track your skill development journey.' })}
                    </p>
                </div>
                {!isSharedView && <CheckListButton />}
            </div>
        </div>
    );
};

export default AiInsightsEmptyPlaceholder;
