import React from 'react';
import { AchievementCardProps } from '../../types';
import { RoundedPill } from '../RoundedPill';
import { Trophy } from '../svgs';
import { TYPE_TO_MINI_ICON } from '../RoundedSquare';

export const AchievementCard: React.FC<AchievementCardProps> = ({
    title = 'Title Lorem Ipsum',
    thumbImgSrc,
    claimStatus,
    showSkills = true,
    skillCount,
    showStatus = true,
    onClick = () => {},
}) => {
    const thumbClass = thumbImgSrc ? 'bg-grayscale-50' : 'bg-indigo-200';

    const claimBtnStatusType = claimStatus ? 'achievement' : 'locked';
    const skillIconSrc = TYPE_TO_MINI_ICON.skill;
    const skillCountTxt = skillCount && skillCount > 1 ? 'Skills' : 'Skill';

    return (
        <div
            className={`flex-col shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[8px] px-[8px] w-[190px] h-[265px] rounded-[20px] rounded-square-card-container`}
        >
            <section
                className={`relative flex h-[130px] ${thumbClass} flex-col justify-center items-center w-full rounded-[20px]`}
            >
                {thumbImgSrc && (
                    <img
                        className="h-full w-full object-contain rounded-[20px]"
                        src={thumbImgSrc ?? ''}
                        alt="Credential Achievement Image"
                    />
                )}
                {(!thumbImgSrc || thumbImgSrc === '') && (
                    <Trophy
                        className="achievement-placeholder-trophy flex p-[15px]"
                        color="#ffffff"
                    />
                )}

                {showSkills && skillCount && skillCount !== 0 && (
                    <div className="absolute px-[10px] text-[14px] flex items-center justify-center text-indigo-600 skill-pill font-bold min-w-[100px] bottom-[15px] right-[9px] rounded-[20px] h-[30px] bg-indigo-50 ">
                        <img
                            src={skillIconSrc}
                            className="flex items-center justify-center mr-[4px]"
                        />
                        +{skillCount} {skillCountTxt}
                    </div>
                )}
            </section>

            <section className="achievement-title w-full flex justify-center line-clamp-2">
                <p className="text-[14px] text-grayscale-900 font-bold mt-[10px] text-center">
                    {title}
                </p>
            </section>

            <section className="achievement-card-footer absolute bottom-[10px] left-[5px]">
                {showStatus && (
                    <RoundedPill
                        onClick={onClick}
                        showCheckmark
                        type={claimBtnStatusType}
                        statusText={'Claimed'}
                    />
                )}
            </section>
        </div>
    );
};

export default AchievementCard;
