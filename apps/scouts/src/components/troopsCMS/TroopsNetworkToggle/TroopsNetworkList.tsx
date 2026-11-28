import React from 'react';

import TroopsNetworkListItem from './TroopsNetworkListItem';
import ModalLayout from 'learn-card-base/components/modals/ionic-modals/CancelModalLayout';

import { TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';
import { VC } from '@learncard/types';
import { AppPage } from 'learn-card-base/ui/chrome';

type TroopsNetworkListProps = {
    handleCloseModal: () => void;
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    viewMode: TroopsCMSViewModeEnum;
    nationalNetworkIds: VC[];
};

const TroopsNetworkList: React.FC<TroopsNetworkListProps> = ({
    state,
    setState,
    handleCloseModal,
    viewMode,
    nationalNetworkIds,
}) => {
    return (
        <AppPage>
            <ModalLayout handleOnClick={handleCloseModal} containerClass="pt-6! px-[10px]">
                {nationalNetworkIds?.map(networkBoost => {
                    const uri = networkBoost?.boostId;

                    return (
                        <TroopsNetworkListItem
                            state={state}
                            setState={setState}
                            key={uri}
                            networkBoostUri={uri}
                            handleCloseModal={handleCloseModal}
                            viewMode={viewMode}
                        />
                    );
                })}
            </ModalLayout>
        </AppPage>
    );
};

export default TroopsNetworkList;
