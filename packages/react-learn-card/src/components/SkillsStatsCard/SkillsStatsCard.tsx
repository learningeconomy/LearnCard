import React from 'react';
import { SkillsStatsCardProps } from '../../types';
import SkillGraphPlaceholder from '../../assets/images/skillgraph.svg';

type SkillStatListItemProps = {
    name?: string;
    percent: string | number;
    className?: string;
};

type SkillStatListItemIndicatorProps = {
    className?: string;
};

const SkillStatListItemIndicator: React.FC<SkillStatListItemIndicatorProps> = ({
    className = 'bg-emerald-700',
}) => {
    return <span className={`${className} skill-item-stat-indicator`}></span>;
};

const SkillStatListItem: React.FC<SkillStatListItemProps> = ({ name, percent, className }) => {
    const colorIndicator = <SkillStatListItemIndicator />;
    return (
        <div className="flex items-center justify-between px-[10px] skill-stat-list-item flex text-xs h-[20px] py-[5px] shadow-[0_1px_3px_rgba(0,0,0,0.3)] mt-[10px] rounded-[10px] text-grayscale-900 font-semibold">
            <span>
                {colorIndicator}
                {name}
            </span>
            <span>{percent}%</span>
        </div>
    );
};

export const SkillsCard: React.FC<SkillsStatsCardProps> = ({
    totalCount = 0,
    skills = [],
    className,
    onClick = () => {},
}) => {
    const title = `${totalCount} Skill Categories`;

    const renderSkillsList = skills?.slice(0, 3).map(skill => {
        return <SkillStatListItem name={skill?.name} percent={skill?.percent} key={skill?.name} />;
    });

    return (
        <div
            onClick={onClick}
            className={`flex-col shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[10px] px-[15px] max-w-[400px] h-[199px] rounded-[20px] ${className}`}
        >
            <section className="flex skill-stats-card-title-container items-center">
                <h3 className="text-[17px] text-gray-900 font-bold">{title}</h3>
            </section>

            <section className="skill-stats-card-body my-[5px] flex items-center justify-between">
                <img src={SkillGraphPlaceholder} className="skill-graph-container" />
                <div className="skill-stat-list w-full  ml-[15px]">{renderSkillsList}</div>
            </section>
        </div>
    );
};

export default SkillsCard;
