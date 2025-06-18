import React from 'react';
import type { SkillVerticalCardProps } from '../../types';
import SkillPlaceholder from '../../assets/images/skillplaceholder.png';

export const SkillVerticalCard: React.FC<SkillVerticalCardProps> = ({
    title = 'Creative Thinking',
    thumbImg,
    className,
    onClick = () => {},
}) => {
    const thumbSrc = thumbImg || SkillPlaceholder;

    return (
        <div
            onClick={onClick}
            className={`flex-col shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[0px] px-[0px] w-[160px] h-[215px] rounded-[20px] overflow-hidden ${className}`}
        >
            <section className="flex skill-vert-card-title-container items-center bg-indigo-600 h-[76px] justify-center items-center">
                <h3 className="text-[14px] font-semibold text-white">{title}</h3>
            </section>

            <section className="skill-vert-card-details my-[5px] flex items-center justify-center overflow-hidden pt-[5px]">
                <img
                    src={thumbSrc}
                    className="skill-vert-thumb object-cover overflow-hidden w-[140px] h-[119px] rounded-[20px]"
                />
            </section>
        </div>
    );
};

export default SkillVerticalCard;
