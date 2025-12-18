import React from 'react';

import { IonLabel, IonRow, IonSegment, IonSegmentButton } from '@ionic/react';

import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { boostCategoryOptions } from '../boost-options/boostOptions';

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
        <IonRow className="flex w-full items-center justify-center">
            <IonSegment
                onIonChange={e => {
                    setActiveTab(e.detail.value);
                    e.stopPropagation();
                }}
                value={activeTab}
                className={`fix-ripple bg-grayscale-200 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]`}
            >
                <IonSegmentButton
                    mode="ios"
                    value={BoostSelectMenuTabsEnum.new}
                    className="py-4"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel
                        className={`font-normal text-[17px] ${
                            activeTab === BoostSelectMenuTabsEnum.new
                                ? `text-${color}`
                                : 'text-grayscale-800'
                        }`}
                    >
                        New {title}
                    </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                    mode="ios"
                    value={BoostSelectMenuTabsEnum.existing}
                    className="py-4"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel
                        className={`font-normal text-[17px] ${
                            activeTab === BoostSelectMenuTabsEnum.existing
                                ? `text-${color}`
                                : 'text-grayscale-800'
                        }`}
                    >
                        My {title}s
                    </IonLabel>
                </IonSegmentButton>
            </IonSegment>
        </IonRow>
    );
};

export default NewBoostSelectMenuTabs;
