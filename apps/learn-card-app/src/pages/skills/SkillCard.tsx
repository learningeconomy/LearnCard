import React from 'react';
import { useGetSkill, useModal } from 'learn-card-base';

import { IonCol } from '@ionic/react';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import SelfVerifiedCertIcon from 'learn-card-base/svgs/SelfVerifiedCertIcon';
import Plus from '../../components/svgs/Plus';
import Pencil from '../../components/svgs/Pencil';
import TrashBin from '../../components/svgs/TrashBin';
import AddSkillModal, { PreviousSkillInfo } from './AddSkillModal';
import { SkillLevel, SKILL_LEVEL_META } from './skillTypes';
import { SkillFrameworkNode } from '../../components/boost/boost';
import { SelectedSkill } from './SkillSearchSelector';
import { convertApiSkillNodeToSkillTreeNode } from 'src/helpers/skillFramework.helpers';

type SkillCardProps = {
    skillId: string;
    frameworkId: string;
    skillTextOverride?: string;
    isSelfAssigned?: boolean;
    isSelected?: boolean;
    proficiencyLevel?: SkillLevel;
    selectedSkills?: SelectedSkill[];
    handleAddSkill?: (skill: SkillFrameworkNode, proficiencyLevel: SkillLevel) => void;
    handleEditSkill?: (skillId: string, proficiencyLevel: SkillLevel) => void;
    handleRemoveSkill?: (skillId: string) => void;
    previousSkills?: PreviousSkillInfo[];
    currentSkill?: SkillFrameworkNode;
    parentIsEdit?: boolean;
    parentProficiencyLevel?: SkillLevel;
    tallCard?: boolean;
};

