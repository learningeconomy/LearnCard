import React from 'react';

import Checkmark from '../../svgs/Checkmark';

import { useGetCredentialWithEdits, useResolveBoost } from 'learn-card-base';
import { mapParentIntoState, TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';

type TroopsNetworkListItemProps = {
    networkBoostUri: string;
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    viewMode: TroopsCMSViewModeEnum;
    handleCloseModal: () => void;
};

const TroopsNetworkListItem: React.FC<TroopsNetworkListItemProps> = ({
    networkBoostUri,
    state,
    setState,
    viewMode,
    handleCloseModal,
}) => {
    const { data: _resolvedNetworkBoost } = useResolveBoost(networkBoostUri, !networkBoostUri);
    const { credentialWithEdits } = useGetCredentialWithEdits(
        _resolvedNetworkBoost,
        networkBoostUri
    );
    const resolvedNetworkBoost = credentialWithEdits ?? _resolvedNetworkBoost;

    const thumbnail = resolvedNetworkBoost?.image;
    const name = resolvedNetworkBoost?.name;

    const handleSelectNetwork = () => {
        mapParentIntoState(state, setState, resolvedNetworkBoost, viewMode, networkBoostUri);
    };

    return (
        <button
            onClick={() => {
                handleSelectNetwork();
                handleCloseModal();
            }}
            className="w-full flex items-center justify-between last-of-type:border-none border-b-[1px] border-solid border-grayscale-300 ion-padding first-of-type:pt-[4px]"
        >
            <div className="flex items-center justify-center">
                <div className="w-[40px] h-[40px] rounded-full bg-white mr-2 overflow-hidden">
                    <img
                        src={thumbnail}
                        alt="network thumb"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex flex-col items-cennter justify-center">
                    <p className="m-0 p-0 text-lg text-left font-notoSans text-grayscale-900">
                        {name}
                    </p>
                </div>
            </div>

            {name === state?.parentID?.basicInfo?.name ? (
                <span className="flex items-center justify-center bg-sp-green-forest-light rounded-full shadow-3xl min-w-[40px] min-h-[40px]">
                    <Checkmark className="w-7 h-auto text-white" />
                </span>
            ) : null}
        </button>
    );
};

export default TroopsNetworkListItem;
