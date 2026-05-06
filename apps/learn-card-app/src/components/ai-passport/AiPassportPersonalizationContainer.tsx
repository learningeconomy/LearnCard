import React from 'react';

import AiSessionLoader from '../new-ai-session/AiSessionLoader';
import AiPassportPersonalizationFormHeader from './AiPassportPersonalizationFormHeader';
import AiPassportPersonalizationQuestions from './AiPassportPersonalizationQuestions';
import AiPassportPersonalizationContainerFooter from './AiPassportPersonalizationContainerFooter';

import { AiFeatureGate } from '../ai-feature-gate/AiFeatureGate';

import { usePersonalizationQA } from './usePersonalizationQA';

export const AiPassportPersonalizationContainer: React.FC = () => {
    const { personalizedAnswers, setPersonalizedAnswers, uri, isLoading } = usePersonalizationQA();

    return (
        <AiFeatureGate>
            <div className="h-full">
                {isLoading && (
                    <AiSessionLoader overrideText="Loading Personalization..." showUserImg />
                )}

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
        </AiFeatureGate>
    );
};

export default AiPassportPersonalizationContainer;
