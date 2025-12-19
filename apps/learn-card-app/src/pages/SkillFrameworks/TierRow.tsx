import React from 'react';

import Pencil from 'apps/learn-card-app/src/components/svgs/Pencil';
import TierIcon from './TierIcon';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import EditAlignmentModal from './EditAlignmentModal';
import FrameworkSkillsCount from './FrameworkSkillsCount';

import { ModalTypes, useModal } from 'learn-card-base';
import { SkillFramework, SkillFrameworkNode } from 'apps/learn-card-app/src/components/boost/boost';
import { countCompetenciesInNode } from '../../helpers/skillFramework.helpers';

type TierRowProps = {
    node: SkillFrameworkNode;
    framework: SkillFramework;
    onClick?: () => void;
    isNodeInSelectedPath?: (node: SkillFrameworkNode) => boolean;
    isEdit?: boolean;
    selectedPath?: SkillFrameworkNode[];
    handleEdit?: (node: SkillFrameworkNode) => void;
    handleDelete?: (
        node: SkillFrameworkNode,
        numberOfSkillsDeleted: number,
        parentPathIds: string[]
    ) => void;
    isFullSkillFramework?: boolean;
    countAdjustment?: number;
};

const TierRow: React.FC<TierRowProps> = ({
    node,
    framework,
    onClick,
    isNodeInSelectedPath = () => false,
    isEdit = false,
    selectedPath = [],
    handleEdit,
    handleDelete,
    isFullSkillFramework = false,
    countAdjustment = 0,
}) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const countOverride = isFullSkillFramework ? countCompetenciesInNode(node) : undefined;

    return (
        <div
            role="button"
            onClick={onClick}
            className={`p-[10px] flex items-center gap-[10px] text-grayscale-900 rounded-[10px] w-full ${
                isNodeInSelectedPath(node) ? 'bg-grayscale-100' : ''
            }`}
        >
            {isEdit && (
                <button
                    className=""
                    onClick={e => {
                        e.stopPropagation();
                        newModal(
                            <EditAlignmentModal
                                framework={framework}
                                node={node}
                                selectedPath={selectedPath}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                                countOverride={countOverride}
                                countAdjustment={countAdjustment}
                            />
                        );
                    }}
                >
                    <Pencil className="w-[24px] h-[24px]" version={3} />
                </button>
            )}

            <TierIcon icon={node.icon} />

            <div className="flex flex-col">
                <span className="font-poppins text-[14px] text-grayscale-900 line-clamp-2">
                    {node.targetName}
                </span>
                <FrameworkSkillsCount
                    frameworkId={framework.id}
                    skillId={node.id}
                    includeSkillWord
                    className="text-[12px] text-grayscale-700"
                    countOverride={countOverride}
                    countAdjustment={countAdjustment}
                />
            </div>

            <SkinnyCaretRight className="ml-auto text-grayscale-700 h-[25px] w-[25px] shrink-0" />
        </div>
    );
};

export default TierRow;
