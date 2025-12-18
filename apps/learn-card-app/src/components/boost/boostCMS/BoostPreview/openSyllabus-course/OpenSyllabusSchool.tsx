import React, { useState } from 'react';

import useTheme from '../../../../../theme/hooks/useTheme';
import { useGetVCInfo } from 'learn-card-base';

import { VC } from '@learncard/types';
import { ColorSetEnum } from '../../../../../theme/colors';

const OpenSyllabusSchool: React.FC<{ credential: VC }> = ({ credential }) => {
    const { getColorSet } = useTheme();
    const colors = getColorSet(ColorSetEnum.defaults);

    const [viewMoreSchoolDescription, setViewMoreSchoolDescription] = useState(false);

    const { source } = useGetVCInfo(credential);

    const school = source;
    const schoolLink = school?.url;
    const schoolName = school?.name;
    const schoolImage = school?.image;
    const schoolDescription = school?.description;
    const address = school?.address;
    const schoolAddress = `${address?.addressLocality}, ${address?.addressRegion}, ${address?.addressCountry}`;

    if (!school?.name) return <></>;

    return (
        <div className="p-[15px] bg-white flex flex-col items-start gap-[10px] rounded-[20px] w-full shadow-bottom-2-4">
            <h3 className="text-[17px] font-poppins text-grayscale-900">School</h3>
            <div className="flex items-start gap-[10px]">
                <div className="min-w-[50px] min-h-[50px] w-[50px] h-[50px] max-w-[50px] max-h-[50px]">
                    <img
                        src={schoolImage}
                        alt={schoolName}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex flex-col justify-start items-start gap-[2px]">
                    <p className="text-[17px] font-poppins text-grayscale-900 font-semibold">
                        {schoolName}
                    </p>
                    <p className="text-[14px] font-poppins text-grayscale-700">{schoolAddress}</p>
                    <button
                        onClick={() => window.open(schoolLink!, '_blank')}
                        className={`text-[14px] font-poppins font-semibold underline text-${colors.primaryColor}`}
                    >
                        Website
                    </button>
                </div>
            </div>

            <div>
                <p
                    className={`text-[14px] font-poppins text-grayscale-600 ${
                        viewMoreSchoolDescription ? 'line-clamp-none' : 'line-clamp-5'
                    }`}
                >
                    {schoolDescription}
                </p>
                <button
                    onClick={() => setViewMoreSchoolDescription(!viewMoreSchoolDescription)}
                    className="text-[14px] font-poppins font-semibold text-[#0094B4]"
                >
                    {viewMoreSchoolDescription ? 'Show Less' : 'Show More'}
                </button>
            </div>
        </div>
    );
};

export default OpenSyllabusSchool;
