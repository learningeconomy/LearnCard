import React from 'react';
import { CourseCardProps } from '../../types';
import CourseCardPlaceholder from '../../assets/images/lhplaceholder.png';

export const CourseCard: React.FC<CourseCardProps> = ({
    status = 'Enrolled',
    title = 'ENGL 1020 - Critical Thinking and Augmentation',
    semester = 'Fall 2022',
    jobCount = 1,
    achievementCount = 4,
    thumbSrc,
    skillCount = 9,
    className,
    onClick = () => {},
}) => {
    const thumbClass = thumbSrc ? 'bg-grayscale-50' : 'bg-indigo-200';
    return (
        <div
            onClick={onClick}
            className={`flex shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[10px] px-[15px] max-w-[400px] h-[130px] rounded-[20px] ${className}`}
        >
            <img
                src={CourseCardPlaceholder}
                className="course-card-img w-[100px] h-[111px] mr-[10px]"
            />

            <div className="course-card-detail-info">
                <div className="text-sm">
                    <span>{status}</span>
                    <span className="spacer-dot mx-[3px]">•</span>
                    <span>{semester}</span>
                </div>
                <p className="course-card-title text-sm">{title}</p>
                <div className="course-card-counts"></div>
            </div>
        </div>
    );
};

export default CourseCard;
