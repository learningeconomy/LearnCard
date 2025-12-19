import React from 'react';

import AiPathwayCareerItem from './AiPathwayCareerItem';

export const AI_PATHWAY_CAREERS = [
    {
        id: 1,
        title: 'Data Analyst',
        description: `A data analyst gathers, cleans, and interprets data to help organizations 
            make better business decisions. They work with various tools like SQL, Excel, 
            and data visualization software to identify trends, create reports, and communicate 
            findings to stakeholders. A data analyst's role includes preparing and presenting 
        data-driven insights to solve problems and support strategies`,
        salary: '120000',
    },
    {
        id: 2,
        title: 'Account Manager',
        description: `Strengthen number sense with quick estimation strategies for sums, differences, and comparisons—no calculator needed.`,
        salary: '127000',
    },
    {
        id: 3,
        title: 'Customer Success Manager',
        description: `Explore open-ended math problems that encourage creative thinking and flexible approaches to problem solving.`,
        salary: '121000',
    },
];

const AiPathwayCareers: React.FC = () => {
    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4 mt-4">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Careers</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    {AI_PATHWAY_CAREERS.map(career => (
                        <AiPathwayCareerItem
                            key={career.id}
                            title={career?.title}
                            description={career?.description}
                            salary={career?.salary}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AiPathwayCareers;
