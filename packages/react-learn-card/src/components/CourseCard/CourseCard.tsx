import React from 'react';
import type { CourseCardProps } from '../../types';
import CourseCardPlaceholder from '../../assets/images/lhplaceholder.png';

import MiniTrophyIcon from '../../assets/images/minitrophy.svg';
import MiniJobIcon from '../../assets/images/minijob.svg';
import MiniPuzzleIcon from '../../assets/images/minipuzzle.svg';

const TYPE_TO_COURSE_MINI_ICON: any = {
    ['job']: MiniJobIcon,
    ['achievement']: MiniTrophyIcon,
    ['skill']: MiniPuzzleIcon,
};

const TYPE_TO_COLOR: any = {
    ['job']: 'bg-emerald-700',
    ['achievement']: 'bg-spice-500',
    ['skill']: 'bg-indigo-500',
};

type CourseCardStatBubbleProps = {
    count: number | string;
    type: string;
    className?: string;
};

const CourseCardStatBubble: React.FC<CourseCardStatBubbleProps> = ({
    count = 0,
    type = 'job',
    className,
}) => {
    const imgSrc = TYPE_TO_COURSE_MINI_ICON[type];
    const bgColor = TYPE_TO_COLOR[type];

    return (
        <div
            className={`course-card-stat-bubble px-[10px] rounded-[30px] flex ${bgColor} min-w-[48px] max-w-[80px] h-[30px] items-center ${className}`}
        >
            <img src={imgSrc} className="pr-[5px]" />
            <span className="flex items-center text-sm text-white">{count}</span>
        </div>
    );
};

export const CourseCard: React.FC<CourseCardProps> = ({
    status = 'Enrolled',
    title = 'MECH 1340 Digital Fundamentals and Programmable Logic Controllers',
    semester = 'Fall 2022',
    jobCount = 1,
    achievementCount = 4,
    thumbSrc: _thumbSrc,
    hideHeader = false,
    skillCount = 9,
    className,
    onClick = () => {},
}) => {
    return (
        <div
            onClick={onClick}
            className={`flex shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[10px] px-[15px] max-w-[400px] h-[130px] rounded-[20px] ${className}`}
        >
            <img
                src={CourseCardPlaceholder}
                className="course-card-img w-[100px] h-[111px] mr-[10px]"
            />

            <div className="course-card-detail-info flex flex-col justify-between">
                {!hideHeader && (
                    <div className="text-sm">
                        <span className="text-emerald-700 font-semibold">{status}</span>
                        <span className="spacer-dot mx-[3px]">•</span>
                        <span className="text-grayscale-500">{semester}</span>
                    </div>
                )}
                <p className="course-card-title text-sm font-semibold line-clamp-2">{title}</p>
                <div className="course-card-counts-container flex items-center mt-[5px]">
                    <CourseCardStatBubble type={'job'} count={jobCount} className={'mr-[5px]'} />
                    <CourseCardStatBubble
                        type={'achievement'}
                        count={achievementCount}
                        className={'mr-[5px]'}
                    />
                    <CourseCardStatBubble
                        type={'skill'}
                        count={skillCount}
                        className={'mr-[0px]'}
                    />
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
