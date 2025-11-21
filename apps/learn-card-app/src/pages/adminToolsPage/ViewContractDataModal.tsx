import React from 'react';
import { useGetConsentFlowData, useModal } from 'learn-card-base';

import Share from '../../components/svgs/Share';
import ShareContractModal from './ShareContractModal';
import { IonSpinner } from '@ionic/react';

import { ConsentFlowContractDetails } from '@learncard/types';

type ViewContractDataModalProps = {
    contract: ConsentFlowContractDetails;
};

const ViewContractDataModal: React.FC<ViewContractDataModalProps> = ({ contract }) => {
    const { newModal } = useModal();
    const { name, image, uri } = contract;

    const { data: paginatedData, isLoading } = useGetConsentFlowData(uri);
    const data = paginatedData?.records;

    const openShareContractModal = (contract: ConsentFlowContractDetails) => {
        newModal(<ShareContractModal contract={contract} />, {
            sectionClassName: '!max-w-[500px]',
        });
    };

    // could definitely present this prettier
    const list = data?.map((terms, index) => (
        <li key={terms.personal.Name ?? index} className="flex gap-2">
            <pre>{JSON.stringify(terms, null, 4)}</pre>
        </li>
    ));

    return (
        <section className="text-grayscale-900 h-full w-full p-[30px] min-h-[300px]">
            <h1 className="text-[24px] flex gap-[15px] justify-center items-center">
                {/* <img src={contract.image} className="h-[40px] w-[40px] rounded-full" /> */}
                {name}
                <button
                    onClick={e => {
                        e.stopPropagation();
                        openShareContractModal(contract);
                    }}
                    className="h-[24px] w-[24px]"
                >
                    <Share />
                </button>
            </h1>
            {!isLoading && data?.length > 0 && <ol className="flex-grow">{list}</ol>}
            {!isLoading && data?.length === 0 && (
                <p className="h-[200px] flex items-center justify-center">
                    No one has consented to this contract yet
                </p>
            )}
            {isLoading && (
                <div className="w-[500px] h-[200px] flex flex-col gap-[5px] items-center justify-center">
                    <IonSpinner color="dark" />
                    <span>Loading...</span>
                </div>
            )}
        </section>
    );
};

export default ViewContractDataModal;
