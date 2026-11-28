import React from 'react';

import * as m from '../../../paraglide/messages.js';
import { AppRow } from 'learn-card-base/ui/layout';
import { AppLabel } from 'learn-card-base/ui/list';
import { AppSegment, AppSegmentButton } from 'learn-card-base/ui/widgets';

export enum TroopsCMSTabsEnum {
    content = 'content',
    appearance = 'appearance',
}

const TroopsCMSTabs: React.FC<{
    activeTab: TroopsCMSTabsEnum;
    setActiveTab: React.Dispatch<React.SetStateAction<TroopsCMSTabsEnum>>;
}> = ({ activeTab, setActiveTab }) => {
    return (
        <AppRow className="flex w-full items-center justify-center">
            <AppSegment
                onValueChange={value => setActiveTab(value)}
                value={activeTab}
                className="fix-ripple bg-grayscale-100 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]"
            >
                <AppSegmentButton
                    value={TroopsCMSTabsEnum.content}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-[17px] text-grayscale-800">
                        {m['troops.contentTab']()}
                    </AppLabel>
                </AppSegmentButton>
                <AppSegmentButton
                    value={TroopsCMSTabsEnum.appearance}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-[17px] text-grayscale-800">
                        {m['boostCMS.appearance']()}
                    </AppLabel>
                </AppSegmentButton>
            </AppSegment>
        </AppRow>
    );
};

export default TroopsCMSTabs;
