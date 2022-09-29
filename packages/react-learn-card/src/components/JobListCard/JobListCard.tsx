import React from 'react';
import { JobListCardProps } from '../../types';

import MiniTrophyIcon from '../../assets/images/minitrophy.svg';
import MiniJobIcon from '../../assets/images/minijob.svg';
import MiniPuzzleIcon from '../../assets/images/minipuzzle.svg';

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

            <div className="job-listing-qualifications"></div>

            <button className="bg-cyan-700 py-[15px] px-[2px] rounded-[40px] text-grayscale-50 text-[17px] font-bold">
                {percentQualifiedDisplay} Qualified - Apply
            </button>
        </div>
    );
};

export default JobListCard;
