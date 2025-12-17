import React, { useState } from 'react';

import CredentialVerificationDisplay, {
    getInfoFromCredential,
} from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

import useTheme from '../../../../../theme/hooks/useTheme';
import { useGetVCInfo } from 'learn-card-base';

import { VC } from '@learncard/types';
import { ColorSetEnum } from '../../../../../theme/colors';

const OpenSyllabusCourse: React.FC<{ credential: VC }> = ({ credential }) => {
    const { getColorSet } = useTheme();
    const colors = getColorSet(ColorSetEnum.defaults);

    const [viewMore, setViewMore] = useState(false);

    const { title, description, evidence } = useGetVCInfo(credential);
    const { createdAt } = getInfoFromCredential(credential, 'MMMM DD, YYYY', {
        uppercaseDate: false,
    });

    const course = evidence.find(evidenceItem => evidenceItem.genre === 'CourseSyllabus');
    const courseName = course?.name ?? title;
    const courseDescription = course?.description ?? description;
    const courseSyllabusLink = course?.id;

    if (!course?.name) return <></>;

    return (
        <div className="p-[15px] bg-white flex flex-col items-start gap-[10px] rounded-[20px] w-full shadow-bottom-2-4">
            <h3 className="text-[17px] font-poppins text-grayscale-900 font-semibold">
                {courseName}
            </h3>
            <div>
                <p
                    className={`text-[14px] font-poppins text-grayscale-600 ${
                        viewMore ? 'line-clamp-none' : 'line-clamp-5'
                    }`}
                >
                    {courseDescription}
                </p>
                <button
                    onClick={() => setViewMore(!viewMore)}
                    className="text-[14px] font-poppins font-semibold text-[#0094B4]"
                >
                    {viewMore ? 'Show Less' : 'Show More'}
                </button>
            </div>

            <button
                onClick={() => window.open(courseSyllabusLink!, '_blank')}
                className={`text-[14px] font-poppins font-semibold text-${colors.primaryColor}`}
            >
                View Syllabus
            </button>
            <div className="w-full h-[1px] bg-grayscale-200" />
            <div className="flex items-center gap-[10px]">
                <CredentialVerificationDisplay credential={credential} showText />
                <p className="text-[14px] font-poppins font-semibold text-grayscale-700">
                    on {createdAt}
                </p>
            </div>
        </div>
    );
};

export default OpenSyllabusCourse;
