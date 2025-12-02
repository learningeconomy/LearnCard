import React, { useEffect, useState } from 'react';

import { IonRow, IonCol, useIonModal } from '@ionic/react';

import Plus from 'learn-card-base/svgs/Plus';
import PuzzlePiece from '../../../../svgs/PuzzlePiece';
import BoostCMSSkillOptions from './BoostCMSSkillOptions';
import BoostCMSSelectedSkills from './BoostCMSSelectedSkills';

import {
    BoostCMSSkill,
    BoostCMSSkillsEnum,
    BoostCMSState,
    BoostCMSAlignment,
} from '../../../boost';
import { toSkillAlignment, toSubskillAlignment } from '../../../alignmentHelpers';
import {
    BoostCMSSKillsCategoryEnum,
    BoostCMSSubSkillEnum,
    boostCMSSKillCategories,
    CATEGORY_TO_SKILLS,
    SKILLS_TO_SUBSKILLS,
} from './boostSkills';

export enum BoostCMSSkillsAttachmentFormModeEnum {
    view = 'view',
    edit = 'edit',
}

export const BoostCMSSkillsAttachmentForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
}> = ({ state, setState }) => {
    // local component state
    const [_state, _setState] = useState<BoostCMSState | null>(state);

    useEffect(() => {
        _setState(state);
    }, [state]);

    // Alignment conversions are centralized in alignmentHelpers

    const handleAddSkill = (
        skill: {
            category: BoostCMSSKillsCategoryEnum | string;
            skill: BoostCMSSkillsEnum;
            subskills: BoostCMSSubSkillEnum[];
        },
        mode: BoostCMSSkillsAttachmentFormModeEnum = BoostCMSSkillsAttachmentFormModeEnum.view
    ) => {
        if (mode === BoostCMSSkillsAttachmentFormModeEnum.view) {
            setState(prevState => {
                const nextAlignments = [
                    ...(prevState.alignments ?? []),
                    toSkillAlignment(skill as BoostCMSSkill),
                    ...skill.subskills.map(ss => toSubskillAlignment(skill.skill, ss)),
                ];
                return {
                    ...prevState,
                    skills: [...prevState.skills, skill],
                    alignments: nextAlignments,
                };
            });
        } else {
            _setState(prevState => {
                if (!prevState) return prevState;
                const nextAlignments = [
                    ...(prevState.alignments ?? []),
                    toSkillAlignment(skill as BoostCMSSkill),
                    ...skill.subskills.map(ss => toSubskillAlignment(skill.skill, ss)),
                ];
                return {
                    ...prevState,
                    skills: [...prevState.skills, skill],
                    alignments: nextAlignments,
                };
            });
        }
    };

    const handleRemoveSkill = (
        skill: BoostCMSSkill | string,
        mode: BoostCMSSkillsAttachmentFormModeEnum = BoostCMSSkillsAttachmentFormModeEnum.view
    ) => {
        if (mode === BoostCMSSkillsAttachmentFormModeEnum.view) {
            setState(prevState => {
                const removedSkill = prevState.skills.find(s => s.skill === skill);
                const filteredAlignments = (prevState.alignments ?? []).filter(a => {
                    if (!removedSkill) return true;
                    // remove the primary skill alignment and any subskill alignments under it
                    const isPrimary =
                        a.targetName === removedSkill.skill &&
                        a.targetFramework === String(removedSkill.category);
                    const isSub = a.targetFramework === removedSkill.skill;
                    return !isPrimary && !isSub;
                });
                return {
                    ...prevState,
                    skills: prevState.skills.filter(s => s.skill !== skill),
                    alignments: filteredAlignments,
                };
            });
        } else {
            _setState(prevState => {
                if (!prevState) return prevState;
                const removedSkill = prevState.skills.find(s => s.skill === skill);
                const filteredAlignments = (prevState.alignments ?? []).filter(a => {
                    if (!removedSkill) return true;
                    const isPrimary =
                        a.targetName === removedSkill.skill &&
                        a.targetFramework === String(removedSkill.category);
                    const isSub = a.targetFramework === removedSkill.skill;
                    return !isPrimary && !isSub;
                });
                return {
                    ...prevState,
                    skills: prevState.skills.filter(s => s.skill !== skill),
                    alignments: filteredAlignments,
                };
            });
        }
    };

    const handleAddSubSkill = (
        skill: BoostCMSSkill | string,
        subskill: BoostCMSSubSkillEnum,
        mode: BoostCMSSkillsAttachmentFormModeEnum = BoostCMSSkillsAttachmentFormModeEnum.view
    ) => {
        if (mode === BoostCMSSkillsAttachmentFormModeEnum.view) {
            setState(prevState => {
                const updatedSkills = prevState.skills.map(s => {
                    if (skill === s.skill) {
                        return {
                            ...s,
                            subskills: [...s.subskills, subskill],
                        };
                    }
                    return s;
                });
                const newAlignment = toSubskillAlignment(String(skill), subskill);
                return {
                    ...prevState,
                    skills: updatedSkills,
                    alignments: [...(prevState.alignments ?? []), newAlignment],
                };
            });
        } else {
            _setState(prevState => {
                if (!prevState) return prevState;
                const updatedSkills = prevState.skills.map(s => {
                    if (skill === s.skill) {
                        return {
                            ...s,
                            subskills: [...s.subskills, subskill],
                        };
                    }
                    return s;
                });
                const newAlignment = toSubskillAlignment(String(skill), subskill);
                return {
                    ...prevState,
                    skills: updatedSkills,
                    alignments: [...(prevState.alignments ?? []), newAlignment],
                };
            });
        }
    };

    const handleRemoveSubSkill = (
        skill: BoostCMSSkill | string,
        subskill: BoostCMSSubSkillEnum,
        mode: BoostCMSSkillsAttachmentFormModeEnum = BoostCMSSkillsAttachmentFormModeEnum.view
    ) => {
        if (mode === BoostCMSSkillsAttachmentFormModeEnum.view) {
            setState(prevState => {
                const updatedSkills = prevState.skills.map(s => {
                    if (skill === s.skill) {
                        return {
                            ...s,
                            subskills: s.subskills.filter(ss => ss !== subskill),
                        };
                    }
                    return s;
                });
                const filteredAlignments = (prevState.alignments ?? []).filter(
                    a => !(a.targetName === String(subskill) && a.targetFramework === String(skill))
                );
                return {
                    ...prevState,
                    skills: updatedSkills,
                    alignments: filteredAlignments,
                };
            });
        } else {
            _setState(prevState => {
                if (!prevState) return prevState;
                const updatedSkills = prevState.skills.map(s => {
                    if (skill === s.skill) {
                        return {
                            ...s,
                            subskills: s.subskills.filter(ss => ss !== subskill),
                        };
                    }
                    return s;
                });
                const filteredAlignments = (prevState.alignments ?? []).filter(
                    a => !(a.targetName === String(subskill) && a.targetFramework === String(skill))
                );
                return {
                    ...prevState,
                    skills: updatedSkills,
                    alignments: filteredAlignments,
                };
            });
        }
    };

    const handleSaveSkills = () => {
        setState(prevState => {
            return {
                ...prevState,
                skills: [..._state?.skills],
                alignments: [...(_state?.alignments ?? [])],
            };
        });
    };

    const [presentCenterModal, dismissCenterModal] = useIonModal(BoostCMSSkillOptions, {
        state: _state,
        setState: _setState,
        title: <p className="text-left text-2xl font-notoSans text-grayscale-900">Add Skills</p>,
        showCloseButton: true,
        handleAddSkill: (
            skill: {
                category: BoostCMSSKillsCategoryEnum | string;
                skill: BoostCMSSkillsEnum;
                subskills: BoostCMSSubSkillEnum[];
            },
            mode: BoostCMSSkillsAttachmentFormModeEnum
        ) => handleAddSkill(skill, BoostCMSSkillsAttachmentFormModeEnum.edit),
        handleRemoveSkill: (
            skill: BoostCMSSkill | string,
            mode: BoostCMSSkillsAttachmentFormModeEnum
        ) => handleRemoveSkill(skill, BoostCMSSkillsAttachmentFormModeEnum.edit),
        handleAddSubSkill: (
            skill: BoostCMSSkill | string,
            subskill: BoostCMSSubSkillEnum,
            mode: BoostCMSSkillsAttachmentFormModeEnum
        ) => handleAddSubSkill(skill, subskill, BoostCMSSkillsAttachmentFormModeEnum.edit),
        handleRemoveSubSkill: (
            skill: BoostCMSSkill | string,
            subskill: BoostCMSSubSkillEnum,
            mode: BoostCMSSkillsAttachmentFormModeEnum
        ) => handleRemoveSubSkill(skill, subskill, BoostCMSSkillsAttachmentFormModeEnum.edit),
        handleCloseModal: () => dismissCenterModal(),
        handleSaveSkills: () => {
            handleSaveSkills();
            _setState(null);
            dismissCenterModal();
        },
    });

    const [presentSheetModal, dismissSheetModal] = useIonModal(BoostCMSSkillOptions, {
        state: _state,
        setState: _setState,
        title: <p className="text-left text-2xl font-notoSans text-grayscale-900">Add Skills</p>,
        showCloseButton: false,
        handleAddSkill: (
            skill: {
                category: BoostCMSSKillsCategoryEnum | string;
                skill: BoostCMSSkillsEnum;
                subskills: BoostCMSSubSkillEnum[];
            },
            mode: BoostCMSSkillsAttachmentFormModeEnum
        ) => handleAddSkill(skill, BoostCMSSkillsAttachmentFormModeEnum.edit),
        handleRemoveSkill: (
            skill: BoostCMSSkill | string,
            mode: BoostCMSSkillsAttachmentFormModeEnum
        ) => handleRemoveSkill(skill, BoostCMSSkillsAttachmentFormModeEnum.edit),
        handleAddSubSkill: (
            skill: BoostCMSSkill | string,
            subskill: BoostCMSSubSkillEnum,
            mode: BoostCMSSkillsAttachmentFormModeEnum
        ) => handleAddSubSkill(skill, subskill, BoostCMSSkillsAttachmentFormModeEnum.edit),
        handleRemoveSubSkill: (
            skill: BoostCMSSkill | string,
            subskill: BoostCMSSubSkillEnum,
            mode: BoostCMSSkillsAttachmentFormModeEnum
        ) => handleRemoveSubSkill(skill, subskill, BoostCMSSkillsAttachmentFormModeEnum.edit),
        handleCloseModal: () => dismissSheetModal(),
        handleSaveSkills: () => {
            handleSaveSkills();
            _setState(null);
            dismissSheetModal();
        },
    });

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
            <IonCol
                size="12"
                className="w-full flex-col items-center justify-center bg-white rounded-[20px]"
            >
                <button
                    className="flex items-center justify-between w-full ion-padding"
                    onClick={() => {
                        const isMobile = window.innerWidth < 992;
                        if (isMobile) {
                            presentSheetModal();
                        } else {
                            presentCenterModal({
                                cssClass: 'center-modal user-options-modal',
                                backdropDismiss: false,
                                showBackdrop: false,
                                onWillDismiss: () => {
                                    _setState(state);
                                },
                            });
                        }
                    }}
                >
                    <h1 className="text-black text-xl p-0 m-0 flex items-center justify-center font-notoSans">
                        <PuzzlePiece className="h-[30px] w-[30px] mr-1 text-sp-purple-base" /> Skill
                        Attachments
                    </h1>

                    <div className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl modal-btn-desktop">
                        <Plus className="w-8 h-auto" />
                    </div>

                    <div className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl modal-btn-mobile">
                        <Plus className="w-8 h-auto" />
                    </div>
                </button>

                {state?.skills?.length > 0 && (
                    <div className="ion-padding pt-0 pb-4 flex items-center justify-center flex-col w-full">
                        {state?.skills?.map((_skill, index) => {
                            const category = boostCMSSKillCategories?.find(
                                c => c?.type === _skill?.category
                            );
                            const skill = CATEGORY_TO_SKILLS?.[_skill?.category]?.find(
                                s => s.type === _skill.skill
                            );
                            const subSkills = SKILLS_TO_SUBSKILLS?.[_skill?.skill];

                            const selectedSkills = state?.skills ?? [];
                            const skillSelected = selectedSkills?.find(
                                s => s?.skill === skill?.type
                            );

                            return (
                                <BoostCMSSelectedSkills
                                    key={index}
                                    state={state}
                                    setState={setState}
                                    category={category}
                                    skill={skill}
                                    subSkills={subSkills}
                                    selectedSkills={selectedSkills}
                                    skillSelected={skillSelected}
                                    handleAddSkill={handleAddSkill}
                                    handleRemoveSkill={handleRemoveSkill}
                                    handleAddSubSkill={handleAddSkill}
                                    handleRemoveSubSkill={handleRemoveSubSkill}
                                />
                            );
                        })}
                    </div>
                )}
            </IonCol>
        </IonRow>
    );
};

export default BoostCMSSkillsAttachmentForm;
