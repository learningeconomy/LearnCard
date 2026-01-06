import React from 'react';

import { type AiPathwayCareer } from './ai-pathway-careers.helpers';

export const AiPathwayCareerSkills: React.FC<{ career: AiPathwayCareer }> = ({ career }) => {
    return (
        <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-2">
            <div className="w-full flex items-center justify-start">
                <h2 className="text-xl text-grayscale-800 font-notoSans">Top Skills</h2>
            </div>

            <div className="w-full flex flex-col items-center justify-start gap-4">
                {career.skills.map(skill => {
                    return (
                        <div
                            key={skill.id}
                            className="w-full flex flex-col items-start justify-start gap-2"
                        >
                            <p className="bg-grayscale-100 rounded-[10px] p-[10px] text-grayscale-800 text-sm font-semibold inline-block">
                                {skill.name}
                            </p>
                            <p className="text-grayscale-700 font-poppins text-sm tracking-[-0.25px]">
                                {skill.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AiPathwayCareerSkills;
