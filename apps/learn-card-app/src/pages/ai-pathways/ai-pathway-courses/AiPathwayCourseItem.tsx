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

    const occupationTags = useMemo(() => {
        const tags = getOccupationTags(course?.occupationDetails);
        return tags;
    }, [course?.occupationDetails]);

    const schoolImage = course?.institution?.image_url;
    const logo = schoolImage ? schoolImage : openSyllabusLogo;

    return (
        <div
            onClick={openCourseDetailsModal}
            className="w-full flex flex-col items-start justify-start px-4 py-2 gap-1 border-solid border-[1px] border-grayscale-200 rounded-xl"
        >
            <p className="text-indigo-500 font-normal text-sm line-clamp-1 font-notoSans uppercase text-left">
                {occupationTags}
            </p>
            <div className="w-full flex items-center justify-between">
                <h2 className="text-lg text-left font-semibold text-grayscale-800 line-clamp-2 w-[70%]">
                    {course?.title}
                </h2>

                {/* <div className="flex flex-col items-center gap-1">
                    <img
                        src={startRatingIcon}
                        alt="Star Rating"
                        className="w-4 h-4 object-contain"
                    />
                    <p className="text-sm text-grayscale-800 font-semibold font-notoSans">
                        {course.rating}
                        <span className="text-grayscale-400">/5</span>
                    </p>
                </div> */}
            </div>

            <p className="text-sm text-grayscale-600 font-notoSans">
                {course?.institution?.institution}
            </p>

            <div className="w-full flex justify-end items-center">
                {/* <div className="flex items-center gap-2">
                    <div className="h-full flex items-start justify-start">
                        <img
                            src={timeMachineIcon}
                            alt="Time Machine"
                            className="w-5 h-5 object-contain"
                        />
                    </div>
                    <div className="flex flex-col items-start justify-end">
                        <p className="text-sm text-grayscale-800 font-semibold text-right">
                            {course?.DurationAvg}
                        </p> 
                        <span className="text-xs text-grayscale-700 font-medium text-left max-w-[90%]">
                            Total: {course?.ProgramLength?.[0]?.Value} to complete
                        </span>
                    </div>
                </div> */}
                <div className="flex items-center justify-end gap-1">
                    <img src={logo} alt="Edx Logo" className="w-12 h-12 object-contain" />
                </div>
            </div>
        </div>
    );
};

export default AiPathwayCourseItem;
