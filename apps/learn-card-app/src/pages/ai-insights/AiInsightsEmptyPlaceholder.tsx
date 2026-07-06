import React from 'react';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import RefreshIcon from 'learn-card-base/svgs/RefreshIcon';
import CheckListButton from '../../components/learncard/checklist/CheckListButton';

export const AiInsightsEmptyPlaceholder: React.FC<{
    isSharedView?: boolean;
    showRegenerate?: boolean;
    onRegenerate?: () => void;
    regenerateLabel?: string;
    regenerateDisabled?: boolean;
    regenerateDisabledReason?: string;
    isRegenerating?: boolean;
}> = ({
    isSharedView = false,
    showRegenerate = false,
    onRegenerate,
    regenerateLabel = 'Regenerate',
    regenerateDisabled = false,
    regenerateDisabledReason,
    isRegenerating = false,
}) => {
    const brandingConfig = useBrandingConfig();
    const loadingLabel = regenerateLabel === 'Regenerate' ? 'Regenerating' : 'Generating';

    const handleRegenerateClick = (): void => {
        if (regenerateDisabled) {
            console.log(regenerateDisabledReason ?? 'Generate Insights is currently disabled.');
            return;
        }

        onRegenerate?.();
    };

    const handleRegenerateHover = (): void => {
        if (!regenerateDisabled) {
            return;
        }

        console.log(regenerateDisabledReason ?? 'Generate Insights is currently disabled.');
    };

    return (
        <div className="relative w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 px-[15px] py-[18px] rounded-[15px] mt-4">
            {!isSharedView && showRegenerate && (
                <div
                    className="absolute top-[18px] right-[15px]"
                    onMouseEnter={handleRegenerateHover}
                >
                    <button
                        type="button"
                        disabled={regenerateDisabled || isRegenerating}
                        onClick={handleRegenerateClick}
                        className="flex items-center gap-1.5 py-2 px-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-xs hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <RefreshIcon
                            className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`}
                        />
                        {isRegenerating ? loadingLabel : regenerateLabel}
                    </button>
                </div>
            )}

            <div className="w-full flex-col flex items-center justify-center gap-4">
                <AiInsightsIconWithShape className="w-auto h-[60px]" />
                <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">No Insights yet.</h2>
                    <p className="text-sm text-grayscale-700 font-notoSans text-center">
                        {isSharedView
                            ? "This learner hasn't generated any Insights yet."
                            : `Build your ${brandingConfig?.name} to unlock personalized learning insights and track your skill development journey.`}
                    </p>
                </div>
                {!isSharedView && <CheckListButton />}
            </div>
        </div>
    );
};

export default AiInsightsEmptyPlaceholder;
