import React from 'react';
import type { SkillsStatsCardProps } from '../../types';
import SkillGraphPlaceholder from '../../assets/images/skillgraph.svg';

type SkillStatListItemProps = {
    name?: string;
    percent: string | number;
    className?: string;
};

type SkillStatListItemIndicatorProps = {
    className?: string;
};

type MoreSkillsListItemProps = {
    count?: number | string;
    percent?: string;
    className?: string;
};

const SkillStatListItemIndicator: React.FC<SkillStatListItemIndicatorProps> = ({
    className = 'bg-emerald-700',
}) => {
    return (
        <span
            className={`${className} skill-item-stat-indicator w-[10px] h-[10px] rounded-[3px] mr-[10px]`}
        ></span>
    );
};

const SkillStatListItem: React.FC<SkillStatListItemProps> = ({ name, percent, className: _className }) => {
    const colorIndicator = <SkillStatListItemIndicator />;
    return (
        <div className="flex items-center justify-between px-[10px] skill-stat-list-item flex text-xs h-[20px] py-[5px] shadow-[0_1px_3px_rgba(0,0,0,0.3)] mt-[10px] rounded-[10px] text-grayscale-900 font-semibold">
            <span className="flex justify-center items-center">
                {colorIndicator}
                {name}
            </span>
            <span>{percent}%</span>
        </div>
    );
};

const MoreSkillsListItem: React.FC<MoreSkillsListItemProps> = ({ count, percent, className: _className }) => {
    const colorIndicator = <SkillStatListItemIndicator className="bg-grayscale-200" />;
    return (
        <div className="flex items-center justify-between px-[10px] skill-stat-list-item flex text-xs h-[20px] py-[5px] shadow-[0_1px_3px_rgba(0,0,0,0.3)] mt-[10px] rounded-[10px] text-grayscale-900 font-semibold">
            <span className="flex justify-center items-center">
                {colorIndicator}+{count} more
            </span>
            <span>{percent}%</span>
        </div>
    );
};

export const SkillsStatsCard: React.FC<SkillsStatsCardProps> = ({
    totalCount = 0,
    skills = [],
    className,
    onClick = () => {},
}) => {
    const title = `${totalCount} Skill Categories`;

    const showMore = skills?.length > 3;

    const renderSkillsList = skills?.slice(0, 3).map(skill => {
        return <SkillStatListItem name={skill?.name} percent={skill?.percent} key={skill?.name} />;
    });

    if (showMore) {
        const otherLength = skills?.length - 3;
        renderSkillsList?.push(<MoreSkillsListItem count={otherLength} percent={'27'} />);
    }

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

export default SkillsStatsCard;
