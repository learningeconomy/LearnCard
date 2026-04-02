import React from 'react';

import { ModalTypes, useGetSkill, useModal } from 'learn-card-base';

import AddSkillModal from './AddSkillModal';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import SkillProficiencyCircle from './SkillProficiencyCircle';
import TrashBin from 'src/components/svgs/TrashBin';
import Pencil from 'src/components/svgs/Pencil';

import { SkillLevel } from './skillTypes';
import { SkillFrameworkNode } from 'src/components/boost/boost';
import { SelectedSkill } from './SkillSearchSelector';

type SkillTagProps = {
    frameworkId: string;
    skillId: string;
    proficiencyLevel: SkillLevel;
    handleRemoveSkill?: (skill: any) => void;
    handleEditSkill?: (proficiencyLevel: SkillLevel) => void;
    selectedSkills?: SelectedSkill[];
    handleAddRelatedSkill?: (skill: SkillFrameworkNode, proficiencyLevel: SkillLevel) => void;
    handleEditRelatedSkill?: (skillId: string, proficiencyLevel: SkillLevel) => void;
    handleRemoveRelatedSkill?: (skillId: string) => void;
};

const SkillTag: React.FC<SkillTagProps> = ({
    skillId,
    frameworkId,
    proficiencyLevel,
    handleRemoveSkill,
    handleEditSkill,
    selectedSkills,
    handleAddRelatedSkill,
    handleEditRelatedSkill,
    handleRemoveRelatedSkill,
}) => {
    const { newModal } = useModal();
    const { data: skill } = useGetSkill(frameworkId, skillId);

    const openEditSkillModal = (skill: SkillFrameworkNode) => {
        if (!skill || !handleEditSkill) return;

        newModal(
            <AddSkillModal
                frameworkId={frameworkId}
                skill={skill}
                isEdit
                handleEditProficiency={handleEditSkill}
                handleDelete={handleRemoveSkill ? () => handleRemoveSkill(skill) : undefined}
                initialProficiencyLevel={proficiencyLevel}
                selectedSkills={selectedSkills}
                handleAddRelatedSkill={handleAddRelatedSkill}
                handleEditRelatedSkill={handleEditRelatedSkill}
                handleRemoveRelatedSkill={handleRemoveRelatedSkill}
            />,
            undefined,
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    return (
        <div className="bg-violet-100 text-grayscale-900 pl-[3px] pr-[10px] py-[3px] rounded-[40px] flex items-center gap-[5px] w-fit shrink-0">
            <SkillProficiencyCircle proficiencyLevel={proficiencyLevel}>
                <CompetencyIcon icon={skill?.icon} size="small" withWhiteBackground />
            </SkillProficiencyCircle>
            <span className="font-poppins text-[13px] font-bold leading-[130%]">
                {skill?.statement ?? '...'}
            </span>
            <div className="flex items-center gap-[2px]">
                {handleEditSkill && (
                    <button
                        type="button"
                        className="text-grayscale-700 p-[3px] rounded-full"
                        onClick={() => openEditSkillModal(skill)}
                    >
                        <Pencil className="w-[23px] h-[23px]" />
                    </button>
                )}
                {handleRemoveSkill && (
                    <button
                        type="button"
                        className="text-grayscale-700 p-[3px] rounded-full"
                        onClick={() => handleRemoveSkill(skill)}
                    >
                        <TrashBin className="w-[23px] h-[23px]" version="2" strokeWidth="2" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SkillTag;
