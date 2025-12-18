import React from 'react';
import { useModal, ModalTypes, middleTruncate, useGetSkillChildren } from 'learn-card-base';

import Pencil from 'apps/learn-card-app/src/components/svgs/Pencil';
import TierRow from './TierRow';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import CompetencyIcon from './CompetencyIcon';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import ViewAlignmentInfo from './ViewAlignmentInfo';
import EditAlignmentModal from './EditAlignmentModal';
import CornerDownRightArrow from 'learn-card-base/svgs/CornerDownRightArrow';

import {
    FrameworkNodeRole,
    SkillFramework,
    SkillFrameworkNode,
} from 'apps/learn-card-app/src/components/boost/boost';
import { convertApiSkillNodesToSkillFrameworkNodes } from '../../helpers/skillFramework.helpers';

type CompetencyRowProps = {
    framework: SkillFramework;
    node: SkillFrameworkNode;
    isEdit?: boolean;
    selectedPath?: SkillFrameworkNode[];
    handleEdit?: (node: SkillFrameworkNode) => void;
    handleDelete?: (
        node: SkillFrameworkNode,
        numberOfSkillsDeleted: number,
        parentPathIds: string[]
    ) => void;
    onClick?: (node: SkillFrameworkNode) => void; // only used if !isEdit
    isSelectSkillsFlow?: boolean;
    selectedSkills?: SkillFrameworkNode[];
    handleToggleSkill?: (node: SkillFrameworkNode) => void;
    isFullSkillFramework?: boolean;
    editedNodes?: Record<string, SkillFrameworkNode>;
    deletedNodes?: SkillFrameworkNode[];
    addedNodes?: Record<string, SkillFrameworkNode[]>;
    isNodeInSelectedPath?: (node: SkillFrameworkNode) => boolean;
    onTierClick?: (node: SkillFrameworkNode) => void;
    countAdjustments?: Record<string, number>;
};

const CompetencyRow: React.FC<CompetencyRowProps> = ({
    framework,
    node,
    isEdit = false,
    selectedPath = [],
    handleEdit,
    handleDelete,
    onClick,
    isSelectSkillsFlow = false,
    selectedSkills,
    handleToggleSkill,
    isFullSkillFramework = false,
    editedNodes = {},
    deletedNodes = [],
    addedNodes = {},
    isNodeInSelectedPath = () => false,
    onTierClick,
    countAdjustments,
}) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const { data } = useGetSkillChildren(framework?.id, node?.id);
    const apiNodes = data?.records;

    let subskills =
        apiNodes && !isFullSkillFramework
            ? convertApiSkillNodesToSkillFrameworkNodes(apiNodes)
            : node.subskills;

    subskills = subskills
        ?.filter(node => {
            const isDeleted = deletedNodes.some(deletedNode => deletedNode.id === node.id);
            return !isDeleted;
        })
        .map(node => {
            if (editedNodes[node.id!]) {
                return editedNodes[node.id!];
            }
            return node;
        });
    subskills = subskills?.concat(addedNodes[node?.id ?? 'root'] || []);

    const isNodeSelected = selectedSkills?.some(skill => skill.id === node.id);

    const handleClick = () => {
        if (isEdit) return;
        else if (isSelectSkillsFlow) handleToggleSkill?.(node);
        else onClick?.(node);
    };

    return (
        <>
            {/* mx-[4px] so we can see the shadow on the side, can be removed if we can figure out how to make the overflow visible */}
            <div
                role={isEdit ? undefined : 'button'}
                onClick={handleClick}
                className="p-[10px] flex items-center gap-[10px] text-grayscale-900 bg-white rounded-[15px] shadow-box-bottom h-[72px] w-full"
            >
                <CompetencyIcon icon={node.icon} />

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

                {isEdit && (
                    <button
                        className="ml-auto"
                        onClick={e => {
                            e.stopPropagation();
                            newModal(
                                <EditAlignmentModal
                                    framework={framework}
                                    node={node}
                                    selectedPath={selectedPath}
                                    handleEdit={handleEdit}
                                    handleDelete={handleDelete}
                                />
                            );
                        }}
                    >
                        <Pencil className="w-[24px] h-[24px]" version={3} />
                    </button>
                )}

                {isSelectSkillsFlow && (
                    <>
                        {isNodeSelected ? (
                            <CircleCheckmark className="w-[40px] h-[40px]" version="no-padding" />
                        ) : (
                            <div className="w-[40px] h-[40px] rounded-full bg-grayscale-300" />
                        )}
                        <button
                            className="ml-auto pl-[10px] border-l-[1px] border-grayscale-200 border-solid text-grayscale-500 h-full"
                            onClick={e => {
                                e.stopPropagation();
                                newModal(
                                    <ViewAlignmentInfo
                                        alignment={node}
                                        framework={framework}
                                        selectedPath={selectedPath}
                                    />
                                );
                            }}
                        >
                            <SlimCaretRight className="w-[24px] h-[24px]" strokeWidth="2" />
                        </button>
                    </>
                )}
            </div>
            {subskills?.map((subskill, index) => (
                <div className="flex items-center gap-[10px] pl-[10px]" key={index}>
                    <CornerDownRightArrow className="w-[25px] h-[25px]" />

                    {subskill.role === FrameworkNodeRole.tier ? (
                        <TierRow
                            key={index}
                            node={subskill}
                            onClick={() => onTierClick?.(subskill)}
                            isNodeInSelectedPath={isNodeInSelectedPath}
                            isEdit={isEdit}
                            framework={framework}
                            selectedPath={[...selectedPath, node]}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            isFullSkillFramework={isFullSkillFramework}
                            countAdjustment={countAdjustments?.[subskill.id ?? '']}
                        />
                    ) : (
                        <CompetencyRow
                            framework={framework}
                            node={subskill}
                            isEdit={isEdit}
                            selectedPath={[...selectedPath, node]}
                            isSelectSkillsFlow={isSelectSkillsFlow}
                            selectedSkills={selectedSkills}
                            handleEdit={handleEdit}
                            handleDelete={handleDelete}
                            onClick={onClick}
                            handleToggleSkill={handleToggleSkill}
                            isFullSkillFramework={isFullSkillFramework}
                            editedNodes={editedNodes}
                            deletedNodes={deletedNodes}
                            addedNodes={addedNodes}
                            isNodeInSelectedPath={isNodeInSelectedPath}
                        />
                    )}
                </div>
            ))}
        </>
    );
};

export default CompetencyRow;