const SkillCard: React.FC<SkillCardProps> = ({
    skillId,
    frameworkId,
    skillTextOverride,
    isSelfAssigned,
    isSelected,
    proficiencyLevel,
    selectedSkills,
    handleAddSkill,
    handleEditSkill,
    handleRemoveSkill,
    previousSkills = [],
    currentSkill,
    parentIsEdit,
    parentProficiencyLevel,
    tallCard = false,
}) => {
    const { replaceModal, closeModal } = useModal();
    const { data: skillData } = useGetSkill(frameworkId, skillId);
    const showActions = handleAddSkill || handleEditSkill || handleRemoveSkill;

    // Build updated previousSkills by adding currentSkill if provided
    const updatedPreviousSkills: PreviousSkillInfo[] = currentSkill
        ? [
              ...previousSkills,
              {
                  skill: currentSkill,
                  frameworkId,
                  isEdit: parentIsEdit,
                  proficiencyLevel: parentProficiencyLevel,
              },
          ]
        : previousSkills;

    const openAddSkillModal = () => {
        if (!skillData || !handleAddSkill) return;
        replaceModal(
            <AddSkillModal
                key={skillId}
                frameworkId={frameworkId}
                skill={convertApiSkillNodeToSkillTreeNode(skillData)}
                handleAdd={(sk, level) => handleAddSkill(sk, level)}
                selectedSkills={selectedSkills}
                handleAddRelatedSkill={handleAddSkill}
                handleEditRelatedSkill={handleEditSkill}
                handleRemoveRelatedSkill={handleRemoveSkill}
                previousSkills={updatedPreviousSkills}
            />
        );
    };

    const openEditSkillModal = () => {
        if (!skillData || !handleEditSkill) return;
        replaceModal(
            <AddSkillModal
                key={skillId}
                frameworkId={frameworkId}
                skill={convertApiSkillNodeToSkillTreeNode(skillData)}
                isEdit
                handleEditProficiency={level => handleEditSkill(skillId, level)}
                handleDelete={handleRemoveSkill ? () => handleRemoveSkill(skillId) : undefined}
                initialProficiencyLevel={proficiencyLevel}
                selectedSkills={selectedSkills}
                handleAddRelatedSkill={handleAddSkill}
                handleEditRelatedSkill={handleEditSkill}
                handleRemoveRelatedSkill={handleRemoveSkill}
                previousSkills={updatedPreviousSkills}
            />
        );
    };

    const showSelfAssigned = isSelfAssigned || isSelected; // isSelected to account for active self-assigning skills state

    return (
        <IonCol size="12" className="flex justify-center items-center relative">
            <div
                className={`flex bg-white flex-col shadow-box-bottom relative p-0 w-[160px] rounded-[20px] overflow-hidden border-[1px] border-solid ${
                    proficiencyLevel
                        ? `border-solid border-[2px] ${SKILL_LEVEL_META[proficiencyLevel].cardOuterBorderClass}`
                        : ''
                } ${tallCard ? 'h-[310px]' : 'min-h-[240px]'}`}
            >
                <div
                    className={`border-b-[1px] border-solid flex items-center justify-center py-[15px] ${
                        proficiencyLevel
                            ? SKILL_LEVEL_META[proficiencyLevel].cardInnerBorderClass
                            : 'border-grayscale-50'
                    } ${
                        showSelfAssigned && proficiencyLevel
                            ? SKILL_LEVEL_META[proficiencyLevel].cardIconBgClass
                            : 'bg-grayscale-100'
                    }`}
                >
                    <CompetencyIcon icon={skillData?.icon} size="super-big" />
                </div>

                {showSelfAssigned && (
                    <div
                        className={`bg-white rounded-full p-[3px] border-[1px] border-solid absolute top-[3px] right-[3px] ${
                            proficiencyLevel
                                ? SKILL_LEVEL_META[proficiencyLevel].cardInnerBorderClass
                                : ''
                        }`}
                    >
                        <SelfVerifiedCertIcon className="w-[25px] h-[25px]" />
                    </div>
                )}

                {proficiencyLevel !== undefined && proficiencyLevel !== SkillLevel.Hidden && (
                    <div
                        className={`absolute top-[108px] left-1/2 -translate-x-1/2 px-[12px] py-[2px] rounded-full bg-white border shadow-sm flex items-center justify-center ${
                            proficiencyLevel
                                ? SKILL_LEVEL_META[proficiencyLevel].cardInnerBorderClass
                                : ''
                        }`}
                    >
                        <span
                            className={`text-[13px] font-poppins font-[600] ${SKILL_LEVEL_META[proficiencyLevel].cardTextClass}`}
                        >
                            {SKILL_LEVEL_META[proficiencyLevel].name}
                        </span>
                    </div>
                )}

                <div className="text-grayscale-900 flex px-[15px] flex-1 flex-col gap-[10px] relative pt-[20px] pb-[10px]">
                    <div className="h-[44px] flex items-center justify-center">
                        <p
                            className="line-clamp-2 text-grayscale-800 font-poppins text-[14px] font-[600] text-center"
                            title={skillData?.statement}
                        >
                            {skillData?.statement}
                        </p>
                    </div>

                    <div className="px-[10px] py-[2px] flex gap-[3px] items-center justify-center rounded-[5px] overflow-hidden bg-violet-100 self-center">
                        <PuzzlePiece
                            className="w-[20px] h-[20px] text-grayscale-800"
                            version="filled"
                        />
                        <p className="text-[12px] text-grayscale-800 font-poppins font-[600]">
                            {skillTextOverride || '1 Skill'}
                        </p>
                    </div>

                    {showActions && (
                        <div className="flex items-center gap-[5px] w-full mt-auto pt-[10px]">
                            {isSelected ? (
                                <>
                                    {handleEditSkill && (
                                        <button
                                            type="button"
                                            className="bg-grayscale-50 w-full p-[5px] rounded-full border-[1px] border-solid border-grayscale-200 flex justify-center"
                                            onClick={e => {
                                                e.stopPropagation();
                                                openEditSkillModal();
                                            }}
                                        >
                                            <Pencil className="w-[20px] h-[20px] text-grayscale-700" />
                                        </button>
                                    )}
                                    {handleRemoveSkill && (
                                        <button
                                            type="button"
                                            className="bg-grayscale-900 w-full p-[5px] rounded-full border-[1px] border-solid border-grayscale-200 flex justify-center"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleRemoveSkill(skillId);
                                                closeModal();
                                            }}
                                        >
                                            <TrashBin
                                                className="w-[20px] h-[20px] text-white"
                                                version="2"
                                                strokeWidth="2"
                                            />
                                        </button>
                                    )}
                                </>
                            ) : (
                                handleAddSkill && (
                                    <button
                                        type="button"
                                        className="bg-grayscale-50 w-full p-[5px] rounded-full border-[1px] border-solid border-grayscale-200 flex justify-center"
                                        onClick={e => {
                                            e.stopPropagation();
                                            openAddSkillModal();
                                        }}
                                    >
                                        <Plus
                                            className="w-[20px] h-[20px] text-grayscale-900"
                                            strokeWidth="2"
                                        />
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tailwind classes are now explicitly referenced in SKILL_LEVEL_META */}
        </IonCol>
    );
};

export default SkillCard;
