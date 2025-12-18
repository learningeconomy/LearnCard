import React from 'react';

import { AI_PATHWAY_COURSES } from './ai-pathway-courses.helpers';

import AiPathwayCourseItem from './AiPathwayCourseItem';

const AiPathwayCourses: React.FC = () => {
    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px]">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Courses</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    {AI_PATHWAY_COURSES.map(course => (
                        <AiPathwayCourseItem key={course.id} course={course} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AiPathwayCourses;
