import React, { useMemo } from 'react';

// import startRatingIcon from '../../../assets/images/star-rating.icon.png';
import openSyllabusLogo from '../../../assets/images/open-syllabus-logo.webp';
// import timeMachineIcon from '../../../assets/images/time-machine.icon.png';
import AiPathwayCourseDetails from './AiPathwayCourseDetails';

import { useModal, ModalTypes } from 'learn-card-base';
import { getOccupationTags } from './ai-pathway-courses.helpers';

const AiPathwayCourseItem: React.FC<{ course: any }> = ({ course }) => {
    const { newModal } = useModal();

    const openCourseDetailsModal = () => {
        newModal(<AiPathwayCourseDetails course={course} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    const occupationTags = getOccupationTags(course?.occupationDetails);

    const schoolImage = course?.institution?.image_url;
    const logo = schoolImage ? schoolImage : openSyllabusLogo;

    return (
        <div
            role="button"
            onClick={openCourseDetailsModal}
            className="w-full flex flex-col items-start justify-start px-4 py-2 gap-1 border-solid border-[1px] border-grayscale-200 rounded-xl cursor-pointer"
        >
            <p className="text-indigo-500 font-normal text-sm line-clamp-1 font-notoSans uppercase text-left">
                {occupationTags}
            </p>
            <div className="w-full flex items-center justify-between">
                <h2 className="text-lg text-left font-semibold text-grayscale-800 line-clamp-2 w-[80%]">
                    {course?.title}
                </h2>
            </div>

            <p className="text-sm text-grayscale-600 font-notoSans">
                {course?.institution?.institution}
            </p>

            <div className="w-full flex justify-end items-center">
                <div className="flex items-center justify-end gap-1">
                    <img src={logo} alt="Edx Logo" className="w-12 h-12 object-contain" />
                </div>
            </div>
        </div>
    );
};

export default AiPathwayCourseItem;
