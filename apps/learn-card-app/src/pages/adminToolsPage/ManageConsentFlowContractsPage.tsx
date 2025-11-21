import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonSpinner } from '@ionic/react';
import Share from '../../components/svgs/Share';
import AdminPageStructure from './AdminPageStructure';
import CreateContractModal from './CreateContractModal';
import ViewContractDataModal from './ViewContractDataModal';
import ShareContractModal from './ShareContractModal';

import { useModal, useGetCurrentLCNUser, useGetContracts } from 'learn-card-base';
import { ConsentFlowContractDetails } from '@learncard/types';

const ManageConsentFlowContractsPage: React.FC = () => {
    const history = useHistory();
    const { newModal } = useModal();

    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    const isServiceProfile = currentLCNUser?.isServiceProfile;

    const { data: paginatedContracts, refetch, isLoading: contractsLoading } = useGetContracts();
    const contracts = paginatedContracts?.records;

    const openNewContractModal = () => {
        newModal(<CreateContractModal onSuccess={() => refetch()} />);
    };

    const openViewContractDataModal = (contract: ConsentFlowContractDetails) => {
        newModal(<ViewContractDataModal contract={contract} />);
    };

    const openShareContractModal = (contract: ConsentFlowContractDetails) => {
        newModal(<ShareContractModal contract={contract} />, {
            sectionClassName: '!max-w-[500px]',
        });
    };

    return (
        <AdminPageStructure title="Manage ConsentFlow Contracts">
            {currentLCNUserLoading && (
                <div className="w-[500px] h-[200px] flex flex-col gap-[5px] items-center justify-center">
                    <IonSpinner color="dark" />
                    <span>Loading...</span>
                </div>
            )}
            {!currentLCNUserLoading && (
                <>
                    {isServiceProfile && (
                        <>
                            <button
                                onClick={openNewContractModal}
                                className="py-[5px] px-[15px] rounded-full bg-emerald-700 text-white text-[20px] shadow-box-bottom"
                            >
                                Create New Contract
                            </button>
                            {contracts?.length > 0 && (
                                <ul className="w-full max-w-[500px] relative">
                                    {contracts.map(
                                        (contract: ConsentFlowContractDetails, index: number) => (
                                            <li
                                                key={index}
                                                role="button"
                                                className="flex gap-[10px] items-center text-left w-full text-[18px] border-b-[1px] border-solid border-grayscale-200 last:border-b-0 py-[15px]"
                                                onClick={() => openViewContractDataModal(contract)}
                                            >
                                                <img
                                                    src={contract.image}
                                                    className="h-[40px] w-[40px] rounded-full"
                                                />
                                                <div className="flex flex-col">
                                                    <p className="text-grayscale-900 font-medium line-clamp-1">
                                                        {contract?.name}
                                                    </p>
                                                    <p className="text-grayscale-600 font-medium text-[12px] line-clamp-1">
                                                        {contract?.subtitle}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        openShareContractModal(contract);
                                                    }}
                                                    className="h-[24px] w-[24px] ml-auto"
                                                >
                                                    <Share />
                                                </button>
                                            </li>
                                        )
                                    )}
                                </ul>
                            )}
                            {contracts?.length === 0 && <span>No existing contracts</span>}
                            {contractsLoading && (
                                <div className="w-[500px] h-[200px] flex flex-col gap-[5px] items-center justify-center">
                                    <IonSpinner color="dark" />
                                    <span>Loading Contracts...</span>
                                </div>
                            )}
                        </>
                    )}
                    {!isServiceProfile && (
                        <div className="flex flex-col gap-[20px]">
                            <span>Must be logged in as a Service Profile to manage contracts</span>

                            <button
                                className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                                onClick={() => history.push('/admin-tools/service-profiles')}
                            >
                                Manage Service Profiles
                            </button>
                        </div>
                    )}
                </>
            )}
        </AdminPageStructure>
    );
};

export default ManageConsentFlowContractsPage;
