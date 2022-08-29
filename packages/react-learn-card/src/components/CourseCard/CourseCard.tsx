import React from 'react';
import { CourseCardProps } from '../../types';

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
            className={`flex justify-center items-center relative w-full rounded-3xl shadow-2xl py-3 bg-white ${className}`}
        >
            Course Card
        </div>
    );
};

export default CourseCard;
