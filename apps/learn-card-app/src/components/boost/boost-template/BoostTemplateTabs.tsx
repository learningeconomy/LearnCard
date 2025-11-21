import React from 'react';

import { IonLabel, IonRow, IonSegment, IonSegmentButton } from '@ionic/react';

export enum BoostTemplateTabsEnum {
    learnCardTemplates = 'learnCardTemplates',
    myTemplates = 'myTemplates',
}

const BoostTemplateTabs: React.FC<{
    activeTab: BoostTemplateTabsEnum;
    handleTabSwitch: (tab: BoostTemplateTabsEnum) => void;
}> = ({ activeTab, handleTabSwitch }) => {
    return (
        <IonRow className="flex w-full items-center justify-center bg-grayscale-200 mt-4 rounded-full">
            <IonSegment
                onIonChange={e => {
                    handleTabSwitch(e.detail.value);
                    e.stopPropagation();
                }}
                value={activeTab}
                className="fix-ripple bg-grayscale-200 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]"
            >
                <IonSegmentButton
                    mode="ios"
                    value={BoostTemplateTabsEnum.learnCardTemplates}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-semibold text-[14px] text-grayscale-900 font-poppins">
                        LearnCard
                    </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                    mode="ios"
                    value={BoostTemplateTabsEnum.myTemplates}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-semibold text-[14px] text-grayscale-900 font-poppins">
                        Custom
                    </IonLabel>
                </IonSegmentButton>
            </IonSegment>
        </IonRow>
    );
};

export default BoostTemplateTabs;
