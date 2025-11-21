import React from 'react';

import { BoostPreviewTabsEnum, boostPreviewTabs } from './boost-preview-tabs.helpers';

export const BoostPreviewTabs: React.FC<{
    className?: string;
    selectedTab?: BoostPreviewTabsEnum;
    setSelectedTab?: (tab: BoostPreviewTabsEnum) => void;
}> = ({ className, selectedTab, setSelectedTab }) => {
    const isSelectedTab = (tab: BoostPreviewTabsEnum) => selectedTab === tab;

    const handleSetSelectedTab = (tab: BoostPreviewTabsEnum) => {
        setSelectedTab?.(tab);
    };

    return (
        <div className={`${className} flex items-center gap-[10px]`}>
            {boostPreviewTabs.map(tab => (
                <button
                    key={tab.value}
                    onClick={() => handleSetSelectedTab(tab.value)}
                    className={`text-sm flex items-center justify-center gap-[5px] px-[14px] py-[7px] rounded-[5px] shadow-md ${
                        isSelectedTab(tab.value)
                            ? 'bg-white text-grayscale-900'
                            : 'bg-[#FFFFFFA6] text-grayscale-600'
                    }`}
                >
                    {tab.Icon && <tab.Icon />}
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default BoostPreviewTabs;
