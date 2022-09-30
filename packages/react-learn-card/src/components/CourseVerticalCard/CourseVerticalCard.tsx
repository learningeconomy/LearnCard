import React from 'react';
import { CourseCardVerticalProps } from '../../types';
import { CircleCheckButton } from '../CircleCheckButton';
import CourseCardPlaceholder from '../../assets/images/lhplaceholder.png';
import { RoundedPill } from '../RoundedPill';
import MiniTrophyIcon from '../../assets/images/minitrophy.svg';
import MiniJobIcon from '../../assets/images/minijob.svg';
import MiniPuzzleIcon from '../../assets/images/minipuzzle.svg';
import { LCSubtypes } from '../../types';

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
    type = LCSubtypes.job,
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

export const CourseVerticalCard: React.FC<CourseCardVerticalProps> = ({
    className,
    title,
    thumbImgSrc,
    showStatus,
    claimStatus = false,
    achievementCount = 0,
    skillCount = 0,
    checked,
    showChecked,
    onCheckClick,
    onClick,
}) => {
    const claimBtnStatusType = claimStatus ? LCSubtypes.course : LCSubtypes.locked;

    return (
        <div
            onClick={onClick}
            className={`flex flex-col shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[8px] px-[8px] w-[190px] h-[265px] rounded-[20px] ${className}`}
        >
            <section
                className={`relative flex h-[120px] flex-col justify-center items-center w-full rounded-[20px]`}
            >
                <img
                    src={CourseCardPlaceholder}
                    className="course-card-img h-full w-full object-cover rounded-[20px]"
                />

                {showChecked && (
                    <CircleCheckButton
                        checked={checked}
                        onClick={onCheckClick}
                        className="absolute top-[5px] left-[5px]"
                    />
                )}
            </section>

            <div className="course-card-detail-info flex flex-col justify-between">
                <p className="course-card-title text-sm text-center font-semibold line-clamp-2 mt-[4px]">
                    {title}
                </p>
                <div className="course-card-counts-container flex items-center justify-center my-[5px]">
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
            {showStatus && (
                <div className="course-card-footer absolute bottom-[6px] left-[5px]">
                    <RoundedPill
                        onClick={onClick}
                        showCheckmark
                        type={claimBtnStatusType}
                        statusText={'Passed'}
                    />
                </div>
            )}
        </div>
    );
};

export default CourseVerticalCard;
