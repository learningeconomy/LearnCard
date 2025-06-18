import React from 'react';
import type { SkillsCardProps } from '../../types';

type SkillsMeterSegmentProps = {
    filled?: boolean;
    className?: string;
    skillColor?: string;
};

export const SkillsMeterSegment: React.FC<SkillsMeterSegmentProps> = ({
    filled = false,
    className: _className,
    skillColor = 'bg-cyan-700',
}) => {
    const bgColor = filled ? skillColor : 'bg-gray-200';
    return (
        <div
            className={`skills-meter-segment h-[20px] w-full max-w-[27px] ${bgColor} mr-[5px] rounded-[5px]`}
        ></div>
    );
};

export const SkillsCard: React.FC<SkillsCardProps> = ({
    count = 14,
    title = 'Creative Thinking',
    level = 'Expert',
    category = 'Creativity',
    levelCount = 9,
    skillColor = 'bg-cyan-700',
    className,
    onClick = () => {},
}) => {
    const renderSkillsMeter = () => {
        const num = levelCount;
        const skillMeter = [...Array(10).keys()].map(counter => {
            console.log('///counter', counter, 'num', num);
            const filled = counter < num;
            return <SkillsMeterSegment filled={filled} key={counter} skillColor={skillColor} />;
        });

        return skillMeter;
    };

    const skillsMeter = renderSkillsMeter();

    return (
        <div
            onClick={onClick}
            className={`flex-col shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[10px] px-[15px] max-w-[400px] h-[129px] rounded-[20px] ${className}`}
        >
            <section className="flex skill-card-title-container items-center">
                <div className="flex items-center justify-center skill-count-display text-[20px] min-w-[30px] bg-grayscale-100 rounded-full px-[5px] mr-[8px]">
                    {count}
                </div>
                <h3 className="text-[17px] font-semibold">{title}</h3>
            </section>

            <section className="skill-card-details my-[5px]">
                <p className="text-sm text-gray-900 font-semibold">Skill Level: {level}</p>
                <p className="text-sm text-gray-900 font-semibold">Categories: {category}</p>
            </section>

            <section className="flex w-full skill-meter-full mt-[8px]">{skillsMeter}</section>
        </div>
    );
};

export default SkillsCard;
