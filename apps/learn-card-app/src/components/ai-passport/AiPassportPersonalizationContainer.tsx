import React, { useState, useEffect } from 'react';

import AiSessionLoader from '../new-ai-session/AiSessionLoader';
import AiPassportPersonalizationFormHeader from './AiPassportPersonalizationFormHeader';
import AiPassportPersonalizationQuestions from './AiPassportPersonalizationQuestions';
import AiPassportPersonalizationContainerFooter from './AiPassportPersonalizationContainerFooter';

import { useWallet } from 'learn-card-base';

import {
    PersonalizedAnswersState,
    PersonalizedQuestionEnum,
} from './personalizedQuestions.helpers';
import {
    DEFAULT_QA_CREDENTIAL_ID,
    transformQACredIntoState,
} from './personalizedQuestionCredential.helpers';

export const AiPassportPersonalizationContainer: React.FC = () => {
    const { initWallet } = useWallet();

    const [personalizedAnswers, setPersonalizedAnswers] = useState<PersonalizedAnswersState>({
        [PersonalizedQuestionEnum.iLearnBest]: [],
        [PersonalizedQuestionEnum.favFictionalCharacter]: [],
        [PersonalizedQuestionEnum.favMovieGenre]: [],
    });

    const [uri, setUri] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleGetQACredential = async () => {
        const wallet = await initWallet();

        try {
            setIsLoading(true);
            const record = await wallet.index.LearnCloud.get({ id: DEFAULT_QA_CREDENTIAL_ID });
            const recordUri = record?.[0]?.uri as string;

            setUri(recordUri);

            if (uri) {
                const qaCredential = await wallet.read.get(recordUri);
                setPersonalizedAnswers(transformQACredIntoState(qaCredential?.qaPairs));
            }
            setIsLoading(false);
        } catch (error) {
            console.log('handleGetQACredential::error', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        handleGetQACredential();
    }, [uri]);

    return (
        <div className="h-full">
            {isLoading && <AiSessionLoader overrideText="Loading Personalization..." showUserImg />}

            <section className="h-full bg-[rgba(53,62,100,0.3)] backdrop-blur-[2px] ion-padding overflow-y-scroll pb-[130px] safe-area-top-margin">
                <AiPassportPersonalizationFormHeader />
                <AiPassportPersonalizationQuestions
                    personalizedAnswers={personalizedAnswers}
                    setPersonalizedAnswers={setPersonalizedAnswers}
                />
            </section>

            <AiPassportPersonalizationContainerFooter
                uri={uri}
                personalizedAnswers={personalizedAnswers}
            />
        </div>
    );
};

export default AiPassportPersonalizationContainer;
