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
import { useGrowSkillsContent } from './useGrowSkillsContent';
import AiPathwayCareerItem from './ai-pathway-careers/AiPathwayCareerItem';
import AiPathwayCareers from './ai-pathway-careers/AiPathwayCareers';

const AiPathways: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();
    const { percentage } = useSkillProfileCompletion();
    const { careerKeywords, occupations, isLoading } = useGrowSkillsContent();
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
                        <div className="relative w-full pt-[50px] pb-[50px] max-w-[1240px] mx-auto px-4 flex flex-col gap-6">
                            <div className="flex flex-col desktop:flex-row desktop:items-start gap-6 w-full">
                                <div className="flex flex-col gap-4 w-full desktop:w-[400px] desktop:shrink-0">
                                    {isInitialPercentageAboveZero && (
                                        <AiPathwaysWhatWouldYouLikeToDoCard />
                                    )}

                                    <MySkillProfile className="w-full" />

                                    {!isInitialPercentageAboveZero && (
                                        <AiPathwaysWhatWouldYouLikeToDoCard />
                                    )}

                                    {(isLoading || (careerKeywords && occupations)) && (
                                        <AiPathwayCareers
                                            careerKeywords={careerKeywords || []}
                                            occupations={occupations || []}
                                            isLoading={isLoading}
                                        />
                                    )}
                                </div>

                                <div className="flex flex-col gap-4 w-full min-w-0 desktop:flex-1">
                                    <GrowSkillsPathwaysHome />
                                </div>
                            </div>

                            <AiFeatureLinks
                                features={['ai-sessions', 'skills-hub', 'ai-insights']}
                                className="w-full"
                            />
                        </div>
                    </AiFeatureGate>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiPathways;
