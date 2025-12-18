import React, { useState } from 'react';

import { IonFooter } from '@ionic/react';

import { useModal, useWallet } from 'learn-card-base';

import { PersonalizedAnswersState } from './personalizedQuestions.helpers';
import {
    DEFAULT_QA_CREDENTIAL_ID,
    newPersonalizedQACredential,
    transformPersonalizedAnswersForVC,
} from './personalizedQuestionCredential.helpers';

const LearnCardFooter: React.FC<{ personalizedAnswers: PersonalizedAnswersState; uri: string }> = ({
    personalizedAnswers,
    uri,
}) => {
    const { initWallet } = useWallet();
    const { closeModal } = useModal();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleIssueQACredential = async () => {
        const wallet = await initWallet();
        const walletDid = wallet?.id?.did();

        const answers = transformPersonalizedAnswersForVC(personalizedAnswers);
        const personalizedQACredential = newPersonalizedQACredential(answers, walletDid);

        try {
            setIsLoading(true);
            const vc = await wallet.invoke.issueCredential(personalizedQACredential);
            const qaCredUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(vc);

            if (qaCredUri && uri) {
                await wallet.index.LearnCloud.update(DEFAULT_QA_CREDENTIAL_ID, { uri: qaCredUri });
            } else {
                await wallet.index.LearnCloud.add({
                    id: DEFAULT_QA_CREDENTIAL_ID,
                    uri: qaCredUri as string,
                    category: 'Hidden',
                });
            }
            setIsLoading(false);
            closeModal();
        } catch (error) {
            console.log('handleIssueQACredential::error', error);
            setIsLoading(false);
        }
    };

    return (
        <IonFooter
            mode="ios"
            className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px]"
        >
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                    <button
                        onClick={closeModal}
                        className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                    >
                        Back
                    </button>

                    <button
                        disabled={isLoading}
                        onClick={handleIssueQACredential}
                        className="bg-grayscale-800 py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center"
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </IonFooter>
    );
};

export default LearnCardFooter;
