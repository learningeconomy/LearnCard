import React from 'react';
import { SkillsCardProps } from '../../types';

export const SkillsCard: React.FC<SkillsCardProps> = ({
    count = 14,
    title = 'Creative Thinking',
    level = 'Expert',
    category = 'Creativity',
    levelCount = 9,
    className,
    onClick = () => {},
}) => {
    return (
        <div
            onClick={onClick}
            className={`flex justify-center items-center relative w-full rounded-3xl shadow-2xl py-3 bg-white ${className}`}
        >
            Skills Card
        </div>
    );
};

export default SkillsCard;
