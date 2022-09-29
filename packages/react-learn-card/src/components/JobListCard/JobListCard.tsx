import React from 'react';
import { JobListCardProps } from '../../types';

import MiniTrophyIcon from '../../assets/images/minitrophycolored.svg';
import MiniGradIcon from '../../assets/images/minigradcapcolored.svg';
import MiniPuzzleIcon from '../../assets/images/minipuzzlecolored.svg';

const TYPE_TO_COURSE_MINI_ICON = {
    job: MiniGradIcon,
    achievement: MiniTrophyIcon,
    skill: MiniPuzzleIcon,
};

const TYPE_TO_COLOR = {
    job: 'bg-emerald-50',
    achievement: 'bg-spice-50',
    skill: 'bg-indigo-50',
};

const TYPE_TO_TEXT_COLOR = {
    job: 'text-emerald-700',
    achievement: 'text-spice-500',
    skill: 'text-indigo-600',
};

type JobListingBubbleProps = {
    count: number | string;
    type: 'job' | 'achievement' | 'skill';
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
            <img src={imgSrc} />
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
    const courseCountDisplay = `${qualificationDisplay?.courses?.fulfilledCount ?? 0}/${
        qualificationDisplay?.courses?.totalRequiredCount ?? 0
    }`;
    const achievementsCountDisplay = `${qualificationDisplay?.achievements?.fulfilledCount ?? 0}/${
        qualificationDisplay?.achievements?.totalRequiredCount ?? 0
    }`;
    const skillsCountDisplay = `${qualificationDisplay?.skills?.fulfilledCount ?? 0}/${
        qualificationDisplay?.skills?.totalRequiredCount ?? 0
    }`;

    const qualifiedText = percentQualifiedDisplay
        ? `${percentQualifiedDisplay}% Qualified - Apply`
        : 'Apply';

    let topText = '';
    if (!compensation && timeRequirement) topText = timeRequirement;
    if (!timeRequirement && compensation) topText = compensation;
    if (timeRequirement && compensation) topText = `${compensation} • ${timeRequirement}`;

    return (
        <div
            className={`flex flex-col justify-between shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[10px] px-[15px] max-w-[400px] h-[260px] rounded-[20px] ${className}`}
        >
            <div className="job-listing-top flex">
                <div className="flex text-grayscale-500 text-xs uppercase w-full line-clamp-1">
                    {topText}
                </div>
            </div>
            <p className="text-grayscale-500 text-xs line-clamp-1 flex-shrink-0">
                {' '}
                {postDateDisplay}
            </p>

            <div className="job-listing-center flex mt-[5px]">
                {imgThumb && (
                    <img
                        className="object-cover w-[78px] flex-shrink-0 items-center justify-center rounded-[15px] mr-[10px]"
                        src={imgThumb}
                    />
                )}

                <div className="job-listing-description flex flex-col">
                    <h4 className="text-lg font-bold line-clamp-2">{title}</h4>
                    <p className="text-sm line-clamp-1">{company}</p>
                    <span className="text-sm line-clamp-1">
                        {locationRequirement} • {location}
                    </span>
                </div>
            </div>

            <div className="job-listing-qualifications mt-[10px]">
                <div className="course-card-counts-container flex items-center">
                    <JobListingBubble
                        type={'job'}
                        count={courseCountDisplay}
                        className={'mr-[5px]'}
                    />
                    <JobListingBubble
                        type={'achievement'}
                        count={achievementsCountDisplay}
                        className={'mr-[5px]'}
                    />
                    <JobListingBubble
                        type={'skill'}
                        count={skillsCountDisplay}
                        className={'mr-[0px]'}
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={onClick}
                className="mt-[10px] bg-cyan-700 py-[15px] px-[2px] rounded-[40px] text-grayscale-50 text-[17px] font-bold"
            >
                {qualifiedText}
            </button>
        </div>
    );
};

export default JobListCard;
