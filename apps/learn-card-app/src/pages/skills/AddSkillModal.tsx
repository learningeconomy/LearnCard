import React, { useState } from 'react';
import { useModal, useDeviceTypeByWidth } from 'learn-card-base';

import RelatedSkills from './RelatedSkills';
import SkillFrameworkInfoBox from './SkillFrameworkInfoBox';

import X from '../../components/svgs/X';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import SkillProficiencyBar from './SkillProficiencyBar';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import { IonFooter } from '@ionic/react';

import { SkillLevel } from './skillTypes';
import { FrameworkNodeRole, SkillFrameworkNode } from '../../components/boost/boost';
import { SelectedSkill } from './SkillSearchSelector';

export type PreviousSkillInfo = {
    skill: SkillFrameworkNode;
    frameworkId: string;
    isEdit?: boolean;
    proficiencyLevel?: SkillLevel;
};

enum AddSkillTabEnum {
    Options = 'Options',
    Details = 'Details',
}

type AddSkillModalProps = {
    frameworkId: string;
    skill: SkillFrameworkNode;
    handleAdd?: (skill: SkillFrameworkNode, proficiencyLevel: SkillLevel) => void;
    isEdit?: boolean;
    handleEditProficiency?: (proficiencyLevel: SkillLevel) => void;
    handleDelete?: () => void;
    initialProficiencyLevel?: SkillLevel;
    selectedSkills?: SelectedSkill[];
    handleAddRelatedSkill?: (skill: SkillFrameworkNode, proficiencyLevel: SkillLevel) => void;
    handleEditRelatedSkill?: (skillId: string, proficiencyLevel: SkillLevel) => void;
    handleRemoveRelatedSkill?: (skillId: string) => void;
    previousSkills?: PreviousSkillInfo[];
};

