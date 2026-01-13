import React, { useMemo } from 'react';
import _ from 'lodash';

import AiPathwayCourseItem from './AiPathwayCourseItem';

import { useTrainingProgramsByKeyword } from 'learn-card-base/react-query/queries/careerOneStop';
import { TrainingProgram } from 'learn-card-base/types/careerOneStop';
import { getCoursesFromTrainingPrograms } from './ai-pathway-courses.helpers';

const AiPathwayCourses: React.FC<{ keywords?: string[]; fieldOfStudy?: string }> = ({
    keywords = [],
    fieldOfStudy = '',
}) => {
    const { data: trainingPrograms, isLoading } = useTrainingProgramsByKeyword({
        keywords,
        fieldOfStudy,
    });

    const _trainingPrograms = useMemo(() => {
        return trainingPrograms?.length
            ? _.sortBy([...trainingPrograms], () => Math.random() - 0.5).map((program: any) => ({
                  ...(program?.SchoolPrograms?.[0] || {}),
                  keyword: program?.keyword,
              }))
            : [];
    }, [trainingPrograms]);

    const courses = getCoursesFromTrainingPrograms(trainingPrograms ?? []);

    if (!isLoading && (!keywords?.length || !trainingPrograms?.length)) return null;

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px]">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Programs</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    {_trainingPrograms?.map((course: TrainingProgram, index: number) => (
                        <AiPathwayCourseItem key={index} course={course} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AiPathwayCourses;
