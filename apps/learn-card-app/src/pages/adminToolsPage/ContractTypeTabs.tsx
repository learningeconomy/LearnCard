import React from 'react';
import { IonLabel, IonRow, IonSegment, IonSegmentButton } from '@ionic/react';
import { ContractType } from './CreateContractModal';
import { SetState } from 'packages/shared-types/dist';

type ContractTypeTabsProps = {
    contractType: ContractType;
    setContractType: SetState<ContractType>;
};

const ContractTypeTabs: React.FC<ContractTypeTabsProps> = ({ contractType, setContractType }) => {
    return (
        <IonRow className="flex w-full items-center justify-center bg-white">
            <IonSegment
                onIonChange={e => {
                    setContractType(e.detail.value);
                    e.stopPropagation();
                }}
                value={contractType}
                className="fix-ripple bg-grayscale-100 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]"
            >
                <IonSegmentButton
                    mode="ios"
                    value={ContractType.classic}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-base text-grayscale-800 font-poppins">
                        Classic
                    </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                    mode="ios"
                    value={ContractType.gameFlow}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-base text-grayscale-800 font-poppins">
                        GameFlow
                    </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton
                    mode="ios"
                    value={ContractType.frontDoorCred}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <IonLabel className="font-normal text-base text-grayscale-800 font-poppins">
                        Front Door Cred
                    </IonLabel>
                </IonSegmentButton>
            </IonSegment>
        </IonRow>
    );
};

export default ContractTypeTabs;
