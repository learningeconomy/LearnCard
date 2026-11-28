import React from 'react';

import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { boostCategoryOptions } from '../boost-options/boostOptions';
import * as m from '../../../paraglide/messages.js';
import { AppRow } from 'learn-card-base/ui/layout';
import { AppLabel } from 'learn-card-base/ui/list';
import { AppSegment, AppSegmentButton } from 'learn-card-base/ui/widgets';

export enum BoostSelectMenuTabsEnum {
    new = 'new',
    existing = 'existing',
}

const NewBoostSelectMenuTabs: React.FC<{
    category: BoostCategoryOptionsEnum;
    activeTab: BoostSelectMenuTabsEnum;
    setActiveTab: React.Dispatch<React.SetStateAction<BoostSelectMenuTabsEnum>>;
}> = ({ category = BoostCategoryOptionsEnum.socialBadge, activeTab, setActiveTab }) => {
    const { title, color } = boostCategoryOptions[category];

    return (
        <AppRow className="flex w-full items-center justify-center">
            <AppSegment
                onValueChange={value => setActiveTab(value)}
                value={activeTab}
                className={`fix-ripple bg-grayscale-200 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]`}
            >
                <AppSegmentButton
                    value={BoostSelectMenuTabsEnum.new}
                    className="py-4"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel
                        className={`font-normal text-[17px] ${
                            activeTab === BoostSelectMenuTabsEnum.new
                                ? `text-${color}`
                                : 'text-grayscale-800'
                        }`}
                    >
                        {m['boost.newTitle']({ title })}
                    </AppLabel>
                </AppSegmentButton>
                <AppSegmentButton
                    value={BoostSelectMenuTabsEnum.existing}
                    className="py-4"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel
                        className={`font-normal text-[17px] ${
                            activeTab === BoostSelectMenuTabsEnum.existing
                                ? `text-${color}`
                                : 'text-grayscale-800'
                        }`}
                    >
                        {m['boost.myTitles']({ title })}
                    </AppLabel>
                </AppSegmentButton>
            </AppSegment>
        </AppRow>
    );
};

export default NewBoostSelectMenuTabs;
