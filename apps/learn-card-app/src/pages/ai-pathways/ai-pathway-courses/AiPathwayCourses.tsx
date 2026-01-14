import React, { useMemo } from 'react';
import _ from 'lodash';

import AiPathwayCourseItem from './AiPathwayCourseItem';

import { useTrainingProgramsByKeyword } from 'learn-card-base/react-query/queries/careerOneStop';
import { TrainingProgram } from 'learn-card-base/types/careerOneStop';
import { normalizeSchoolPrograms, filterCoursesByFieldOfStudy } from './ai-pathway-courses.helpers';

const AiPathwayCourses: React.FC<{ keywords?: string[]; fieldOfStudy?: string }> = ({
    keywords = [],
    fieldOfStudy = '',
}) => {
    console.log('fieldOfStudy', fieldOfStudy);

    const { data: trainingPrograms, isLoading } = useTrainingProgramsByKeyword({
        keywords,
        fieldOfStudy,
    });

    console.log('trainingPrograms', trainingPrograms);

    const schoolPrograms = useMemo(() => {
        return trainingPrograms?.length ? normalizeSchoolPrograms(trainingPrograms) : [];
    }, [trainingPrograms]);

    const courses = useMemo(() => {
        return trainingPrograms?.length
            ? filterCoursesByFieldOfStudy(trainingPrograms, fieldOfStudy)
            : [];
    }, [trainingPrograms]);

    console.log('courses', courses);
    console.log('schoolPrograms', schoolPrograms);

    // normalize training programs
    // normalize courses
    // if courses.length > 3, show courses
    // if trainingPrograms.length > 3, show training programs
    // get school data from openSyllabus

    if (!isLoading && (!keywords?.length || !trainingPrograms?.length)) return null;

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px]">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Programs</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    {schoolPrograms?.map((course: TrainingProgram, index: number) => (
                        <AiPathwayCourseItem key={index} course={course} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AiPathwayCourses;
