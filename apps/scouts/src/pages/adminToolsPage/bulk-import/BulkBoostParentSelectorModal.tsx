import React from 'react';

import { IonSpinner } from '@ionic/react';
import Checkmark from '../../../components/svgs/Checkmark';

import {
    CredentialCategoryEnum,
    useGetCredentialWithEdits,
    useGetIDs,
    useModal,
    useResolveBoost,
} from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { SetState } from 'packages/shared-types/dist';

type BulkBoostParentSelectorModalProps = {
    parentUri?: string;
    setParentUri: SetState<string>;
};

const BulkBoostParentSelectorModal: React.FC<BulkBoostParentSelectorModalProps> = ({
    parentUri,
    setParentUri,
}) => {
    const { closeModal } = useModal();
    const { data: earnedBoostIDs, isLoading } = useGetIDs();

    const nationalNetworkIds =
        earnedBoostIDs?.filter(
            cred =>
                getDefaultCategoryForCredential(cred) ===
                CredentialCategoryEnum.nationalNetworkAdminId
        ) ?? [];

    return (
        <div className="flex items-center justify-center py-[20px]">
            {isLoading && (
                <div className="w-[300px] h-[300px] flex items-center justify-center">
                    <IonSpinner color="dark" />
                </div>
            )}
            {!isLoading && (
                <div className="w-[400px] min-h-[50px] bg-white px-[20px]">
                    {nationalNetworkIds.map(networkId => (
                        <NetworkItem
                            key={networkId.boostId}
                            networkUri={networkId.boostId}
                            onClick={() => {
                                setParentUri(networkId.boostId);
                                closeModal();
                            }}
                            isSelected={networkId.boostId === parentUri}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

type NetworkItemProps = {
    networkUri: string;
    isSelected: boolean;
    onClick: () => {};
};

const NetworkItem: React.FC<NetworkItemProps> = ({ networkUri, isSelected, onClick }) => {
    const { data: _resolvedNetworkBoost } = useResolveBoost(networkUri, !networkUri);
    const { credentialWithEdits } = useGetCredentialWithEdits(_resolvedNetworkBoost, networkUri);
    const resolvedNetworkBoost = credentialWithEdits ?? _resolvedNetworkBoost;

    const thumbnail = resolvedNetworkBoost?.image;
    const name = resolvedNetworkBoost?.name;

    return (
        <button
            onClick={onClick}
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

            {isSelected ? (
                <span className="flex items-center justify-center bg-sp-green-forest-light rounded-full shadow-3xl min-w-[40px] min-h-[40px]">
                    <Checkmark className="w-7 h-auto text-white" />
                </span>
            ) : null}
        </button>
    );
};

export default BulkBoostParentSelectorModal;
