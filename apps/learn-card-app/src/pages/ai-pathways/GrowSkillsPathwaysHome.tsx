import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import AiPathwaysEmptyPlaceholder from './AiPathwaysEmptyPlaceholder';
import AiPathwayCourses from './ai-pathway-courses/AiPathwayCourses';
import AiPathwaySessions from './ai-pathway-sessions/AiPathwaySessions';
import AiPathwayCareers from './ai-pathway-careers/AiPathwayCareers';
import AiPathwayExploreContent from './ai-pathway-explore-content/AiPathwayExploreContent';
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
import SlimCaretLeft from 'src/components/svgs/SlimCaretLeft';
import SlimCaretRight from 'src/components/svgs/SlimCaretRight';
import GrowSkillsCourseItem from './GrowSkillsCourseItem';

type GrowSkillsPathwaysHomeProps = {};

const GrowSkillsPathwaysHome: React.FC<GrowSkillsPathwaysHomeProps> = ({}) => {
    const { newModal } = useModal();
    const courseSwiperRef = useRef<any>(null);
    const [coursesAtBeginning, setCoursesAtBeginning] = useState(true);
    const [coursesAtEnd, setCoursesAtEnd] = useState(false);

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

    const handleSwiperUpdate = (swiper: any) => {
        setCoursesAtBeginning(swiper.isBeginning);
        setCoursesAtEnd(swiper.isEnd);
    };

    useEffect(() => {
        if (courseSwiperRef.current) {
            courseSwiperRef.current.update();
            handleSwiperUpdate(courseSwiperRef.current);
        }
    }, [schoolPrograms.length]);

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

                {schoolPrograms.length > 0 && (
                    <div className="flex flex-col items-center gap-[10px]">
                        <div className="flex gap-[5px] w-full">
                            <span className="text-[14px] font-poppins text-grayscale-800 font-bold leading-[130%]">
                                Courses
                            </span>
                            <button className="text-[14px] font-poppins text-indigo-500 font-bold leading-[130%] ml-auto">
                                View All
                            </button>
                        </div>

                        <div className="relative w-full overflow-visible">
                            <Swiper
                                onSwiper={swiper => {
                                    courseSwiperRef.current = swiper;
                                    handleSwiperUpdate(swiper);
                                }}
                                onResize={handleSwiperUpdate}
                                onSlideChange={handleSwiperUpdate}
                                onReachBeginning={() => setCoursesAtBeginning(true)}
                                onFromEdge={() => {
                                    if (courseSwiperRef.current) {
                                        setCoursesAtBeginning(courseSwiperRef.current.isBeginning);
                                        setCoursesAtEnd(courseSwiperRef.current.isEnd);
                                    }
                                }}
                                onReachEnd={() => setCoursesAtEnd(true)}
                                spaceBetween={12}
                                slidesPerView={'auto'}
                                grabCursor={true}
                                preventClicks={false}
                                preventClicksPropagation={false}
                                style={{ overflow: 'visible' }}
                            >
                                {schoolPrograms.map(program => (
                                    <SwiperSlide
                                        key={program.ProgramName}
                                        className="flex !h-auto overflow-visible"
                                    >
                                        <GrowSkillsCourseItem program={program} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {!coursesAtBeginning && (
                                <button
                                    onClick={() => courseSwiperRef.current?.slidePrev()}
                                    className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                                    style={{ opacity: 0.8 }}
                                >
                                    <SlimCaretLeft className="w-5 h-auto" />
                                </button>
                            )}

                            {!coursesAtEnd && (
                                <button
                                    onClick={() => courseSwiperRef.current?.slideNext()}
                                    className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                                    style={{ opacity: 0.8 }}
                                >
                                    <SlimCaretRight className="w-5 h-auto" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
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
