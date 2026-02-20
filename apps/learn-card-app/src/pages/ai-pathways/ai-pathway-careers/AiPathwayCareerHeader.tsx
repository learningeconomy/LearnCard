import React from 'react';

import CareerLaptopIcon from '../../../assets/images/career.laptop.icon.png';

import { OccupationDetailsResponse } from 'learn-card-base/types/careerOneStop';

export const AiPathwayCareerHeader: React.FC<{ occupation: OccupationDetailsResponse }> = ({
    occupation,
}) => {
    return (
        <div className="bg-white rounded-[24px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 mt-[60px] w-full">
            <div className="flex flex-col gap-[10px] items-center p-[20px] border-b-[1px] border-grayscale-200 border-solid">
                <img src={CareerLaptopIcon} alt="career icon" className="w-[80px] h-[80px]" />

                <h2 className="text-[20px] text-grayscale-900 font-poppins">
                    {occupation.OnetTitle}
                </h2>
            </div>

            <div className="flex flex-col gap-[10px] items-start justify-start p-[20px]">
                <p className="text-grayscale-600 font-poppins text-base tracking-[-0.25px]">
                    {occupation.OnetDescription}
                </p>
            </div>
        </div>
    );
};

export default AiPathwayCareerHeader;
