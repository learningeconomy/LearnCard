import React from 'react';
import { Updater, useImmer } from 'use-immer';
import { LaunchPadAppListItem, useModal } from 'learn-card-base';

import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import ConsentFlowFooter from './ConsentFlowFooter';
import PrivacyAndDataHeader from './PrivacyAndDataHeader';
import ConsentFlowWriteSharingItem from './ConsentFlowWriteSharingItem';

import {
    AI_CREDENTIAL_TYPE,
    getPrivacyAndDataInfo,
    rawAiCategoryToDisplayName,
} from '../../helpers/contract.helpers';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

type ConsentFlowAiSessionsWriteDetailsModalProps = {
    aiSessionCategories: {
        [key: string]: {
            required: boolean;
            term: ConsentFlowTerms['write']['credentials']['categories'][string];
            setTerm: Updater<ConsentFlowTerms['write']['credentials']['categories'][string]>;
        };
    };
    contractDetails: ConsentFlowContractDetails;
    app?: LaunchPadAppListItem;
};

const ConsentFlowAiSessionsWriteDetailsModal: React.FC<
    ConsentFlowAiSessionsWriteDetailsModalProps
> = ({ aiSessionCategories: _aiSessionCategories, contractDetails, app }) => {
    const { closeModal } = useModal();
    const { name, image, appStyles } = getPrivacyAndDataInfo(contractDetails, app);

    const [aiSessionCategories, setAiSessionCategories] = useImmer(_aiSessionCategories);

    const infoText = {
        [AI_CREDENTIAL_TYPE.AI_ASSESSMENT]: 'Evaluations and feedback from AI tutoring sessions',
        [AI_CREDENTIAL_TYPE.AI_SUMMARY]: 'Written overviews of your AI tutoring sessions',
        [AI_CREDENTIAL_TYPE.AI_TOPIC]: "Subjects and focus areas you're learning",
        [AI_CREDENTIAL_TYPE.LEARNING_PATHWAY]: "Updates to the skills or goals you're working on",
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
                            You're About to{' '}
                            <span className="font-[600] font-notoSans">Enable Data Writing</span> to
                            Your LearningCard
                        </p>
                        <p className="text-grayscale-600 text-[14px] font-notoSans">
                            By continuing, you allow this external service to add the following
                            learning data to your LearnCard:
                        </p>
                    </div>
                    <ul className="bg-white rounded-[8px] w-full flex flex-col overflow-hidden">
                        {Object.entries(aiSessionCategories).map(
                            ([category, { required, term, setTerm }]) => (
                                <ConsentFlowWriteSharingItem
                                    key={category}
                                    term={term}
                                    setTerm={() => {
                                        const newTerm = !term;

                                        // update local state
                                        setAiSessionCategories(draft => {
                                            draft[category].term = newTerm;
                                        });

                                        // update overall state
                                        setTerm(newTerm);
                                    }}
                                    category={category}
                                    required={required}
                                    hideIcon
                                    titleOverride={rawAiCategoryToDisplayName(category)}
                                    infoText={infoText[category as keyof typeof infoText]}
                                />
                            )
                        )}
                    </ul>
                </div>
            </div>
            <ConsentFlowFooter secondaryButtonText="Back" onSecondaryButtonClick={closeModal} />
        </div>
    );
};

export default ConsentFlowAiSessionsWriteDetailsModal;
