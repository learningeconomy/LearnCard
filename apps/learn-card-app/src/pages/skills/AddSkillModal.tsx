import React, { useState } from 'react';
import { useModal, useDeviceTypeByWidth } from 'learn-card-base';

import RelatedSkills from './RelatedSkills';
import SkillFrameworkInfoBox from './SkillFrameworkInfoBox';

import X from '../../components/svgs/X';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import TrashBin from '../../components/svgs/TrashBin';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import SkillProficiencyBar from './SkillProficiencyBar';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';

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
    const hasProficiencyChanged = proficiencyLevel !== initialProficiencyLevel;

    const handleCloseWithEditProficiency = () => {
        closeModal();
    };

    const handleUpdate = () => {
        if (isEdit && handleEditProficiency && hasProficiencyChanged) {
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
    const headerContent = (
        <>
            {previousSkill ? (
                <button
                    className="bg-white rounded-full py-[10px] pl-[10px] pr-[20px] shadow-bottom-4-4 flex items-center gap-[10px] max-w-[300px] h-[44px]"
                    onClick={e => {
                        e.stopPropagation();
                        handleGoBack();
                    }}
                >
                    <SlimCaretLeft className="h-[20px] w-[20px] text-grayscale-700 flex-shrink-0" />
                    <div className="flex items-center gap-[5px] overflow-hidden">
                        <CompetencyIcon icon={previousSkill.skill.icon} size="small" />
                        <span className="text-[14px] text-grayscale-800 font-bold font-poppins truncate">
                            {/* @ts-ignore */}
                            {previousSkill.skill.targetName || previousSkill.skill.statement}
                        </span>
                    </div>
                </button>
            ) : (
                <div />
            )}

            <button
                className="bg-white rounded-full p-[12px] shadow-bottom-4-4"
                onClick={e => {
                    e.stopPropagation();
                    handleCloseWithEditProficiency();
                }}
            >
                <X className="h-[20px] w-[20px] text-grayscale-800" />
            </button>
        </>
    );

    return (
        <div
            role="button"
            onClick={e => {
                e.stopPropagation();
                handleCloseWithEditProficiency();
            }}
            className="h-full w-full flex flex-col bg-grayscale-200 backdrop-blur-[22.5px] bg-opacity-70"
        >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 flex justify-between items-center bg-white bg-opacity-70 backdrop-blur-[5px] p-[20px] border-b border-grayscale-200 md:hidden">
                {headerContent}
            </div>

            {/* Scrollable Content */}
            <div
                onClick={e => e.stopPropagation()}
                className="flex-1 overflow-y-auto scrollbar-hide px-[20px] flex flex-col"
            >
                <div className="hidden md:sticky md:top-0 md:z-10 md:-mx-[20px] md:flex md:justify-between md:items-start md:px-[20px] md:pt-[20px] md:pointer-events-none">
                    <div className="pointer-events-auto">
                        {previousSkill ? (
                            <button
                                className="bg-white rounded-full py-[10px] pl-[10px] pr-[20px] shadow-bottom-4-4 flex items-center gap-[10px] max-w-[300px] h-[44px]"
                                onClick={e => {
                                    e.stopPropagation();
                                    handleGoBack();
                                }}
                            >
                                <SlimCaretLeft className="h-[20px] w-[20px] text-grayscale-700 flex-shrink-0" />
                                <div className="flex items-center gap-[5px] overflow-hidden">
                                    <CompetencyIcon icon={previousSkill.skill.icon} size="small" />
                                    <span className="text-[14px] text-grayscale-800 font-bold font-poppins truncate">
                                        {/* @ts-ignore */}
                                        {previousSkill.skill.targetName ||
                                            previousSkill.skill.statement}
                                    </span>
                                </div>
                            </button>
                        ) : (
                            <div />
                        )}
                    </div>

                    <div className="pointer-events-auto">
                        <button
                            className="bg-white rounded-full p-[12px] shadow-bottom-4-4"
                            onClick={e => {
                                e.stopPropagation();
                                handleCloseWithEditProficiency();
                            }}
                        >
                            <X className="h-[20px] w-[20px] text-grayscale-800" />
                        </button>
                    </div>
                </div>

                <div
                    className={`mx-auto cursor-auto w-full max-w-[450px] pb-[100px] flex-1 flex flex-col justify-center md:pt-[84px]`}
                >
                    {selectedTab === AddSkillTabEnum.Options && (
                        <>
                            <div className="bg-white rounded-[24px] overflow-hidden flex flex-col shadow-box-bottom w-full">
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
                            </div>
                        </>
                    )}
                    {selectedTab === AddSkillTabEnum.Details && (
                        <div className="flex flex-col gap-[30px] w-full pt-[30px]">
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
                                parentIsEdit={isEdit}
                                parentProficiencyLevel={proficiencyLevel}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 w-full flex justify-center items-center bg-white bg-opacity-70 backdrop-blur-[5px] p-[20px] border-t border-grayscale-200">
                <div
                    onClick={e => e.stopPropagation()}
                    className="w-full flex items-center justify-center gap-[10px] max-w-[450px]"
                >
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
                        <>
                            <button
                                onClick={handleUpdate}
                                disabled={!hasProficiencyChanged}
                                className="px-[15px] py-[7px] rounded-full text-white flex-1 font-poppins text-[17px] font-bold tracking-[0.25px] leading-[24px] h-[41.5px] bg-indigo-600 disabled:bg-grayscale-300 "
                            >
                                Update
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete?.();
                                    closeModal();
                                }}
                                className="h-[41.5px] w-[41.5px] min-w-[41.5px] rounded-full bg-red-600 text-white flex items-center justify-center"
                            >
                                <TrashBin
                                    className="w-[20px] h-[20px]"
                                    version="2"
                                    strokeWidth="2"
                                />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddSkillModal;
