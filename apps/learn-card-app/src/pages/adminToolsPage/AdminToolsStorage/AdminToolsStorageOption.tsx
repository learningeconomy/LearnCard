import React, { useEffect, useMemo, useState } from 'react';
import { IonRadio, IonRadioGroup, IonInput } from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';

import GenericLoader from '../../../components/generic/GenericLoader';
import AdminToolsModalFooter from '../AdminToolsModal/AdminToolsModalFooter';
import AdminToolsOptionItemHeader from '../AdminToolsModal/helpers/AdminToolsOptionItemHeader';

import { useFetchCounts } from '../../../hooks/useFetchCounts';
import { walletStore } from 'learn-card-base/stores/walletStore';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';
import { currentUserStore } from 'learn-card-base/stores/currentUserStore';
import { networkOptionsList, NetworkOption } from '../AdminToolsNetwork/AdminToolsNetwork';
import { LEARNCLOUD_URL, LEARNCLOUD_STAGING_URL } from 'learn-card-base/constants/Networks';
import { ModalTypes, useGetCurrentLCNUser, useModal, useConfirmation } from 'learn-card-base';
import { clearLearnCardCache, getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';

export const StorageOptionsEnum = {
    production: 'production',
    staging: 'staging',
    custom: 'custom',
} as const;

type StorageType = keyof typeof StorageOptionsEnum | 'production' | 'staging' | 'custom';

export type StorageOption = {
    label: string;
    endpoint: string;
    type: StorageType;
};

export const storageOptionsList: StorageOption[] = [
    { label: 'Production', endpoint: LEARNCLOUD_URL, type: StorageOptionsEnum.production },
    { label: 'Staging', endpoint: LEARNCLOUD_STAGING_URL, type: StorageOptionsEnum.staging },
    { label: 'Custom', endpoint: '', type: StorageOptionsEnum.custom },
];

export const storageSwitchMessages = [
    'Packing up the data boxes…',
    'Rolling the storage cart over…',
    'Loading the data truck…',
    'Checking the storage map…',
    'Dusting off the new shelves…',
    'Labeling the storage bins…',
    'Polishing the data cabinets…',
    'Making sure nothing’s left behind…',
    'Putting the new key in the lock…',
    'Closing the old storage door…',
];

const AdminToolsStorageOption: React.FC<{ option: AdminToolOption; showFooter?: boolean }> = ({
    option,
    showFooter,
}) => {
    const queryClient = useQueryClient();
    const confirm = useConfirmation();
    const { newModal, closeAllModals, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const [selectedType, setSelectedType] = useState<StorageType>();
    const [customEndpoint, setCustomEndpoint] = useState<string>('');

    const { refetchAll } = useFetchCounts();
    const { refetch: refetchUser } = useGetCurrentLCNUser();

    useEffect(() => {
        const currentCloudUrl = networkStore.get.cloudUrl();
        if (currentCloudUrl === LEARNCLOUD_URL) {
            setSelectedType(StorageOptionsEnum.production);
        } else if (currentCloudUrl === LEARNCLOUD_STAGING_URL) {
            setSelectedType(StorageOptionsEnum.staging);
        } else {
            setSelectedType(StorageOptionsEnum.custom);
            setCustomEndpoint(currentCloudUrl);
        }
    }, []);

    const selectedOption: StorageOption = useMemo(() => {
        if (selectedType === StorageOptionsEnum.custom) {
            return { label: 'Custom', endpoint: customEndpoint, type: StorageOptionsEnum.custom };
        }
        return storageOptionsList.find(o => o.type === selectedType)!;
    }, [selectedType, customEndpoint]);

    const handleSwitchStorage = async (switchNetwork: boolean) => {
        try {
            newModal(
                <GenericLoader overrideText={_.shuffle(storageSwitchMessages)} />,
                {
                    disableCloseHandlers: true,
                },
                {}
            );

            // Update cloud URL in the network store
            networkStore.set.cloudUrl(selectedOption.endpoint);

            // Update network URL in the network store
            if (switchNetwork) {
                const networkOption = networkOptionsList.find(
                    (o: NetworkOption) => o.type === selectedOption.type
                );
                networkStore.set.networkUrl(networkOption?.endpoint!);
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
            selectedOption.type === StorageOptionsEnum.production ||
            selectedOption.type === StorageOptionsEnum.staging
        ) {
            const confirmed = await confirm({
                title: 'Confirm Storage Change',
                text: `You are switching storage to ${selectedOption.label}. Do you also want to switch network to ${selectedOption.label}?`,
                cancelText: 'No',
                confirmText: 'Yes',
                confirmButtonClassName: 'bg-emerald-700 text-white px-6 py-2 rounded-[16px]',
                cancelButtonClassName: 'bg-gray-200 text-gray-700 px-6 py-2 rounded-[16px]',
            });

            if (confirmed) {
                await handleSwitchStorage(true);
            } else {
                await handleSwitchStorage(false);
            }

            return;
        }

        // switch storage for custom
        await handleSwitchStorage(false);
    };

    const isCustomInvalid =
        selectedType === StorageOptionsEnum.custom &&
        (customEndpoint.trim() === '' ||
            !/^https?:\/\/[\w.-]+(:\d+)?(\/.*)?$/i.test(customEndpoint.trim()));

    return (
        <section className="h-full w-full flex items-start justify-center overflow-y-scroll pt-4">
            <section className="bg-white max-w-[800px] w-full rounded-[20px]">
                <AdminToolsOptionItemHeader option={option} className="!pb-1" />

                <div className="w-full flex flex-col items-center justify-center px-4">
                    <IonRadioGroup
                        value={selectedType}
                        onIonChange={e => setSelectedType(e.detail.value as StorageType)}
                        className="w-full"
                    >
                        {storageOptionsList.map((opt, index) => {
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
                                                {opt.label} storage
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

                                    {opt.type === StorageOptionsEnum.custom && (
                                        <div
                                            onClick={e => e.stopPropagation()}
                                            onMouseDown={e => e.stopPropagation()}
                                        >
                                            <IonInput
                                                type="url"
                                                inputmode="url"
                                                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-sm w-full"
                                                placeholder="Enter storage URL (e.g., https://api.example.com)"
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

export default AdminToolsStorageOption;
