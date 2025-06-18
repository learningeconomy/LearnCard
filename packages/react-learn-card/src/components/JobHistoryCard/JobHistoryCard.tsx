import React from 'react';
import type { JobHistoryCardProps } from '../../types';
import GenericArrow from '../svgs/GenericArrow';

export const JobHistoryCard: React.FC<JobHistoryCardProps> = ({
    className,
    title,
    company,
    dateRange,
    jobType,
    showArrow = false,
    onClick,
}) => {
    const handleClick = () => {
        onClick?.();
    };

    return (
        <div
            onClick={handleClick}
            className={`job-history-card flex h-[88px] max-w-[335px] justify-between shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[10px] px-[15px] rounded-[20px] ${className}`}
        >
            {dateRange && (
                <div className="flex flex-shrink-0 rounded-[20px]  bg-emerald-600 pl-[15px] font-bold text-grayscale-50 job-card-date-display w-[108px] h-full items-center">
                    <p className="line-clamp-2">{dateRange}</p>
                </div>
            )}
            <div className="flex flex-grow flex-col job-history-details-display pl-[12px]">
                <p className="text-grayscale-900 font-bold line-clamp-1">{title}</p>
                <p className="text-grayscale-600 text-sm line-clamp-1">{company}</p>
                <p className="text-sm text-indigo-700 uppercase font-bold line-clamp-1">
                    {jobType}
                </p>
            </div>
            {showArrow && (
                <div className="flex justify-center items-center">
                    <GenericArrow />
                </div>
            )}
        </div>
    );
};

export default JobHistoryCard;
