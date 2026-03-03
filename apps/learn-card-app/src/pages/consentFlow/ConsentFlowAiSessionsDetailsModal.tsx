import React from 'react';
import { Updater, useImmer } from 'use-immer';
import {
    CredentialCategoryEnum,
    LaunchPadAppListItem,
    categoryMetadata,
    contractCategoryNameToCategoryMetadata,
    useModal,
} from 'learn-card-base';

import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import ConsentFlowFooter from './ConsentFlowFooter';
import PrivacyAndDataHeader from './PrivacyAndDataHeader';
import ConsentFlowReadSharingItem from './ConsentFlowReadSharingItem';

import { getPrivacyAndDataInfo } from '../../helpers/contract.helpers';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

type ConsentFlowAiSessionsDetailsModalProps = {
    aiSessionCategories: {
        [key: string]: {
            required: boolean;
            term: ConsentFlowTerms['read']['credentials']['categories'][string];
            setTerm: Updater<ConsentFlowTerms['read']['credentials']['categories'][string]>;
        };
    };

    contractDetails: ConsentFlowContractDetails;
    app?: LaunchPadAppListItem;
};

const ConsentFlowAiSessionsDetailsModal: React.FC<ConsentFlowAiSessionsDetailsModalProps> = ({
    aiSessionCategories: _aiSessionCategories,
    contractDetails,
    app,
}) => {
    const { closeModal } = useModal();
    const { name, image, appStyles } = getPrivacyAndDataInfo(contractDetails, app);

    const [aiSessionCategories, setAiSessionCategories] = useImmer(_aiSessionCategories);

    const infoText = {
        [categoryMetadata[CredentialCategoryEnum.aiAssessment].contractCredentialTypeOverride!]:
            'Evaluations of your progress during tutoring',
        [categoryMetadata[CredentialCategoryEnum.aiSummary].contractCredentialTypeOverride!]:
            'Brief overviews of your tutoring conversations',
        [categoryMetadata[CredentialCategoryEnum.aiTopic].contractCredentialTypeOverride!]:
            "The subjects and areas you're actively exploring",
        [categoryMetadata[CredentialCategoryEnum.aiPathway].contractCredentialTypeOverride!]:
            "The goals and skills you're currently working towards",
    };

    return (
        <div className="h-full">
            <PrivacyAndDataHeader name={name} image={image} />
            <div
                className="h-full w-full flex flex-col gap-[20px] overflow-y-auto p-[20px] pb-[300px]"
                style={appStyles}
            >
                <div className="text-grayscale-900 text-[14px] rounded-[15px] bg-white w-full p-[15px] flex flex-col gap-[10px] shadow-box-bottom">
                    <h4 className="text-grayscale-900 text-[20px] font-notoSans flex items-center gap-[10px]">
                        <div
                            className={`flex items-center justify-center h-[40px] w-[40px] rounded-full shrink-0 bg-[#67E8F9]`}
                            role="presentation"
                        >
                            <BlueMagicWand className={`h-[30px] w-[30px]`} />
                        </div>
                        AI Sessions
                    </h4>
                    <div className="flex flex-col gap-[5px]">
                        <p className="text-grayscale-600 text-[14px] font-notoSans">
                            You're About to Share Your{' '}
                            <span className="font-[600] font-notoSans">AI Learning Data</span>
                        </p>
                        <p className="text-grayscale-600 text-[14px] font-notoSans">
                            By continuing, you consent to share the following information with this
                            external service to enhance your learning experience:
                        </p>
                    </div>
                    <ul className="bg-white rounded-[8px] w-full flex flex-col overflow-hidden">
                        {Object.entries(aiSessionCategories).map(
                            ([category, { required, term, setTerm }]) => (
                                <ConsentFlowReadSharingItem
                                    key={category}
                                    term={term}
                                    category={category}
                                    required={required}
                                    hideIcon
                                    titleOverride={
                                        contractCategoryNameToCategoryMetadata(category)?.title
                                    }
                                    infoText={infoText[category as keyof typeof infoText]}
                                    onClickOverride={() => {
                                        const newTerm = {
                                            shareAll: !term.shareAll,
                                            sharing: !term.shareAll,
                                            shared: !term.shareAll ? term.shared : [],
                                        };

                                        // update local state
                                        setAiSessionCategories(draft => {
                                            draft[category].term = newTerm;
                                        });

                                        // update overall state
                                        setTerm(newTerm);
                                    }}
                                />
                            )
                        )}
                    </ul>
                    <p className="text-grayscale-600 text-[14px] font-notoSans">
                        Your data will only be used to support your educational journey and improve
                        personalized learning tools
                    </p>
                </div>
            </div>
            <ConsentFlowFooter secondaryButtonText="Back" onSecondaryButtonClick={closeModal} />
        </div>
    );
};

export default ConsentFlowAiSessionsDetailsModal;