const AddSkillModal: React.FC<AddSkillModalProps> = ({
    frameworkId,
    skill,
    handleAdd,
    isEdit = false,
    handleEditProficiency,
    handleDelete,
    initialProficiencyLevel,
    selectedSkills,
    handleAddRelatedSkill,
    handleEditRelatedSkill,
    handleRemoveRelatedSkill,
    previousSkills = [],
}) => {
    const { closeModal, replaceModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth();

    const [proficiencyLevel, setProficiencyLevel] = useState<SkillLevel>(
        initialProficiencyLevel || SkillLevel.Hidden
    );
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedTab, setSelectedTab] = useState<AddSkillTabEnum>(AddSkillTabEnum.Options);

    const handleCloseWithEditProficiency = () => {
        if (isEdit && handleEditProficiency) {
            handleEditProficiency(proficiencyLevel);
        }
        closeModal();
    };

    const handleGoBack = () => {
        if (previousSkills.length === 0) return;
        const prev = previousSkills[previousSkills.length - 1];
        const remainingPrevious = previousSkills.slice(0, -1);

        replaceModal(
            <AddSkillModal
                key={prev.skill.id}
                frameworkId={prev.frameworkId}
                skill={prev.skill}
                isEdit={prev.isEdit}
                handleAdd={handleAdd}
                handleEditProficiency={
                    prev.isEdit
                        ? handleEditRelatedSkill
                            ? level => handleEditRelatedSkill(prev.skill.id!, level)
                            : undefined
                        : undefined
                }
                handleDelete={
                    prev.isEdit && handleRemoveRelatedSkill
                        ? () => handleRemoveRelatedSkill(prev.skill.id!)
                        : undefined
                }
                initialProficiencyLevel={prev.proficiencyLevel}
                selectedSkills={selectedSkills}
                handleAddRelatedSkill={handleAddRelatedSkill}
                handleEditRelatedSkill={handleEditRelatedSkill}
                handleRemoveRelatedSkill={handleRemoveRelatedSkill}
                previousSkills={remainingPrevious}
            />
        );
    };

    const previousSkill =
        previousSkills.length > 0 ? previousSkills[previousSkills.length - 1] : null;

    // @ts-ignore
    const description = skill?.targetDescription || skill?.description || '';
    const isTier = skill?.role === FrameworkNodeRole.tier;

    return (
        <div
            role="button"
            onClick={e => {
                e.stopPropagation();
                handleCloseWithEditProficiency();
            }}
            className="h-full w-full flex items-center justify-center relative bg-grayscale-200 backdrop-blur-[22.5px] bg-opacity-70"
        >
            {previousSkill && (
                <button
                    className="absolute top-[20px] left-[20px] bg-white rounded-full p-[12px] shadow-bottom-4-4 flex items-center gap-[10px] max-w-[300px]"
                    onClick={e => {
                        e.stopPropagation();
                        handleGoBack();
                    }}
                >
                    <SlimCaretLeft className="h-[20px] w-[20px] text-grayscale-700 flex-shrink-0" />
                    <div className="flex items-center gap-[5px] overflow-hidden">
                        <CompetencyIcon icon={previousSkill.skill.icon} size="small" />
                        <span className="text-[14px] text-grayscale-800 font-bold font-poppins truncate">
                            {previousSkill.skill.targetName}
                        </span>
                    </div>
                </button>
            )}

            <button
                className="absolute top-[20px] right-[20px] bg-white rounded-full p-[12px] shadow-bottom-4-4"
                onClick={e => {
                    e.stopPropagation();
                    handleCloseWithEditProficiency();
                }}
            >
                <X className="h-[20px] w-[20px] text-grayscale-800" />
            </button>

            <div
                onClick={e => e.stopPropagation()}
                className={`flex flex-col gap-[10px] mx-auto cursor-auto min-w-[300px] ${
                    isMobile ? 'h-full' : 'max-w-[450px]'
                }`}
            >
                <div className="h-full relative overflow-hidden">
                    <div
                        className={`h-full overflow-y-auto scrollbar-hide ${
                            isMobile
                                ? 'pb-[150px] pt-[100px] px-[20px] flex items-center justify-center'
                                : ''
                        }`}
                    >
                        {selectedTab === AddSkillTabEnum.Options && (
                            <>
                                <section className="bg-white rounded-[24px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[450px] mx-auto min-w-[300px] w-full">
                                    <div className="bg-grayscale-50 flex flex-col gap-[10px] items-center p-[20px] border-b-[1px] border-grayscale-200 border-solid">
                                        <div
                                            className={`${
                                                isTier
                                                    ? 'p-[5px] rounded-[10px] bg-grayscale-900 text-grayscale-100'
                                                    : ''
                                            }`}
                                        >
                                            <CompetencyIcon icon={skill?.icon} size="super-big" />
                                        </div>

                                        <h2 className="text-[20px] text-grayscale-900 font-poppins">
                                            {skill?.targetName}
                                        </h2>

                                        <div
                                            className={`px-[10px] py-[2px] flex gap-[3px] items-center rounded-[30px] overflow-hidden ${
                                                isTier ? '' : 'bg-violet-100'
                                            }`}
                                        >
                                            {isTier ? (
                                                <>
                                                    <SkillsFrameworkIcon
                                                        className="w-[20px] h-[20px] text-grayscale-800"
                                                        color="currentColor"
                                                        version="outlined"
                                                    />
                                                    <p className="text-[14px] text-grayscale-900 font-poppins font-[600] uppercase">
                                                        Framework Tier
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <PuzzlePiece
                                                        className="w-[20px] h-[20px] text-grayscale-800"
                                                        version="filled"
                                                    />
                                                    <p className="text-[14px] text-grayscale-900 font-poppins font-[600] uppercase">
                                                        Skill
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-[20px] flex flex-col gap-[20px]">
                                        <SkillProficiencyBar
                                            proficiencyLevel={proficiencyLevel}
                                            onChange={setProficiencyLevel}
                                        />
                                        {description && (
                                            <>
                                                <div className="h-[1px] bg-grayscale-200 w-full" />
                                                <p className="text-grayscale-700 font-poppins text-[16px] tracking-[-0.25px]">
                                                    {(() => {
                                                        const descriptionLength = 240;
                                                        const shouldTruncate =
                                                            description.length > descriptionLength;
                                                        const displayText =
                                                            shouldTruncate && !isExpanded
                                                                ? description.slice(
                                                                      0,
                                                                      descriptionLength
                                                                  ) + '...'
                                                                : description;

                                                        return (
                                                            <>
                                                                {displayText}
                                                                {shouldTruncate && (
                                                                    <>
                                                                        <br />
                                                                        <button
                                                                            onClick={() =>
                                                                                setIsExpanded(
                                                                                    !isExpanded
                                                                                )
                                                                            }
                                                                            className="font-[600]"
                                                                        >
                                                                            {isExpanded
                                                                                ? 'Show less'
                                                                                : 'Show more'}
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </section>
                            </>
                        )}
                        {selectedTab === AddSkillTabEnum.Details && (
                            <div className="flex flex-col gap-[30px] max-w-[450px] mx-auto min-w-[300px] w-full pt-[60px]">
                                <SkillFrameworkInfoBox
                                    frameworkId={frameworkId}
                                    skillId={skill?.id ?? ''}
                                />
                                <RelatedSkills
                                    frameworkId={frameworkId}
                                    skillId={skill?.id ?? ''}
                                    selectedSkills={selectedSkills}
                                    handleAddSkill={handleAddRelatedSkill}
                                    handleEditSkill={handleEditRelatedSkill}
                                    handleRemoveSkill={handleRemoveRelatedSkill}
                                    currentSkillForNav={skill}
                                    previousSkills={previousSkills}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <IonFooter
                    mode="ios"
                    className="w-full flex justify-center items-center bg-opacity-70 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white"
                >
                    <div className="w-full flex items-center justify-center gap-[10px] max-w-[450px]">
                        <button
                            onClick={() =>
                                setSelectedTab(
                                    selectedTab === AddSkillTabEnum.Options
                                        ? AddSkillTabEnum.Details
                                        : AddSkillTabEnum.Options
                                )
                            }
                            className="px-[15px] py-[7px] bg-white rounded-full text-grayscale-900 flex-1 font-poppins text-[17px] border-[1px] border-grayscale-200 border-solid focus:outline-none"
                        >
                            {selectedTab === AddSkillTabEnum.Options ? 'Details' : 'Options'}
                        </button>
                        {!isEdit && (
                            <button
                                onClick={() => {
                                    handleAdd?.(skill, proficiencyLevel);
                                    closeModal();
                                }}
                                className="px-[15px] py-[7px] bg-indigo-600 rounded-full text-white flex-1 font-poppins text-[17px] font-bold tracking-[0.25px] leading-[24px] h-[41.5px]"
                            >
                                Add Skill
                            </button>
                        )}
                        {isEdit && (
                            <button
                                onClick={() => {
                                    handleDelete?.();
                                    closeModal();
                                }}
                                className="px-[15px] py-[7px] bg-grayscale-900 rounded-full text-white flex-1 font-poppins text-[17px] font-bold tracking-[0.25px] leading-[24px] h-[41.5px]"
                            >
                                Delete Skill
                            </button>
                        )}
                    </div>
                </IonFooter>
            </div>
        </div>
    );
};

export default AddSkillModal;
