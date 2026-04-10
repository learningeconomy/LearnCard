import React, { useMemo } from 'react';

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import AiPathwaysEmptyPlaceholder from './AiPathwaysEmptyPlaceholder';
import AiPathwayCourses from './ai-pathway-courses/AiPathwayCourses';
import AiPathwaySessions from './ai-pathway-sessions/AiPathwaySessions';
import AiPathwayCareers from './ai-pathway-careers/AiPathwayCareers';
import AiPathwayExploreContent from './ai-pathway-explore-content/AiPathwayExploreContent';
import GrowSkillsCarouselSection from './GrowSkillsCarouselSection';
import ExploreAiInsightsButton from '../ai-insights/ExploreAiInsightsButton';
import { ModalTypes, useAiInsightCredential, useAiPathways, useModal } from 'learn-card-base';
import {
    getAllKeywords,
    getFirstAvailableFieldOfStudy,
    getFirstAvailableKeywords,
} from './ai-pathway-careers/ai-pathway-careers.helpers';
import {
    useOccupationDetailsForKeyword,
    useTrainingProgramsByKeyword,
} from 'learn-card-base/react-query/queries/careerOneStop';
import {
    filterCoursesByFieldOfStudy,
    normalizeSchoolPrograms,
} from './ai-pathway-courses/ai-pathway-courses.helpers';
import ExplorePathwaysModal from './ExplorePathwaysModal';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import GrowSkillsCourseItem from './GrowSkillsCourseItem';
import GrowSkillsMediaItem from './GrowSkillsMediaItem';
import GrowSkillsModal from './GrowSkillsModal';
import GrowSkillsAiSessionItem from './GrowSkillsAiSessionItem';

type GrowSkillsPathwaysHomeProps = {};

const GrowSkillsPathwaysHome: React.FC<GrowSkillsPathwaysHomeProps> = ({}) => {
    const { newModal } = useModal();

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
        });

    const schoolPrograms = useMemo(() => {
        return trainingPrograms?.length ? normalizeSchoolPrograms(trainingPrograms) : [];
    }, [trainingPrograms]);

    const courses = useMemo(() => {
        return schoolPrograms?.length
            ? filterCoursesByFieldOfStudy(schoolPrograms, fieldOfStudy)
            : [];
    }, [schoolPrograms, fieldOfStudy]);

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

    const openGrowSkillsModal = () => {
        newModal(<GrowSkillsModal />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    const _testLearningPathwaysData = [
        {
            id: '1',
            title: 'Test Session 1',
            description: 'Test description 1',
        },
        {
            id: '2',
            title: 'Test Session 2 With Two Line Title',
            description: 'Test description 2',
        },
        {
            id: '3',
            title: 'Test Session 3',
            description: 'Test description 3',
        },
    ];

    return (
        <>
            <div className="bg-grayscale-50 px-[15px] py-[20px] rounded-[15px] flex flex-col gap-[30px] w-full shadow-bottom-4-4 max-w-[568px] overflow-hidden">
                <div className="flex flex-col gap-[5px]">
                    <div className="flex items-center gap-[10px] text-grayscale-900">
                        <SkillsIconWithShape className="w-[50px] h-[50px]" />
                        <h5 className="text-[20px] font-poppins font-[600]">Grow Skills</h5>
                    </div>
                    <p className="text-[14px] font-poppins text-grayscale-700">
                        Explore <strong>courses</strong>, <strong>AI learning sessions</strong>, and{' '}
                        <strong>media</strong> to strengthen & diversify your skills
                    </p>
                </div>

                <GrowSkillsCarouselSection
                    title="AI Learning Sessions"
                    items={_testLearningPathwaysData || learningPathwaysData || []}
                    onViewAll={handleExplorePathways}
                    renderItem={item => <GrowSkillsAiSessionItem data={item as any} />}
                    getItemKey={(_item, index) => `ai-session-${index}`}
                />

                <GrowSkillsCarouselSection
                    title="Courses"
                    items={schoolPrograms}
                    onViewAll={handleExplorePathways}
                    renderItem={program => <GrowSkillsCourseItem program={program} />}
                    getItemKey={program => program.ProgramName}
                />

                <GrowSkillsCarouselSection
                    title="Media"
                    items={occupations || []}
                    onViewAll={handleExplorePathways}
                    renderItem={occupation => (
                        <GrowSkillsMediaItem occupation={occupation as any} />
                    )}
                    getItemKey={(_occupation, index) => `media-${index}`}
                />

                <button
                    onClick={openGrowSkillsModal}
                    className="w-full bg-violet-500 text-white font-bold flex items-center justify-center gap-[5px] py-[7px] px-[15px] rounded-[30px] shadow-bottom-3-4 font-poppins text-[17px] leading-[24px] tracking-[0.25px]"
                >
                    <PuzzlePiece className="w-[30px] h-[30px]" version="filled" />
                    Grow Skills
                </button>
            </div>

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
                </>
            )}
        </>
    );
};

export default GrowSkillsPathwaysHome;
