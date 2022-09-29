import React from 'react';
import { JobListCardProps } from '../../types';

import MiniTrophyIcon from '../../assets/images/minitrophy.svg';
import MiniJobIcon from '../../assets/images/minijob.svg';
import MiniPuzzleIcon from '../../assets/images/minipuzzle.svg';

const TYPE_TO_COURSE_MINI_ICON: any = {
    ['job']: MiniJobIcon,
    ['achievement']: MiniTrophyIcon,
    ['skill']: MiniPuzzleIcon,
};

const TYPE_TO_COLOR: any = {
    ['job']: 'bg-emerald-50',
    ['achievement']: 'bg-spice-50',
    ['skill']: 'bg-indigo-50',
};

const TYPE_TO_TEXT_COLOR: any = {
    ['job']: 'text-emerald-700',
    ['achievement']: 'text-spice-500',
    ['skill']: 'text-indigo-600',
}

type JobListingBubbleProps = {
    count: number | string;
    type: string;
    className?: string;
};

export const JobListingBubble: React.FC<JobListingBubbleProps> = ({
    count = 0,
    type = 'job',
    className,
}) => {
    const imgSrc = TYPE_TO_COURSE_MINI_ICON[type];
    const bgColor = TYPE_TO_COLOR[type];
    const textColor = TYPE_TO_TEXT_COLOR[type];
    return (
        <div
            className={`course-card-stat-bubble px-[10px] rounded-[30px] flex ${bgColor} min-w-[48px] max-w-[100px] h-[30px] items-center ${className}`}
        >
            <img src={imgSrc} className="pr-[5px]" />
            <span className={`flex items-center text-sm ${textColor} font-bold`}>{count}</span>
        </div>
    );
};

export const JobListCard: React.FC<JobListCardProps> = ({
    company,
    className = 'job-listing-card',
    title,
    compensation,
    location,
    locationRequirement,
    timeRequirement,
    qualificationDisplay,
    percentQualifiedDisplay,
    postDateDisplay,
    imgThumb,
    isBookmarked,
    onBookmark,
    onClick,
}) => {
    return (
        <div
            className={`flex flex-col justify-between shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[10px] px-[15px] max-w-[400px] h-[260px] rounded-[20px] ${className}`}
        >
            <div className="job-listing-top flex">
                <div className="flex text-grayscale-500 text-xs uppercase w-full">
                    {compensation} • {timeRequirement}
                </div>
            </div>
            <p className="text-grayscale-500 text-xs"> {postDateDisplay}</p>

            <div className="job-listing-center flex">
                <div className="job-listing-thumb"></div>

                <div className="job-listing-description flex flex-col">
                    <h4 className="text-lg font-bold">{title}</h4>
                    <p className="text-sm">{company}</p>
                    <span className="text-sm">
                        {locationRequirement} • {location}
                    </span>
                </div>
            </div>

            <div className="job-listing-qualifications">
                <div className="course-card-counts-container flex items-center mt-[5px]">
                    <JobListingBubble type={'job'} count={'4/5'} className={'mr-[5px]'} />
                    <JobListingBubble type={'achievement'} count={'35/40'} className={'mr-[5px]'} />
                    <JobListingBubble type={'skill'} count={'125/230'} className={'mr-[0px]'} />
                </div>
            </div>

            <button className="bg-cyan-700 py-[15px] px-[2px] rounded-[40px] text-grayscale-50 text-[17px] font-bold">
                {percentQualifiedDisplay} Qualified - Apply
            </button>
        </div>
    );
};

export default JobListCard;
