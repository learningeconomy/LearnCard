import React, { useEffect, useState } from 'react';

import { IonContent, IonPage } from '@ionic/react';
import { ErrorBoundary } from 'react-error-boundary';
import MainHeader from '../../components/main-header/MainHeader';
import AiPathwayCareers from './ai-pathway-careers/AiPathwayCareers';
import AiPathwayCourses from './ai-pathway-courses/AiPathwayCourses';
import AiPathwaySessions from './ai-pathway-sessions/AiPathwaySessions';
import ExploreAiInsightsButton from '../ai-insights/ExploreAiInsightsButton';
import ErrorBoundaryFallback from '../../components/boost/boostErrors/BoostErrorsDisplay';
import AiPathwayExploreContent from './ai-pathway-explore-content/AiPathwayExploreContent';

import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import { CredentialCategoryEnum } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';
import { useGetCurrentLCNUser, useAiInsightCredential, useAiPathways } from 'learn-card-base';
import {
    getFirstAvailableKeywords,
    getAllKeywords,
    getFirstAvailableFieldOfStudy,
} from './ai-pathway-careers/ai-pathway-careers.helpers';

export type PathwayStep = {
    title?: string;
    description?: string;
    skills?: Array<{ title: string; description?: string }>;
};

export type PathwayItem = PathwayStep & {
    pathwayUri?: string; // pathway boost uri
    topicUri?: string; // topic boost uri
};

const AiPathways: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const colors = getThemedCategoryColors(CredentialCategoryEnum.aiPathway);
    const { backgroundSecondaryColor } = colors;

    const { data: aiInsightCredential } = useAiInsightCredential();

    const { data: learningPathwaysData, isLoading: fetchPathwaysLoading } = useAiPathways();

    const strongestAreaInterest = aiInsightCredential?.insights?.strongestArea;

    let careerKeywords = null;
    let fieldOfStudy = strongestAreaInterest?.keywords?.fieldOfStudy;
    if (strongestAreaInterest?.keywords?.occupation?.length) {
        careerKeywords = strongestAreaInterest.keywords.occupation;
    } else if (strongestAreaInterest?.keywords?.jobs?.length) {
        careerKeywords = strongestAreaInterest.keywords.jobs;
    }

    // if no keywords are found from the insights credentials, use the first available keywords from the pathways
    if (learningPathwaysData && learningPathwaysData.length > 0) {
        careerKeywords = careerKeywords || getFirstAvailableKeywords(learningPathwaysData || []);
        fieldOfStudy = fieldOfStudy || getFirstAvailableFieldOfStudy(learningPathwaysData || []);
    }

    const allKeywords =
        getAllKeywords(learningPathwaysData || []).length > 0
            ? getAllKeywords(learningPathwaysData || [])
            : careerKeywords;

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
                    <div className="flex items-center justify-center flex-col relative w-full pb-[50px] gap-1">
                        <AiPathwayCourses keywords={allKeywords} fieldOfStudy={fieldOfStudy} />
                        <AiPathwaySessions />
                        <AiPathwayCareers careerKeywords={careerKeywords} />
                        <AiPathwayExploreContent careerKeywords={careerKeywords} />
                        <ExploreAiInsightsButton className="mt-3" />
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiPathways;
