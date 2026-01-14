import React, { useMemo } from 'react';

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
import {
    useOccupationDetailsForKeyword,
    useTrainingProgramsByKeyword,
} from 'learn-card-base/react-query/queries/careerOneStop';
import { useGetCurrentLCNUser, useAiInsightCredential, useAiPathways } from 'learn-card-base';

import {
    getFirstAvailableKeywords,
    getAllKeywords,
    getFirstAvailableFieldOfStudy,
} from './ai-pathway-careers/ai-pathway-careers.helpers';
import {
    filterCoursesByFieldOfStudy,
    normalizeSchoolPrograms,
} from './ai-pathway-courses/ai-pathway-courses.helpers';

const AiPathways: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const colors = getThemedCategoryColors(CredentialCategoryEnum.aiPathway);
    const { backgroundSecondaryColor } = colors;

    const { data: aiInsightCredential, isLoading: fetchAiInsightCredentialLoading } =
        useAiInsightCredential();
    const { data: learningPathwaysData, isLoading: fetchPathwaysLoading } = useAiPathways();

    const strongestAreaInterest = aiInsightCredential?.insights?.strongestArea;

    let careerKeywords = null;
    let fieldOfStudy = strongestAreaInterest?.keywords?.fieldOfStudy;
    if (strongestAreaInterest?.keywords?.occupations?.length) {
        careerKeywords = strongestAreaInterest.keywords.occupations;
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

    const { data: trainingPrograms, isLoading: fetchTrainingProgramsLoading } =
        useTrainingProgramsByKeyword({
            keywords: allKeywords as string[],
            fieldOfStudy,
        });

    const schoolPrograms = useMemo(() => {
        return trainingPrograms?.length ? normalizeSchoolPrograms(trainingPrograms) : [];
    }, [trainingPrograms]);

    const courses = useMemo(() => {
        return schoolPrograms?.length
            ? filterCoursesByFieldOfStudy(schoolPrograms, fieldOfStudy)
            : [];
    }, [schoolPrograms]);

    const { data: occupations, isLoading: fetchOccupationsLoading } =
        useOccupationDetailsForKeyword(careerKeywords?.[0] || '');

    const isLoading =
        fetchAiInsightCredentialLoading ||
        fetchPathwaysLoading ||
        fetchTrainingProgramsLoading ||
        fetchOccupationsLoading;

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
                    <div className="flex items-center justify-center flex-col relative w-full pt-[50px] pb-[50px] gap-4">
                        <AiPathwayCourses
                            courses={courses}
                            schoolPrograms={schoolPrograms}
                            keywords={allKeywords}
                            fieldOfStudy={fieldOfStudy}
                            isLoading={isLoading}
                        />
                        <AiPathwaySessions
                            learningPathwaysData={learningPathwaysData}
                            isLoading={isLoading}
                        />
                        <AiPathwayCareers
                            careerKeywords={careerKeywords}
                            occupations={occupations}
                            isLoading={isLoading}
                        />
                        <AiPathwayExploreContent occupations={occupations} isLoading={isLoading} />
                        <ExploreAiInsightsButton />
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiPathways;
