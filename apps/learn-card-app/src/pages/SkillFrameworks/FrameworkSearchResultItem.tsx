import React from 'react';
import { middleTruncate, useGetSkillPath } from 'learn-card-base';

import { IonSpinner } from '@ionic/react';
import TierIcon from './TierIcon';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import CompetencyIcon from './CompetencyIcon';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import FrameworkSkillsCount from './FrameworkSkillsCount';

import {
    ApiFrameworkInfo,
    convertApiSkillNodeToSkillTreeNode,
} from '../../helpers/skillFramework.helpers';
import {
    FrameworkNodeRole,
    SkillFrameworkNode,
    SkillFrameworkNodeWithSearchInfo,
} from '../../components/boost/boost';

type FrameworkSearchResultItemProps = {
    node: SkillFrameworkNode | SkillFrameworkNodeWithSearchInfo;
    frameworkInfo: ApiFrameworkInfo;
    onClick: (
        node: SkillFrameworkNode | SkillFrameworkNodeWithSearchInfo,
        path: SkillFrameworkNode[]
    ) => void;
    isSelectSkillsFlow?: boolean;
    selectedSkills?: SkillFrameworkNode[];
    handleToggleSkill?: (node: SkillFrameworkNode) => void;
};

const FrameworkSearchResultItem: React.FC<FrameworkSearchResultItemProps> = ({
    node,
    frameworkInfo,
    onClick,
    isSelectSkillsFlow,
    selectedSkills,
    handleToggleSkill,
}) => {
    const isTier = node.role === FrameworkNodeRole.tier;
    const isNodeSelected = selectedSkills?.some(skill => skill.id === node.id);

    const alreadyHavePath = 'path' in node;

    const { data, isLoading: _pathLoading } = useGetSkillPath(frameworkInfo.id, node.id, {
        enabled: !alreadyHavePath,
    });
    let path = data?.path
        ? [...data.path.map(node => convertApiSkillNodeToSkillTreeNode(node))].reverse()
        : [];

    let pathLoading = _pathLoading;

    if (alreadyHavePath) {
        // Used in Review Framework flow when the full skill tree is given in a JSON
        path = node.path;
        pathLoading = false;
    }

    // pathNames includes the current node
    const pathNames = [frameworkInfo.name, ...path.map(p => p.statement ?? p.targetName)];

    // we only want to include the most recent two parents. Don't include the current node.
    const pathNamesString = pathNames.slice(Math.max(0, pathNames.length - 3), -1).join(' > ');

    return (
        <div className="flex flex-col rounded-[15px] overflow-hidden shadow-bottom-2-4">
            <div className="flex gap-[5px] items-center justify-start p-[10px] bg-grayscale-100 text-grayscale-600 font-poppins text-[12px] font-[600]">
                <SkillsFrameworkIcon
                    className="h-[20px] w-[20px] shrink-0"
                    color="currentColor"
                    version="outlined"
                />
                {pathLoading && (
                    <IonSpinner
                        color="dark"
                        name="crescent"
                        className="h-[12px] w-[12px] ml-[5px]"
                    />
                )}
                {!pathLoading && pathNames.length > 3 && '... > '}
                {!pathLoading && pathNamesString}
            </div>
            <div
                role="button"
                className="flex items-center justify-start text-left gap-[10px] p-[10px]"
                onClick={e => {
                    e.stopPropagation();
                    if (isSelectSkillsFlow && !isTier) {
                        handleToggleSkill?.(node);
                    } else {
                        onClick?.(node, path);
                    }
                }}
            >
                {isTier ? <TierIcon icon={node.icon} /> : <CompetencyIcon icon={node.icon} />}

                {isTier ? (
                    <div className="flex flex-col">
                        <span className="font-poppins text-[17px] text-grayscale-900 line-clamp-2">
                            {node.targetName}
                        </span>
                        <span className="flex font-poppins text-[12px] text-grayscale-700 font-[700]">
                            Framework Tier •{' '}
                            <FrameworkSkillsCount
                                frameworkId={frameworkInfo.id}
                                skillId={node.id}
                                includeSkillWord
                                className="text-[12px] text-grayscale-700"
                                countOverride={
                                    'numberOfSkills' in node ? node.numberOfSkills : undefined
                                }
                            />
                        </span>
                    </div>
                ) : (
                    <div className="flex-1 min-w-0 font-poppins text-[17px] text-grayscale-900">
                        <p className="line-clamp-2">
                            <span className="inline-flex items-center gap-[2px] whitespace-nowrap align-middle">
                                <PuzzlePiece
                                    version="filled"
                                    className="shrink-0 h-[17px] w-[17px] text-grayscale-900"
                                />
                                <span className="shrink-0 font-[600]">
                                    {middleTruncate(node.targetCode ?? '')}
                                </span>
                            </span>{' '}
                            {node.targetName}
                        </p>
                    </div>
                )}

                {isSelectSkillsFlow && !isTier && (
                    <div className="ml-auto flex items-center h-full gap-[10px]">
                        {isNodeSelected ? (
                            <CircleCheckmark className="w-[40px] h-[40px]" version="no-padding" />
                        ) : (
                            <div className="w-[40px] h-[40px] rounded-full bg-grayscale-300" />
                        )}
                        <button
                            className="pl-[10px] border-l-[1px] border-grayscale-200 border-solid text-grayscale-500 h-full"
                            onClick={e => {
                                e.stopPropagation();
                                onClick?.(node, path);
                            }}
                        >
                            <SlimCaretRight className="w-[24px] h-[24px]" strokeWidth="2" />
                        </button>
                    </div>
                )}

                {!isSelectSkillsFlow && (
                    <SlimCaretRight className="ml-auto text-grayscale-400 h-[20px] w-[20px] shrink-0" />
                )}
            </div>
        </div>
    );
};

export default FrameworkSearchResultItem;
