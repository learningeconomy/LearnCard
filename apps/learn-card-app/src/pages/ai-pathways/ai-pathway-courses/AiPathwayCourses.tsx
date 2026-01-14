import React, { useMemo } from 'react';
import _ from 'lodash';

import AiPathwayCourseItem from './AiPathwayCourseItem';
import AiPathwayCourseDetails from './AiPathwayCourseDetails';
import AiPathwaySchoolProgramItem from './AiPathwaySchoolProgramItem';

import { useTrainingProgramsByKeyword } from 'learn-card-base/react-query/queries/careerOneStop';

import { TrainingProgram } from 'learn-card-base/types/careerOneStop';
import { normalizeSchoolPrograms, filterCoursesByFieldOfStudy } from './ai-pathway-courses.helpers';

// ! Insufficient data to show the following for careers
// work life balance metrics
// job stability metrics

// ! Insufficient data to show the following for programs
// rating
// course duration

const AiPathwayCourses: React.FC<{ keywords?: string[]; fieldOfStudy?: string }> = ({
    keywords = [],
    fieldOfStudy = '',
}) => {
    const { data: trainingPrograms, isLoading } = useTrainingProgramsByKeyword({
        keywords,
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

    if (!isLoading && (!keywords?.length || !trainingPrograms?.length)) return null;

    const showCourses = courses.length > 0;
    const title = showCourses ? 'Explore Courses' : 'Explore Programs';

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">{title}</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    {showCourses
                        ? courses
                              .slice(0, 3)
                              .map((course: TrainingProgram, index: number) => (
                                  <AiPathwayCourseItem key={index} course={course} />
                              ))
                        : schoolPrograms
                              .slice(0, 3)
                              .map((program: TrainingProgram, index: number) => (
                                  <AiPathwaySchoolProgramItem key={index} program={program} />
                              ))}
                </div>
            </div>
        </div>
    );
};

export default AiPathwayCourses;
