import React from 'react';

import FrameworkSearchResultItem from './FrameworkSearchResultItem';

import * as m from '../../paraglide/messages.js';
import { SkillFrameworkNode, SkillFrameworkNodeWithSearchInfo } from '../../components/boost/boost';
import { ApiFrameworkInfo } from '../../helpers/skillFramework.helpers';

type FrameworkSearchResultsProps = {
    searchResults: (SkillFrameworkNode | SkillFrameworkNodeWithSearchInfo)[];
    frameworkInfo: ApiFrameworkInfo;
    className?: string;
    resultTextClassName?: string;
    onClick: (
        node: SkillFrameworkNode | SkillFrameworkNodeWithSearchInfo,
        path: SkillFrameworkNode[]
    ) => void;
    isSelectSkillsFlow?: boolean;
    selectedSkills?: SkillFrameworkNode[];
    handleToggleSkill?: (node: SkillFrameworkNode) => void;
};

const FrameworkSearchResults: React.FC<FrameworkSearchResultsProps> = ({
    searchResults,
    frameworkInfo,
    className = '',
    resultTextClassName = '',
    onClick,
    isSelectSkillsFlow,
    selectedSkills,
    handleToggleSkill,
}) => {
    return (
        <div
            className={`px-[15px] py-[5px] flex flex-col gap-[10px] w-full max-w-[600px] mx-auto overflow-y-auto ${className}`}
        >
            <p
                className={`font-poppins text-[17px] font-[700] text-grayscale-800 ${resultTextClassName}`}
            >
                {searchResults.length === 1 ? m['skillFrameworks.result_one']() : m['skillFrameworks.result_other']({ count: searchResults.length })}
            </p>
            {searchResults.map((result, index) => (
                <FrameworkSearchResultItem
                    key={index}
                    node={result}
                    frameworkInfo={frameworkInfo}
                    onClick={onClick}
                    isSelectSkillsFlow={isSelectSkillsFlow}
                    selectedSkills={selectedSkills}
                    handleToggleSkill={handleToggleSkill}
                />
            ))}
        </div>
    );
};

export default FrameworkSearchResults;
