import React from 'react';

import { AppRow } from '../../layout';
import { AppLabel } from '../../list';
import { AppSegment, AppSegmentButton } from '../../widgets';
import { m } from '../../../paraglide/messages.js';

export enum FamilyCMSTabsEnum {
    content = 'content',
    appearance = 'appearance',
}

const FamilyCMSTabs: React.FC<{
    activeTab: FamilyCMSTabsEnum;
    setActiveTab: React.Dispatch<React.SetStateAction<FamilyCMSTabsEnum>>;
}> = ({ activeTab, setActiveTab }) => {
    return (
        <AppRow className="flex w-full items-center justify-center bg-white">
            <AppSegment
                onValueChange={value => setActiveTab(value)}
                value={activeTab}
                className="fix-ripple bg-grayscale-100 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]"
            >
                <AppSegmentButton
                    value={FamilyCMSTabsEnum.content}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-[17px] text-grayscale-800 font-poppins">
                        {m['family.editor.tabContent']()}
                    </AppLabel>
                </AppSegmentButton>
                <AppSegmentButton
                    value={FamilyCMSTabsEnum.appearance}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-[17px] text-grayscale-800 font-poppins">
                        {m['family.editor.tabAppearance']()}
                    </AppLabel>
                </AppSegmentButton>
            </AppSegment>
        </AppRow>
    );
};

export default FamilyCMSTabs;
