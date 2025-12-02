import React from 'react';

import { IonLabel, IonRow, IonSegment, IonSegmentButton } from '@ionic/react';

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
        <IonRow className="flex w-full items-center justify-center bg-white mb-4 mt-4">
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
                    value={TroopsAppearanceTabs.dark}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-[17px] text-grayscale-800 font-notoSans">
                        Dark
                    </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                    mode="ios"
                    value={TroopsAppearanceTabs.light}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-[17px] text-grayscale-800 font-notoSans">
                        Light
                    </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                    mode="ios"
                    value={TroopsAppearanceTabs.custom}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-[17px] text-grayscale-800 font-notoSans">
                        Custom
                    </IonLabel>
                </IonSegmentButton>
            </IonSegment>
        </IonRow>
    );
};

export default TroopsCMSAppearanceTabs;
