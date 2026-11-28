import React from 'react';
import { AppRow } from 'learn-card-base/ui/layout';
import { AppLabel } from 'learn-card-base/ui/list';
import { AppSegment, AppSegmentButton } from 'learn-card-base/ui/widgets';
import { ContractType } from './CreateContractModal';
import { SetState } from 'packages/shared-types/dist';

type ContractTypeTabsProps = {
    contractType: ContractType;
    setContractType: SetState<ContractType>;
};

const ContractTypeTabs: React.FC<ContractTypeTabsProps> = ({ contractType, setContractType }) => {
    return (
        <AppRow className="flex w-full items-center justify-center bg-white">
            <AppSegment
                onValueChange={value => setContractType(value)}
                value={contractType}
                className="fix-ripple bg-grayscale-100 z-10 flex-1 overflow-hidden rounded-full py-[2px] px-[1px]"
            >
                <AppSegmentButton
                    value={ContractType.classic}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-base text-grayscale-800 font-poppins">
                        Classic
                    </AppLabel>
                </AppSegmentButton>
                <AppSegmentButton
                    value={ContractType.gameFlow}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-base text-grayscale-800 font-poppins">
                        GameFlow
                    </AppLabel>
                </AppSegmentButton>
                <AppSegmentButton
                    value={ContractType.frontDoorCred}
                    className="py-[12px]"
                    onClick={e => {
                        e.stopPropagation();
                    }}
                >
                    <AppLabel className="font-normal text-base text-grayscale-800 font-poppins">
                        Front Door Cred
                    </AppLabel>
                </AppSegmentButton>
            </AppSegment>
        </AppRow>
    );
};

export default ContractTypeTabs;
