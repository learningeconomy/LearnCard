import React from 'react';

import * as m from '../../../paraglide/messages.js';
import { AppRow } from 'learn-card-base/ui/layout';
import { AppLabel } from 'learn-card-base/ui/list';
import { AppSegment, AppSegmentButton } from 'learn-card-base/ui/widgets';

export enum TroopsAppearanceTabs {
    dark = 'dark',
    light = 'light',
    custom = 'custom',
}

const TroopsCMSAppearanceTabs: React.FC<{
    activeTab: TroopsAppearanceTabs;
    handleTabSwitch: (tab: TroopsAppearanceTabs) => void;
}> = ({ activeTab, handleTabSwitch }) => {
    return (
        <AppRow className="flex w-full items-center justify-center bg-white mb-4 mt-4">
            <AppSegment
                onValueChange={value => handleTabSwitch(value)}
                value={activeTab}
                className="fix-ripple bg-grayscale-100 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]"
            >
                <AppSegmentButton
                    value={TroopsAppearanceTabs.dark}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-[17px] text-grayscale-800 font-notoSans">
                        {m['scoutsId.dark']()}
                    </AppLabel>
                </AppSegmentButton>
                <AppSegmentButton
                    value={TroopsAppearanceTabs.light}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-[17px] text-grayscale-800 font-notoSans">
                        {m['scoutsId.light']()}
                    </AppLabel>
                </AppSegmentButton>
                <AppSegmentButton
                    value={TroopsAppearanceTabs.custom}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-[17px] text-grayscale-800 font-notoSans">
                        {m['scoutsId.custom']()}
                    </AppLabel>
                </AppSegmentButton>
            </AppSegment>
        </AppRow>
    );
};

export default TroopsCMSAppearanceTabs;
