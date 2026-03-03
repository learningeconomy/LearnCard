import React, { useEffect, useMemo, useState } from 'react';
import { IonRadio, IonRadioGroup, IonInput } from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash-es';

import GenericLoader from '../../../components/generic/GenericLoader';
import AdminToolsModalFooter from '../AdminToolsModal/AdminToolsModalFooter';
import AdminToolsOptionItemHeader from '../AdminToolsModal/helpers/AdminToolsOptionItemHeader';

import {
    LEARNCARD_NETWORK_URL,
    LEARNCARD_NETWORK_STAGING_URL,
} from 'learn-card-base/constants/Networks';
import { useFetchCounts } from '../../../hooks/useFetchCounts';
import { walletStore } from 'learn-card-base/stores/walletStore';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';
import { currentUserStore } from 'learn-card-base/stores/currentUserStore';
import { ModalTypes, useModal, useGetCurrentLCNUser, useConfirmation } from 'learn-card-base';
import { storageOptionsList, StorageOption } from '../AdminToolsStorage/AdminToolsStorageOption';
import { getBespokeLearnCard, clearLearnCardCache } from 'learn-card-base/helpers/walletHelpers';

export const NetworkOptionsEnum = {
    production: 'production',
    staging: 'staging',
    custom: 'custom',
} as const;

type NetworkType = keyof typeof NetworkOptionsEnum | 'production' | 'staging' | 'custom';

export type NetworkOption = {
    label: string;
    endpoint: string;
    type: NetworkType;
};

export const networkOptionsList: NetworkOption[] = [
    { label: 'Production', endpoint: LEARNCARD_NETWORK_URL, type: NetworkOptionsEnum.production },
    { label: 'Staging', endpoint: LEARNCARD_NETWORK_STAGING_URL, type: NetworkOptionsEnum.staging },
    { label: 'Custom', endpoint: '', type: NetworkOptionsEnum.custom },
];

export const networkSwitchMessages = [
    'Dialing into the new network…',
    'Calibrating data streams…',
    'Authenticating secure connection…',
    'Establishing encrypted handshake…',
    'Routing packets through the new endpoint…',
    'Syncing with updated storage cluster…',
    'Optimizing transfer protocols…',
    'Verifying network credentials…',
    'Loading configuration settings…',
    'Finalizing secure link…',
];

