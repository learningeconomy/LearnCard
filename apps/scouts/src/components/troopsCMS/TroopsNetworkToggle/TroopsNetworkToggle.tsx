import React from 'react';

import { IonSpinner, useIonModal } from '@ionic/react';
import CaretDown from '../../svgs/CaretDown';
import TroopsNetworkList from './TroopsNetworkList';

import { TroopsCMSState, troopsCMSViewModeDefaults, TroopsCMSViewModeEnum } from '../troopCMSState';
import { CredentialCategoryEnum, useGetIDs } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';

type TroopsNetworkToggleProps = {
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    viewMode: TroopsCMSViewModeEnum;
    isParentBoostLoading?: boolean;
    enableSwitching: boolean;
};

export const TroopsNetworkToggle: React.FC<TroopsNetworkToggleProps> = ({
    state,
    setState,
    viewMode,
    isParentBoostLoading,
    enableSwitching,
}) => {
    const { data: earnedBoostIDs } = useGetIDs();

    const nationalNetworkIds =
        earnedBoostIDs?.filter(
            cred =>
                getDefaultCategoryForCredential(cred) ===
                CredentialCategoryEnum.nationalNetworkAdminId
        ) ?? [];

    const nationalNetworkIdsCount = nationalNetworkIds.length ?? 0;

    const [presentModal, closeModal] = useIonModal(TroopsNetworkList, {
        handleCloseModal: () => closeModal(),
        state: state,
        setState: setState,
        viewMode: viewMode,
        nationalNetworkIds: nationalNetworkIds,
    });

    if (viewMode === TroopsCMSViewModeEnum.global) return <></>;

    if (viewMode === TroopsCMSViewModeEnum.network) {
        const {
            image: globalNetworkImage,
            title: globalNetworkTitle,
            color: globalColor,
        } = troopsCMSViewModeDefaults?.global;

        const globalNetwork = state?.parentID;

        return (
            <div className="w-full rounded-full pl-2 pr-4 py-[6px] flex items-center justify-between border-[1px] border-solid border-grayscale-300 mt-4 mb-4">
                <div className="flex items-center justify-start">
                    <div className="h-[40px] w-[40px] rounded-full bg-white mr-2 overflow-hidden">
                        {isParentBoostLoading ? (
                            <div className="w-full flex items-center justify-center">
                                <IonSpinner
                                    name="crescent"
                                    color="grayscale-900"
                                    className="scale-[1] mt-1"
                                />
                            </div>
                        ) : (
                            <img
                                src={
                                    globalNetwork?.appearance?.badgeThumbnail ?? globalNetworkImage
                                }
                                alt="network thumb"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    <div className="flex flex-col items-start justify-center">
                        <h4
                            className={`text-${globalColor} font-bold p-0 m-0 text-xs font-notoSans`}
                        >
                            Global Network
                        </h4>

                        {isParentBoostLoading ? (
                            <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900 line-clamp-1">
                                {globalNetwork?.basicInfo?.name ?? globalNetworkTitle}
                            </p>
                        ) : (
                            <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900 line-clamp-1">
                                {globalNetwork?.basicInfo?.name ?? globalNetworkTitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const network = state?.parentID;

    const disableClick = !enableSwitching || nationalNetworkIdsCount <= 1;

    return (
        <button
            disabled={disableClick}
            onClick={() => presentModal()}
            className="w-full rounded-full pl-2 pr-4 py-[6px] flex items-center justify-between border-[1px] border-solid border-grayscale-300 mt-4 mb-4"
        >
            <div className="flex items-center justify-start">
                <div className="w-[40px] h-[40px] rounded-full bg-white mr-2 overflow-hidden">
                    {isParentBoostLoading ? (
                        <div className="w-full flex items-center justify-center">
                            <IonSpinner
                                name="crescent"
                                color="grayscale-900"
                                className="scale-[1] mt-1"
                            />
                        </div>
                    ) : (
                        <img
                            src={network?.appearance?.badgeThumbnail}
                            alt="network thumb"
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                <div className="flex flex-col items-start justify-center">
                    <h4 className="text-sp-fire-red font-bold p-0 m-0 text-xs font-notoSans">
                        Network
                    </h4>

                    {isParentBoostLoading ? (
                        <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900 line-clamp-1">
                            ...
                        </p>
                    ) : (
                        <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900 line-clamp-1">
                            {network?.basicInfo?.name}
                        </p>
                    )}
                </div>
            </div>
            {!disableClick && <CaretDown />}
        </button>
    );
};

export default TroopsNetworkToggle;
