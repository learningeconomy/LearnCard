import React, { useEffect } from 'react';

import { IonSpinner } from '@ionic/react';
import CaretDown from '../../../components/svgs/CaretDown';
import BulkBoostParentSelectorModal from './BulkBoostParentSelectorModal';

import {
    CredentialCategoryEnum,
    ModalTypes,
    useGetBoost,
    useGetIDs,
    useModal,
} from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { SetState } from 'packages/shared-types/dist';

type BulkBoostParentSelectorProps = { parentUri?: string; setParentUri: SetState<string> };

// Based on TroopsNetworkToggle.tsx
const BulkBoostParentSelector: React.FC<BulkBoostParentSelectorProps> = ({
    parentUri,
    setParentUri,
}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Center, mobile: ModalTypes.Center });

    const { data: earnedBoostIDs } = useGetIDs();

    const nationalNetworkIds =
        earnedBoostIDs?.filter(
            cred =>
                getDefaultCategoryForCredential(cred) ===
                CredentialCategoryEnum.nationalNetworkAdminId
        ) ?? [];

    const { data: networkBoost, isLoading } = useGetBoost(parentUri);
    const networkName = networkBoost?.meta?.edits?.name ?? networkBoost?.name;
    const networkImage = networkBoost?.meta?.edits?.badgeThumbnail ?? networkBoost?.boost?.image;

    const presentModal = () => {
        newModal(
            <BulkBoostParentSelectorModal parentUri={parentUri} setParentUri={setParentUri} />,
            { sectionClassName: '!max-w-[400px]' }
        );
    };

    // auto select the only available network
    useEffect(() => {
        if (nationalNetworkIds?.length === 1) {
            setParentUri(nationalNetworkIds[0].boostId);
        }
    }, [nationalNetworkIds]);

    return (
        <button
            onClick={() => presentModal()}
            className="w-full rounded-full pl-2 pr-4 py-[6px] flex items-center justify-between border-[1px] border-solid border-grayscale-300 mt-4 mb-4 h-[58px]"
        >
            {!parentUri && (
                <p className="m-0 pl-[10px] p-0 text-lg font-notoSans text-grayscale-600 line-clamp-1">
                    Select a network...
                </p>
            )}
            {parentUri && (
                <>
                    <div className="flex items-center justify-start">
                        <div className="w-[40px] h-[40px] rounded-full bg-white mr-2 overflow-hidden">
                            {isLoading ? (
                                <div className="w-full flex items-center justify-center">
                                    <IonSpinner
                                        name="crescent"
                                        color="grayscale-900"
                                        className="scale-[1] mt-1"
                                    />
                                </div>
                            ) : (
                                <img
                                    src={networkImage}
                                    alt="network thumb"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        <div className="flex flex-col items-start justify-center">
                            <h4 className="text-sp-fire-red font-bold p-0 m-0 text-xs font-notoSans">
                                Network
                            </h4>

                            {isLoading ? (
                                <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900 line-clamp-1">
                                    ...
                                </p>
                            ) : (
                                <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900 line-clamp-1">
                                    {networkName}
                                </p>
                            )}
                        </div>
                    </div>
                    {nationalNetworkIds?.length > 0 && <CaretDown />}
                </>
            )}
        </button>
    );
};

export default BulkBoostParentSelector;