const AdminToolsNetworkOption: React.FC<{ option: AdminToolOption; showFooter?: boolean }> = ({
    option,
    showFooter,
}) => {
    const queryClient = useQueryClient();
    const confirm = useConfirmation();
    const { newModal, closeAllModals, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const [selectedType, setSelectedType] = useState<NetworkType>();
    const [customEndpoint, setCustomEndpoint] = useState<string>('');

    const { refetchAll } = useFetchCounts();
    const { refetch: refetchUser } = useGetCurrentLCNUser();

    useEffect(() => {
        const currentNetworkUrl = networkStore.get.networkUrl();
        if (currentNetworkUrl === LEARNCARD_NETWORK_URL) {
            setSelectedType(NetworkOptionsEnum.production);
        } else if (currentNetworkUrl === LEARNCARD_NETWORK_STAGING_URL) {
            setSelectedType(NetworkOptionsEnum.staging);
        } else {
            setSelectedType(NetworkOptionsEnum.custom);
            setCustomEndpoint(currentNetworkUrl);
        }
    }, []);

    const selectedOption: NetworkOption = useMemo(() => {
        if (selectedType === NetworkOptionsEnum.custom) {
            return { label: 'Custom', endpoint: customEndpoint, type: NetworkOptionsEnum.custom };
        }
        return networkOptionsList.find(o => o.type === selectedType)!;
    }, [selectedType, customEndpoint]);

    const handleSwitchNetwork = async (switchStorage: boolean) => {
        try {
            newModal(
                <GenericLoader overrideText={_.shuffle(networkSwitchMessages)} />,
                {
                    disableCloseHandlers: true,
                },
                {}
            );

            // Update network URL in the network store
            networkStore.set.networkUrl(selectedOption.endpoint);

            // Update cloud URL in the network store
            if (switchStorage) {
                const storageOption = storageOptionsList.find(
                    (o: StorageOption) => o.type === selectedOption.type
                );
                networkStore.set.cloudUrl(storageOption?.endpoint!);
            }

            // Clear caches and reinitialize wallet
            clearLearnCardCache();
            walletStore.set.wallet(null);

            // Reinitialize wallet
            const currentUserPK = currentUserStore.get.currentUserPK();
            if (currentUserPK) {
                const wallet = await getBespokeLearnCard(currentUserPK);
                walletStore.set.wallet(wallet);
                await wallet.invoke.clearDidWebCache();
            }

            // Clear query cache
            queryClient.clear();
            // refetch credentials
            await refetchAll();
            // refetch user
            await refetchUser();

            closeAllModals();
        } catch (error) {
            closeModal();
            console.error(error);
        }
    };

    const handleSave = async () => {
        // prompt the user to confirm the store/network switch for prod & staging
        if (
            selectedOption.type === NetworkOptionsEnum.production ||
            selectedOption.type === NetworkOptionsEnum.staging
        ) {
            const confirmed = await confirm({
                title: 'Confirm Network Change',
                text: `You are switching network to ${selectedOption.label}. Do you also want to switch storage to ${selectedOption.label}?`,
                cancelText: 'No',
                confirmText: 'Yes',
                confirmButtonClassName: 'bg-emerald-700 text-white px-4 py-2 rounded-[16px]',
                cancelButtonClassName: 'bg-gray-200 text-gray-700 px-4 py-2 rounded-[16px]',
            });

            if (confirmed) {
                await handleSwitchNetwork(true);
            } else {
                await handleSwitchNetwork(false);
            }

            return;
        }

        // switch storage for custom
        await handleSwitchNetwork(false);
    };

    const isCustomInvalid =
        selectedType === NetworkOptionsEnum.custom &&
        (customEndpoint.trim() === '' ||
            !/^https?:\/\/[\w.-]+(:\d+)?(\/.*)?$/i.test(customEndpoint.trim()));

    return (
        <section className="h-full w-full flex items-start justify-center overflow-y-scroll pt-4">
            <section className="bg-white max-w-[800px] w-full rounded-[20px]">
                <AdminToolsOptionItemHeader option={option} className="!pb-1" />

                <div className="w-full flex flex-col items-center justify-center px-4">
                    <IonRadioGroup
                        value={selectedType}
                        onIonChange={e => setSelectedType(e.detail.value as NetworkType)}
                        className="w-full"
                    >
                        {networkOptionsList.map((opt, index) => {
                            const isSelected = selectedType === opt.type;
                            return (
                                <fieldset
                                    key={index}
                                    className="w-full flex flex-col gap-3 border-b border-solid border-b-gray-200 py-3 first:pt-0 last:pb-6 last:border-b-0"
                                >
                                    <section className="w-full justify-between items-center flex gap-3">
                                        <label className="flex flex-col flex-1 gap-1">
                                            <h6 className="text-grayscale-900 text-lg font-poppins">
                                                {opt.label}
                                            </h6>
                                            <span className="text-grayscale-700 text-sm font-poppins">
                                                {opt.label} network
                                            </span>
                                        </label>

                                        <div
                                            className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${
                                                isSelected
                                                    ? 'bg-emerald-700 text-white'
                                                    : 'bg-grayscale-100 text-transparent'
                                            }`}
                                        >
                                            <IonRadio
                                                value={opt.type}
                                                className="w-full h-full ml-2"
                                                color="white"
                                                mode="ios"
                                            />
                                        </div>
                                    </section>

                                    {opt.type === NetworkOptionsEnum.custom && (
                                        <div
                                            onClick={e => e.stopPropagation()}
                                            onMouseDown={e => e.stopPropagation()}
                                        >
                                            <IonInput
                                                type="url"
                                                inputmode="url"
                                                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-sm w-full"
                                                placeholder="Enter network URL (e.g., https://network.example.com)"
                                                value={customEndpoint}
                                                onIonInput={e =>
                                                    setCustomEndpoint(String(e.detail.value ?? ''))
                                                }
                                                debounce={0}
                                            />
                                            {isCustomInvalid && (
                                                <p className="text-xs text-red-600 mt-2 ml-2">
                                                    Please enter a valid URL starting with http://
                                                    or https://
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </fieldset>
                            );
                        })}
                    </IonRadioGroup>
                </div>
            </section>

            {showFooter && (
                <AdminToolsModalFooter
                    isDisabled={isCustomInvalid}
                    onSave={handleSave}
                    showSaveButton
                    className="z-50"
                />
            )}
        </section>
    );
};

export default AdminToolsNetworkOption;
