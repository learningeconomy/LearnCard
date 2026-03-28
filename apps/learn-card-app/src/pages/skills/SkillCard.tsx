import React from 'react';
import { useGetSkill, useModal, ModalTypes } from 'learn-card-base';

import { IonCol } from '@ionic/react';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import SelfVerifiedCertIcon from 'learn-card-base/svgs/SelfVerifiedCertIcon';
import Plus from '../../components/svgs/Plus';
import Pencil from '../../components/svgs/Pencil';
import TrashBin from '../../components/svgs/TrashBin';
import AddSkillModal from './AddSkillModal';
import { SkillLevel } from './skillTypes';
import { SkillFrameworkNode } from '../../components/boost/boost';
import { SelectedSkill } from './SkillSearchSelector';

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
}) => {
    const { newModal } = useModal();
    const { data: skillData } = useGetSkill(frameworkId, skillId);
    const showActions = handleAddSkill || handleEditSkill || handleRemoveSkill;

    const openAddSkillModal = () => {
        if (!skillData || !handleAddSkill) return;
        newModal(
            <AddSkillModal
                frameworkId={frameworkId}
                skill={skillData}
                handleAdd={(sk, level) => handleAddSkill(sk, level)}
                selectedSkills={selectedSkills}
                handleAddRelatedSkill={handleAddSkill}
                handleEditRelatedSkill={handleEditSkill}
                handleRemoveRelatedSkill={handleRemoveSkill}
            />,
            undefined,
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const openEditSkillModal = () => {
        if (!skillData || !handleEditSkill) return;
        newModal(
            <AddSkillModal
                frameworkId={frameworkId}
                skill={skillData}
                isEdit
                handleEditProficiency={level => handleEditSkill(skillId, level)}
                handleDelete={handleRemoveSkill ? () => handleRemoveSkill(skillId) : undefined}
                initialProficiencyLevel={proficiencyLevel}
                selectedSkills={selectedSkills}
                handleAddRelatedSkill={handleAddSkill}
                handleEditRelatedSkill={handleEditSkill}
                handleRemoveRelatedSkill={handleRemoveSkill}
            />,
            undefined,
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    return (
        <IonCol size="12" className="flex justify-center items-center relative">
            <div className="flex bg-white flex-col shadow-box-bottom relative p-0 w-[160px] h-[310px] rounded-[20px] overflow-hidden ">
                <div
                    className={`border-b-[1px] border-solid border-grayscale-200 flex items-center justify-center py-[15px] ${
                        isSelfAssigned ? 'bg-sky-50' : 'bg-grayscale-100'
                    }`}
                >
                    <CompetencyIcon icon={skillData?.icon} size="super-big" />
                </div>

                {isSelfAssigned && (
                    <div className="bg-white rounded-full p-[3px] border-[1px] border-solid border-sky-200 absolute top-[3px] right-[3px]">
                        <SelfVerifiedCertIcon className="w-[25px] h-[25px]" />
                    </div>
                )}

                <div className="text-grayscale-900 flex px-[15px] flex-1 flex-col relative py-[15px]">
                    <div className="h-[44px] flex items-center justify-center mb-[10px]">
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
        </IonCol>
    );
};

export default SkillCard;
