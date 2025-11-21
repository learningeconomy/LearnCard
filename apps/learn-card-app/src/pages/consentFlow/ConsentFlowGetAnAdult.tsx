import React from 'react';

import {
    useModal,
    currentUserStore,
    UserProfilePicture,
    LaunchPadAppListItem,
} from 'learn-card-base';

import { IonSpinner } from '@ionic/react';
import ConsentFlowFooter from './ConsentFlowFooter';
import ConsentFlowHeader from './ConsentFlowHeader';

import { ConsentFlowContractDetails } from '@learncard/types';

type ConsentFlowGetAnAdultPromptProps = {
    contractDetails?: ConsentFlowContractDetails;
    handleNextStep: () => void;
    isPreview?: boolean;
    app?: LaunchPadAppListItem;
};

export const ConsentFlowGetAnAdultPrompt: React.FC<ConsentFlowGetAnAdultPromptProps> = ({
    contractDetails,
    handleNextStep,
    isPreview,
    app,
}) => {
    const { closeModal } = useModal();

    const parentUser = currentUserStore.use.parentUser();
    const { name: parentName } = parentUser || {};

    if (!contractDetails) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[300px]">
                <IonSpinner name="crescent" color="grayscale-900" className="scale-[2] mb-8 mt-6" />
                <p className="font-poppins text-grayscale-900">Loading...</p>
            </div>
        );
    }

    return (
        <>
            <div className="w-full flex flex-col justify-center items-center gap-[20px] bg-white rounded-[24px] px-[20px] py-[30px] shadow-box-bottom">
                <div className="flex flex-col gap-[15px] border-b-[1px] border-solid border-grayscale-200 pb-[20px] w-full">
                    <ConsentFlowHeader contractDetails={contractDetails} app={app} />

                    <div className="flex flex-col">
                        <div className="w-full text-center text-grayscale-900 text-[17px] font-poppins px-[30px] leading-[130%] tracking-[-0.25px]">
                            Add to LearnCard.
                        </div>
                        <div className="w-full text-center text-grayscale-900 text-[17px] font-poppins px-[10px] leading-[130%] tracking-[-0.25px]">
                            Save your progress and skills.
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-[10px] items-center">
                    <UserProfilePicture
                        user={parentUser}
                        customContainerClass="h-[60px] w-[60px]"
                    />
                    <div>
                        <p className="text-grayscale-900 font-poppins text-[20px] leading-[130%] tracking-[-0.25px] text-center">
                            Get {parentName}
                        </p>
                        <p className="text-grayscale-900 font-poppins text-[20px] leading-[130%] tracking-[-0.25px] text-center">
                            to continue.
                        </p>
                    </div>
                </div>
            </div>

            <ConsentFlowFooter
                actionButtonText="That's me!"
                onActionButtonClick={handleNextStep}
                secondaryButtonText="Cancel"
                onSecondaryButtonClick={closeModal}
            />
        </>
    );
};

export default ConsentFlowGetAnAdultPrompt;
