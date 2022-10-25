import React from 'react';
import { JobHistoryCardProps } from '../../types';

export const JobHistoryCard: React.FC<JobHistoryCardProps> = ({
    className,
    title,
    description,
    dateRange,
    jobType,
    onClick,
}) => {
    //const imgSrc = TYPE_TO_MINI_ICON[type];
    //  const bgColor = TYPE_TO_COLOR[type];
    // const textColor = TYPE_TO_TEXT_COLOR[type];

    return (
        <div
            className={`relative job-card-stat-bubble px-[10px] px-[5px] flex-nowrap rounded-[30px] flex min-w-[48px] min-w-[90px] h-[30px] justify-center items-center ${className}`}
        >
            JOB HISTORY CARD
        </div>
    );
};

export default JobHistoryCard;
