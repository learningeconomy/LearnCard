import React from 'react';

import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import ViewContractDataModal from '../ViewContractDataModal';
import ShareContractModal from '../ShareContractModal';
import Share from 'learn-card-base/svgs/Share';

import { useModal, ModalTypes } from 'learn-card-base';

import { ConsentFlowContractDetails } from '@learncard/types';

export const AdminToolsConsentFlowContractItem: React.FC<{
    contract: ConsentFlowContractDetails;
}> = ({ contract }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const openViewContractDataModal = (contract: ConsentFlowContractDetails) => {
        newModal(<ViewContractDataModal contract={contract} />);
    };

    const openShareContractModal = (contract: ConsentFlowContractDetails) => {
        newModal(<ShareContractModal contract={contract} />, {
            sectionClassName: '!max-w-[500px]',
        });
    };

    return (
        <li
            role="button"
            className="w-full ion-no-border px-[12px] py-[12px] border-gray-200 border-b-2 last:border-b-0 flex  bg-grayscale-100 items-center justify-between notificaion-list-item overflow-visible rounded-[12px] mt-2 first:mt-0 shadow-sm"
            onClick={e => {
                e.stopPropagation();
                openViewContractDataModal(contract);
            }}
        >
            <div className="flex items-center justify-start w-full bg-white-100">
                <div className="bg-white flex items-center justify-center rounded-lg w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px] border-[1px] border-grayscale-200">
                    {contract?.image ? (
                        <img
                            className="w-full h-full object-cover bg-white"
                            src={contract?.image}
                            alt={`${contract.name} icon`}
                        />
                    ) : (
                        <img
                            src={EmptyImage}
                            alt="empty face"
                            className="h-[40px] w-[40px] min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] object-cover="
                        />
                    )}
                </div>
                <div className="right-side flex justify-between w-full">
                    <div className="flex flex-col items-start justify-center text-left">
                        <p className="text-grayscale-900 font-medium line-clamp-1">
                            {contract?.name}
                        </p>
                        <p className="text-grayscale-600 font-medium text-[12px] line-clamp-2 pr-1">
                            {contract?.subtitle}
                        </p>
                    </div>

                    <div className="flex app-connect-btn-container items-center rounded-[10px] px-[10px] py-[5px]">
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                openShareContractModal(contract);
                            }}
                        >
                            <Share className="h-[24px] w-[24px] text-grayscale-600" />
                        </button>
                    </div>
                </div>
            </div>
        </li>
    );
};

export default AdminToolsConsentFlowContractItem;
