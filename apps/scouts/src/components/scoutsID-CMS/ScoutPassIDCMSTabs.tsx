import React from 'react';

import { IonLabel, IonRow, IonSegment, IonSegmentButton } from '@ionic/react';

export enum ScoutPassIDCMSTabsEnum {
    dark = 'dark',
    light = 'light',
    custom = 'custom',
}

const ScoutPassIDCMSTabs: React.FC<{
    activeTab: ScoutPassIDCMSTabsEnum;
    handleTabSwitch: (tab: ScoutPassIDCMSTabsEnum) => void;
}> = ({ activeTab, handleTabSwitch }) => {
    return (
        <IonRow className="flex w-full items-center justify-center bg-white mt-4">
            <IonSegment
                onIonChange={e => {
                    handleTabSwitch(e.detail.value);
                    e.stopPropagation();
                }}
                value={activeTab}
                className="fix-ripple bg-grayscale-100 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]"
            >
                <IonSegmentButton
                    mode="ios"
                    value={ScoutPassIDCMSTabsEnum.dark}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-[17px] text-grayscale-800 font-poppins">
                        Dark
                    </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                    mode="ios"
                    value={ScoutPassIDCMSTabsEnum.light}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-[17px] text-grayscale-800 font-poppins">
                        Light
                    </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                    mode="ios"
                    value={ScoutPassIDCMSTabsEnum.custom}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-[17px] text-grayscale-800 font-poppins">
                        Custom
                    </IonLabel>
                </IonSegmentButton>
            </IonSegment>
        </IonRow>
    );
};

export default ScoutPassIDCMSTabs;
