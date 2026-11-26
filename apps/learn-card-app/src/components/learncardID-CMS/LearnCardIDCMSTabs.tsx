import * as m from '../../paraglide/messages.js';
import React from 'react';

import { AppRow } from '../layout';
import { AppLabel } from '../list';
import { AppSegment, AppSegmentButton } from '../widgets';

export enum LearnCardIDCMSTabsEnum {
    dark = 'dark',
    light = 'light',
    custom = 'custom',
}

const LearnCardIDCMSTabs: React.FC<{
    activeTab: LearnCardIDCMSTabsEnum;
    handleTabSwitch: (tab: LearnCardIDCMSTabsEnum) => void;
}> = ({ activeTab, handleTabSwitch }) => {
    return (
        <AppRow className="flex w-full items-center justify-center bg-white mt-4">
            <AppSegment
                onValueChange={value => handleTabSwitch(value)}
                value={activeTab}
                className="fix-ripple bg-grayscale-100 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]"
            >
                <AppSegmentButton
                    value={LearnCardIDCMSTabsEnum.dark}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-[17px] text-grayscale-800 font-poppins">
                        {m['learnCardId.dark']()}
                    </AppLabel>
                </AppSegmentButton>
                <AppSegmentButton
                    value={LearnCardIDCMSTabsEnum.light}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-[17px] text-grayscale-800 font-poppins">
                        {m['learnCardId.light']()}
                    </AppLabel>
                </AppSegmentButton>
                <AppSegmentButton
                    value={LearnCardIDCMSTabsEnum.custom}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-[17px] text-grayscale-800 font-poppins">
                        {m['learnCardId.custom']()}
                    </AppLabel>
                </AppSegmentButton>
            </AppSegment>
        </AppRow>
    );
};

export default LearnCardIDCMSTabs;
