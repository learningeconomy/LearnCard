import React, { useMemo, useState } from 'react';

import { IonContent, IonPage } from '@ionic/react';
import { ErrorBoundary } from 'react-error-boundary';
import AiPathwaysDiscoverySearch from './AiPathwaysDiscoverySearch';
import MainHeader from '../../../components/main-header/MainHeader';
import AiPathwayCareers from '../ai-pathway-careers/AiPathwayCareers';
import AiPathwayCourses from '../ai-pathway-courses/AiPathwayCourses';
import AiPathwaysEmptyPlaceholder from '../AiPathwaysEmptyPlaceholder';

import ExploreAiInsightsButton from '../../ai-insights/ExploreAiInsightsButton';
import ExperimentalFeatureBox from '../../../components/generic/ExperimentalFeatureBox';
import ErrorBoundaryFallback from '../../../components/boost/boostErrors/BoostErrorsDisplay';
import AiPathwayExploreContent from '../ai-pathway-explore-content/AiPathwayExploreContent';

import { SubheaderTypeEnum } from '../../../components/main-subheader/MainSubHeader.types';
import { CredentialCategoryEnum } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';
import {
    useOccupationDetailsForKeyword,
    useTrainingProgramsByKeyword,
} from 'learn-card-base/react-query/queries/careerOneStop';
import { normalizeSchoolPrograms } from '../ai-pathway-courses/ai-pathway-courses.helpers';

const AiPathwaysDiscovery: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();
    const [keywordInput, setKeywordInput] = useState<string>('');
    const [searchKeyword, setSearchKeyword] = useState<string>('');

    const colors = getThemedCategoryColors(CredentialCategoryEnum.aiPathway);
    const { backgroundSecondaryColor } = colors;

    // Use search keyword if provided, otherwise fall back to original logic
    const activeKeywords = searchKeyword ? [searchKeyword] : [];

    const { data: trainingPrograms, isLoading: fetchTrainingProgramsLoading } =
        useTrainingProgramsByKeyword({
            keywords: activeKeywords as string[],
        });

    const schoolPrograms = useMemo(() => {
        return trainingPrograms?.length ? normalizeSchoolPrograms(trainingPrograms) : [];
    }, [trainingPrograms]);

    const { data: occupations, isLoading: fetchOccupationsLoading } =
        useOccupationDetailsForKeyword(activeKeywords?.[0] || '');

    const isLoading = fetchTrainingProgramsLoading || fetchOccupationsLoading;

    const emptyPathways = !isLoading && !occupations && schoolPrograms.length === 0;

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
                        <div className="flex items-center justify-center w-full rounded-[10px] px-4 max-w-[600px]">
                            <ExperimentalFeatureBox />
                        </div>

                        {/* Search Input Section */}
                        <AiPathwaysDiscoverySearch
                            keywordInput={keywordInput}
                            setKeywordInput={setKeywordInput}
                            searchKeyword={searchKeyword}
                            setSearchKeyword={setSearchKeyword}
                        />

                        {emptyPathways ? (
                            <div className="flex items-center justify-center w-full rounded-[10px] px-4 max-w-[600px]">
                                <AiPathwaysEmptyPlaceholder />
                            </div>
                        ) : (
                            <>
                                <AiPathwayCourses
                                    courses={[]}
                                    schoolPrograms={schoolPrograms}
                                    keywords={activeKeywords}
                                    fieldOfStudy={undefined}
                                    isLoading={isLoading}
                                />
                                <AiPathwayCareers
                                    careerKeywords={activeKeywords}
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
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiPathwaysDiscovery;
