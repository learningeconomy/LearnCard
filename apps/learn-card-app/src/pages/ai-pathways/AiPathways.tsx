import React, { useState } from 'react';

import { IonContent, IonPage } from '@ionic/react';
import { ErrorBoundary } from 'react-error-boundary';
import MainHeader from '../../components/main-header/MainHeader';
import MySkillProfile from './ai-pathways-skill-profile/MySkillProfile';
import AiFeatureLinks from '../../components/ai-feature-links/AiFeatureLinks';
import ErrorBoundaryFallback from '../../components/boost/boostErrors/BoostErrorsDisplay';
import AiPathwaysWhatWouldYouLikeToDoCard from './ai-pathways-what-would-you-like-to-do/AiPathwaysWhatWouldYouLikeToDoCard';

import { AiFeatureGate } from '../../components/ai-feature-gate/AiFeatureGate';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';

import useTheme from '../../theme/hooks/useTheme';
import { CredentialCategoryEnum } from 'learn-card-base';
import GrowSkillsPathwaysHome from './GrowSkillsPathwaysHome';

import { useSkillProfileCompletion } from './ai-pathways-skill-profile/SkillProfileProgressBar';

const AiPathways: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();
    const { percentage } = useSkillProfileCompletion();
    const [isInitialPercentageAboveZero] = useState(() => percentage > 0);

    const colors = getThemedCategoryColors(CredentialCategoryEnum.aiPathway);
    const { backgroundSecondaryColor } = colors;

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`}>
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <IonContent fullscreen color={backgroundSecondaryColor}>
                    <MainHeader
                        category={CredentialCategoryEnum.aiPathway}
                        showBackButton
                        subheaderType={SubheaderTypeEnum.AiPathways}
                        hidePlusBtn={true}
                    />
                    <AiFeatureGate>
                        <div className="flex items-center justify-center flex-col relative w-full pt-[50px] pb-[50px] gap-4">
                            {isInitialPercentageAboveZero && <AiPathwaysWhatWouldYouLikeToDoCard />}

                            <MySkillProfile className="px-4" />

                            {!isInitialPercentageAboveZero && (
                                <AiPathwaysWhatWouldYouLikeToDoCard />
                            )}

                            <GrowSkillsPathwaysHome />

                            <AiFeatureLinks
                                features={['ai-sessions', 'skills-hub', 'ai-insights']}
                                className="px-4 max-w-[600px]"
                            />
                        </div>
                    </AiFeatureGate>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiPathways;
