import React from 'react';

import EndorsementRelationshipSelector from './EndorsementRelationshipSelector';
import RelationshipIcon from 'learn-card-base/svgs/RelationshipIcon';
import CaretDown from 'learn-card-base/svgs/CaretDown';

import { VC } from '@learncard/types';
import { CredentialCategoryEnum, useGetVCInfo, useModal, ModalTypes } from 'learn-card-base';
import { EndorsementState } from './endorsement-state.helpers';

export const EndorsementRelationshipForm: React.FC<{
    credential: VC;
    categoryType: CredentialCategoryEnum;
    endorsement: EndorsementState;
    setEndorsement: React.Dispatch<React.SetStateAction<EndorsementState>>;
}> = ({ credential, categoryType, endorsement, setEndorsement }) => {
    const { issueeName, issueeProfile } = useGetVCInfo(credential, categoryType);
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const openRelationshipSelector = () => {
        newModal(
            <EndorsementRelationshipSelector
                endorsement={endorsement}
                setEndorsement={setEndorsement}
            />,
            {
                sectionClassName: '!max-w-[500px]',
                usePortal: true,
                hideButton: true,
                portalClassName: '!max-w-[500px]',
            }
        );
    };

    return (
        <div className="w-full flex flex-col items-start gap-4 justify-start py-4 px-4 cursor-pointer bg-white rounded-[20px] mt-2 shadow-bottom-2-4">
            <p className="text-[17px] text-grayscale-900 text-left">
                How do you know {issueeProfile?.displayName || issueeName}?
            </p>

            <button
                onClick={openRelationshipSelector}
                className="w-full rounded-full pl-[5px] pr-4 py-[6px] flex items-center justify-between border-[1px] border-solid border-grayscale-200 bg-grayscale-50"
            >
                <div className="flex items-center justify-start">
                    <div className="w-[40px] h-[40px] rounded-full mr-2 overflow-hidden flex items-center justify-center">
                        <RelationshipIcon />
                    </div>
                    <div className="flex flex-col items-start justify-center">
                        <h4 className="text-grayscale-600 text-left font-[500]  text-xs uppercase">
                            Relationship
                        </h4>

                        <p className="text-grayscale-900 text-left text-[17px]">
                            {endorsement?.relationship?.label}
                        </p>
                    </div>
                </div>
                <CaretDown className="w-[20px] h-[20px] text-grayscale-800" />
            </button>
        </div>
    );
};

export default EndorsementRelationshipForm;
