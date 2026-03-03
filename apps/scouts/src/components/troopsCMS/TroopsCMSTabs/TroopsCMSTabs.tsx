import React from 'react';

import { IonLabel, IonRow, IonSegment, IonSegmentButton } from '@ionic/react';

export enum TroopsCMSTabsEnum {
    content = 'content',
    appearance = 'appearance',
}

const TroopsCMSTabs: React.FC<{
    activeTab: TroopsCMSTabsEnum;
    setActiveTab: React.Dispatch<React.SetStateAction<TroopsCMSTabsEnum>>;
}> = ({ activeTab, setActiveTab }) => {
    return (
        <IonRow className="flex w-full items-center justify-center">
            <IonSegment
                onIonChange={e => {
                    setActiveTab(e.detail.value);
                    e.stopPropagation();
                }}
                value={activeTab}
                className="fix-ripple bg-grayscale-100 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]"
            >
                <IonSegmentButton
                    mode="ios"
                    value={TroopsCMSTabsEnum.content}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-[17px] text-grayscale-800">
                        Content
                    </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                    mode="ios"
                    value={TroopsCMSTabsEnum.appearance}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-[17px] text-grayscale-800">
                        Appearance
                    </IonLabel>
                </IonSegmentButton>
            </IonSegment>
        </IonRow>
    );
};

export default TroopsCMSTabs;
