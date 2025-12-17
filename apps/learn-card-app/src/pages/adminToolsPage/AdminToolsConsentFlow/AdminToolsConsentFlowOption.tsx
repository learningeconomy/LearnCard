import React from 'react';

import AdminToolsAccountSwitcherButton from '../AdminToolsAccountSwitcher/AdminToolsAccountSwitcherButton';
import AdminToolsConsentFlowContractSkeletonLoader from './AdminToolsConsentFlowContractSkeletonLoader';
import AdminToolsConsentFlowServiceProfileWarning from './AdminToolsConsentFlowServiceProfileWarning';
import AdminToolsOptionItemHeader from '../AdminToolsModal/helpers/AdminToolsOptionItemHeader';
import AdminToolsConsentFlowContractItem from './AdminToolsConsentFlowContractItem';
import { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';
import CreateContractModal from '../CreateContractModal';

import { useGetCurrentLCNUser, useModal, ModalTypes, useGetContracts } from 'learn-card-base';

import { ConsentFlowContractDetails } from '@learncard/types';

import { useTheme } from '../../../theme/hooks/useTheme';

export const AdminToolsConsentFlowOption: React.FC<{ option: AdminToolOption }> = ({ option }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    const isServiceProfile = currentLCNUser?.isServiceProfile;

    const { data: paginatedContracts, refetch, isLoading: contractsLoading } = useGetContracts();
    const contracts = paginatedContracts?.records;

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const openNewContractModal = () => {
        newModal(<CreateContractModal onSuccess={() => refetch()} />, {
            sectionClassName: '!max-w-[500px] !max-h-[70vh]',
            usePortal: true,
            hideButton: true,
            portalClassName: '!max-w-[500px]',
        });
    };

    return (
        <section className="h-full w-full flex flex-col items-center justify-start overflow-y-scroll pt-4">
            <section className="flex flex-col items-center justify-center bg-white max-w-[800px] w-full rounded-[20px]">
                <AdminToolsOptionItemHeader
                    option={option}
                    onClick={() => openNewContractModal()}
                    isDisabled={!isServiceProfile}
                />

                <div className="flex items-center justify-center w-full px-4">
                    <div className="flex items-center justify-center w-full border-grayscale-100 border-[1px] rounded-[20px]" />
                </div>

                {!isServiceProfile && <AdminToolsConsentFlowServiceProfileWarning />}

                <div className="flex flex-col items-start justify-center w-full px-4">
                    <AdminToolsAccountSwitcherButton showServiceProfilesOnly />
                </div>
            </section>

            {isServiceProfile && (
                <section className="flex flex-col items-center justify-center bg-white max-w-[800px] w-full rounded-[20px] mt-4">
                    <div className="flex flex-col items-start justify-center w-full px-4 pt-4">
                        <h4 className="text-lg text-grayscale-900 font-notoSans text-left">
                            Contracts
                        </h4>
                    </div>
                    {contracts?.length > 0 && (
                        <ul className="w-full relative ion-padding">
                            {contracts.map(
                                (contract: ConsentFlowContractDetails, index: number) => {
                                    return (
                                        <AdminToolsConsentFlowContractItem
                                            contract={contract}
                                            key={index}
                                        />
                                    );
                                }
                            )}
                        </ul>
                    )}
                    {contracts?.length === 0 && (
                        <div className="flex items-center justify-center w-full pt-4 pb-6">
                            <p className="text-grayscale-600">No existing contracts.</p>
                        </div>
                    )}
                    {contractsLoading && <AdminToolsConsentFlowContractSkeletonLoader />}
                </section>
            )}
        </section>
    );
};

export default AdminToolsConsentFlowOption;
