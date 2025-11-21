import React from 'react';

import { IonLabel, IonRow, IonSegment, IonSegmentButton } from '@ionic/react';

export enum FamilyCMSTabsEnum {
    content = 'content',
    appearance = 'appearance',
}

const FamilyCMSTabs: React.FC<{
    activeTab: FamilyCMSTabsEnum;
    setActiveTab: React.Dispatch<React.SetStateAction<FamilyCMSTabsEnum>>;
}> = ({ activeTab, setActiveTab }) => {
    return (
        <IonRow className="flex w-full items-center justify-center bg-white">
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
                    value={FamilyCMSTabsEnum.content}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-[17px] text-grayscale-800 font-poppins">
                        Content
                    </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                    mode="ios"
                    value={FamilyCMSTabsEnum.appearance}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-[17px] text-grayscale-800 font-poppins">
                        Appearance
                    </IonLabel>
                </IonSegmentButton>
            </IonSegment>
        </IonRow>
    );
};

export default FamilyCMSTabs;
