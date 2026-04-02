import React, { useMemo } from 'react';

import { IonContent, IonPage } from '@ionic/react';
import { ErrorBoundary } from 'react-error-boundary';
import MainHeader from '../../components/main-header/MainHeader';
import AiPathwayCareers from './ai-pathway-careers/AiPathwayCareers';
import AiPathwayCourses from './ai-pathway-courses/AiPathwayCourses';
import AiPathwaysEmptyPlaceholder from './AiPathwaysEmptyPlaceholder';
import AiPathwaySessions from './ai-pathway-sessions/AiPathwaySessions';
import ExploreAiInsightsButton from '../ai-insights/ExploreAiInsightsButton';
import ExperimentalFeatureBox from '../../components/generic/ExperimentalFeatureBox';
import ErrorBoundaryFallback from '../../components/boost/boostErrors/BoostErrorsDisplay';
import AiPathwayExploreContent from './ai-pathway-explore-content/AiPathwayExploreContent';
import MySkillProfile from './ai-pathways-skill-profile/MySkillProfile';
import ExplorePathwaysModal from './ExplorePathwaysModal';

import { AiFeatureGate } from '../../components/ai-feature-gate/AiFeatureGate';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';

import useTheme from '../../theme/hooks/useTheme';
import {
    useOccupationDetailsForKeyword,
    useTrainingProgramsByKeyword,
} from 'learn-card-base/react-query/queries/careerOneStop';
import {
    useAiInsightCredential,
    useAiPathways,
    useModal,
    ModalTypes,
    CredentialCategoryEnum,
} from 'learn-card-base';

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
    const { newModal } = useModal();
    const { getThemedCategoryColors } = useTheme();

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

    const emptyPathways =
        !isLoading &&
        !occupations &&
        courses?.length === 0 &&
        schoolPrograms.length === 0 &&
        learningPathwaysData?.length === 0;

    const handleExplorePathways = () => {
        newModal(<ExplorePathwaysModal />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

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
                            <div className="flex items-center justify-center w-full rounded-[10px] px-4 max-w-[600px]">
                                <ExperimentalFeatureBox className="shadow-box-bottom" />
                            </div>

                            <button
                                className="bg-indigo-500 rounded-full text-white px-[15px] py-[7px]"
                                onClick={handleExplorePathways}
                            >
                                Explore Pathways
                            </button>

                            <MySkillProfile />

                            {emptyPathways ? (
                                <div className="flex items-center justify-center w-full rounded-[10px] px-4 max-w-[600px]">
                                    <AiPathwaysEmptyPlaceholder />
                                </div>
                            ) : (
                                <>
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
                                    <AiPathwayExploreContent
                                        occupations={occupations}
                                        isLoading={isLoading}
                                    />
                                    <ExploreAiInsightsButton />
                                </>
                            )}
                        </div>
                    </AiFeatureGate>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiPathways;
