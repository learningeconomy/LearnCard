import React from 'react';
import { TYPE_TO_MINI_ICON } from '../../constants/';
import { LCSubtypes, type JobListCardProps } from '../../types';

const TYPE_TO_COLOR: any = {
    course: 'bg-emerald-50',
    achievement: 'bg-spice-50',
    skill: 'bg-indigo-50',
};

const TYPE_TO_TEXT_COLOR: any = {
    course: 'text-emerald-700',
    achievement: 'text-spice-500',
    skill: 'text-indigo-600',
};

type JobListingBubbleProps = {
    count: number | string | undefined;
    type: LCSubtypes.course | LCSubtypes.achievement | LCSubtypes.skill;
    className?: string;
};

export const JobListingBubble: React.FC<JobListingBubbleProps> = ({
    count = 0,
    type = LCSubtypes.skill,
    className,
}) => {
    const imgSrc = TYPE_TO_MINI_ICON[type];
    const bgColor = TYPE_TO_COLOR[type];
    const textColor = TYPE_TO_TEXT_COLOR[type];
    if (count === 0) return <></>;
    return (
        <div
            className={`job-card-stat-bubble px-[10px] px-[5px] flex-nowrap rounded-[30px] flex ${bgColor} min-w-[48px] min-w-[90px] h-[30px] justify-center items-center ${className}`}
        >
            <img src={imgSrc} className="mr-[3px]" />
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
    customButtonComponent,
    imgThumb,
    isBookmarked: _isBookmarked,
    onBookmark: _onBookmark,
    onClick,
}) => {
    const courseReqCount = qualificationDisplay?.courses?.totalRequiredCount;
    const achievementsReqCount = qualificationDisplay?.achievements?.totalRequiredCount;
    const skillsReqCount = qualificationDisplay?.skills?.totalRequiredCount;

    const courseCountDisplay =
        courseReqCount &&
        `${qualificationDisplay?.courses?.fulfilledCount ?? 0}/${
            qualificationDisplay?.courses?.totalRequiredCount ?? 0
        }`;
    const achievementsCountDisplay =
        achievementsReqCount &&
        `${qualificationDisplay?.achievements?.fulfilledCount ?? 0}/${
            qualificationDisplay?.achievements?.totalRequiredCount ?? 0
        }`;
    const skillsCountDisplay =
        skillsReqCount &&
        `${qualificationDisplay?.skills?.fulfilledCount ?? 0}/${
            qualificationDisplay?.skills?.totalRequiredCount ?? 0
        }`;

    const qualifiedText = percentQualifiedDisplay
        ? `${percentQualifiedDisplay}% Qualified - Apply`
        : 'Apply';

    let topText = '';
    if (!compensation && timeRequirement) topText = timeRequirement;
    if (!timeRequirement && compensation) topText = compensation;
    if (timeRequirement && compensation) topText = `${compensation} • ${timeRequirement}`;

    let locationText = '';
    if (!location && locationRequirement) locationText = locationRequirement;
    if (!locationRequirement && location) locationText = location;
    if (locationRequirement && location) locationText = `${locationRequirement} • ${location}`;

    const defaultButton = (
        <button
            type="button"
            onClick={onClick}
            className="mt-[10px] bg-cyan-700 py-[15px] px-[2px] rounded-[40px] text-grayscale-50 text-[17px] font-bold"
        >
            {qualifiedText}
        </button>
    );

    const buttonComponent = customButtonComponent || defaultButton;

    return (
        <div
            className={`flex flex-col justify-between shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[10px] px-[15px] max-w-[400px] min-h-[260px] rounded-[20px] ${className}`}
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
                        className="object-cover w-[80px] flex-shrink-0 items-center justify-center rounded-[15px] mr-[10px]"
                        src={imgThumb}
                    />
                )}

                <div className="job-listing-description flex flex-col">
                    <h4 className="text-lg font-bold line-clamp-2">{title}</h4>
                    <p className="text-sm line-clamp-1">{company}</p>
                    <span className="text-sm line-clamp-1">{locationText}</span>
                </div>
            </div>

            <div className="job-listing-qualifications mt-[10px]">
                <div className="course-card-counts-container flex items-center flex-wrap">
                    <JobListingBubble
                        type={LCSubtypes.course}
                        count={courseCountDisplay}
                        className={'mr-[5px] min-w-[100px]'}
                    />

                    <JobListingBubble
                        type={LCSubtypes.achievement}
                        count={achievementsCountDisplay}
                        className={'mr-[5px] min-w-[100px]'}
                    />

                    <JobListingBubble
                        type={LCSubtypes.skill}
                        count={skillsCountDisplay}
                        className={'mr-[0px min-w-[100px]]'}
                    />
                </div>
            </div>

            {buttonComponent}
        </div>
    );
};

export default JobListCard;
