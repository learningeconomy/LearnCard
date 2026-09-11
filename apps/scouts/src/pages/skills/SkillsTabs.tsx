import React from 'react';

import * as m from '../../paraglide/messages.js';

export enum SkillsTab {
    MyHub = 'my-hub',
    AdminPanel = 'admin-panel',
}

type SkillsTabsProps = {
    selectedTab: SkillsTab;
    onSelect: (tab: SkillsTab) => void;
    showAdminPanel: boolean;
};

const SkillsTabs: React.FC<SkillsTabsProps> = ({ selectedTab, onSelect, showAdminPanel }) => {
    const tabs = showAdminPanel ? Object.values(SkillsTab) : [SkillsTab.MyHub];
    const labels: Record<SkillsTab, string> = {
        [SkillsTab.MyHub]: m['skills.myHub'](),
        [SkillsTab.AdminPanel]: m['skills.adminPanel'](),
    };

    if (tabs.length < 2) return null;

    return (
        <div
            className={`flex items-center justify-start w-full ${
                selectedTab === SkillsTab.MyHub ? 'mb-[10px]' : 'mb-[15px]'
            }`}
        >
            {tabs.map(tab => (
                <button
                    key={tab}
                    onClick={() => onSelect(tab)}
                    className={`px-[14px] py-[7px] rounded-[5px] font-[500] font-poppins text-[14px] ${
                        tab === selectedTab
                            ? 'bg-violet-100 text-grayscale-900'
                            : 'text-grayscale-600'
                    }`}
                >
                    {labels[tab]}
                </button>
            ))}
        </div>
    );
};

export default SkillsTabs;
