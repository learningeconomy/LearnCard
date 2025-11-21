import React from 'react';

import {
    IonRow,
    IonCol,
    useIonModal,
    IonPage,
    IonHeader,
    IonContent,
    IonGrid,
    IonToolbar,
} from '@ionic/react';

import Plus from 'learn-card-base/svgs/Plus';
import X from 'learn-card-base/svgs/X';
import ArrowFatRight from 'learn-card-base/svgs/ArrowFatRight';
import {
    BoostCMSSkill,
    BoostCMSSkillsEnum,
    BoostCMSState,
    SKILLS_TO_SUBSKILLS,
    boostCMSSkills,
} from '../../../boost';
import Checkmark from 'learn-card-base/svgs/Checkmark';

const BoostCMSPrimarySkillButton: React.FC<{
    skill: BoostCMSSkillsEnum | string;
    skillSelected: BoostCMSSkill | undefined;
    handleAddSkill?: (skill: { skill: BoostCMSSkill | string; subskills: string[] }) => void;
    handleRemoveSkill?: (skill: BoostCMSSkill | string) => void;
}> = ({ skillSelected, skill, handleAddSkill, handleRemoveSkill }) => {
    return (
        <div className="flex items-center justify-between w-full bg-[#9b51e026] rounded-full mb-4">
            <div className="flex items-center justify-start w-[70%] px-[6px] py-[10px] overflow-hidden">
                <h3 className="ml-[10px] text-3xl text-black font-mouse">{skill}</h3>
            </div>
            {skillSelected ? (
                <div className="flex items-center justify-center rounded-full bg-emerald-600 mr-4 h-[40px] w-[40px] shadow-3xl">
                    <button
                        onClick={() => {
                            handleRemoveSkill?.(skill);
                        }}
                        className="bg-emerald-600"
                    >
                        <Checkmark className="text-white h-[30px] w-[30px]" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center rounded-full bg-white mr-4 h-[40px] w-[40px] shadow-3xl">
                    <button
                        onClick={() => {
                            handleAddSkill?.({
                                skill: skill,
                                subskills: [],
                            });
                        }}
                        className="bg-white"
                    >
                        <Plus className="text-grayscale-900 h-[30px] w-[30px]" />
                    </button>
                </div>
            )}
        </div>
    );
};

const BoostCMSSubSkillButton: React.FC<{
    skill: BoostCMSSkillsEnum | string;
    subSkill: string;
    subskillSelected: boolean;
    handleAddSubSkill?: (skill: BoostCMSSkill | string, subskill: string) => void;
    handleRemoveSubSkill?: (skill: BoostCMSSkill | string, subskill: string) => void;
}> = ({ subskillSelected, skill, subSkill, handleAddSubSkill, handleRemoveSubSkill }) => {
    return (
        <div className="flex items-center justify-between w-full bg-[#9b51e026] rounded-full mb-4">
            <div className="flex items-center justify-start w-[70%] px-[6px] py-[10px] overflow-hidden">
                <h3 className="ml-[10px] text-3xl text-black font-mouse">{subSkill}</h3>
            </div>
            {subskillSelected ? (
                <div className="flex items-center justify-center rounded-full bg-emerald-600 mr-4 h-[40px] w-[40px] shadow-3xl">
                    <button
                        onClick={() => {
                            handleRemoveSubSkill?.(skill, subSkill);
                        }}
                        className="bg-emerald-600"
                    >
                        <Checkmark className="text-white h-[30px] w-[30px]" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center rounded-full bg-white mr-4 h-[40px] w-[40px] shadow-3xl">
                    <button
                        onClick={() => {
                            handleAddSubSkill?.(skill, subSkill);
                        }}
                        className="bg-white"
                    >
                        <Plus className="text-grayscale-900 h-[30px] w-[30px]" />
                    </button>
                </div>
            )}
        </div>
    );
};

const BoostCMSSkillOptions: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    title?: String | React.ReactNode;
    showCloseButton?: boolean;
    handleAddSkill: (skill: { skill: BoostCMSSkill | string; subskills: string[] }) => void;
    handleRemoveSkill: (skill: BoostCMSSkill | string) => void;
    handleAddSubSkill: (skill: BoostCMSSkill | string, subskill: string) => void;
    handleRemoveSubSkill: (skill: BoostCMSSkill | string, subskill: string) => void;
    handleCloseModal: () => void;
}> = ({
    state,
    setState,
    title,
    showCloseButton,
    handleCloseModal,
    handleAddSkill,
    handleRemoveSkill,
    handleAddSubSkill,
    handleRemoveSubSkill,
}) => {
    return (
        <IonPage id="user-options-modal">
            <IonHeader className="ion-no-border bg-white pt-5">
                <IonRow className="w-full bg-white">
                    <IonCol className="w-full flex items-center justify-end">
                        {showCloseButton && (
                            <button onClick={handleCloseModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </IonCol>
                </IonRow>
                {title && <IonToolbar color="#fffff">{title}</IonToolbar>}
            </IonHeader>
            <IonContent color="grayscale-100">
                <IonGrid className="ion-padding">
                    <IonRow>
                        {boostCMSSkills.map((skill, index) => {
                            const subSkills = SKILLS_TO_SUBSKILLS?.[skill];

                            const selectedSkills = state?.skills ?? [];
                            const skillSelected = selectedSkills?.find(s => s?.skill === skill);

                            return (
                                <>
                                    <BoostCMSPrimarySkillButton
                                        key={skill}
                                        skill={skill}
                                        skillSelected={skillSelected}
                                        handleAddSkill={handleAddSkill}
                                        handleRemoveSkill={handleRemoveSkill}
                                    />
                                    {skillSelected && (
                                        <div className="w-full flex items-center justify-end">
                                            <div className="w-[90%] flex items-center flex-col">
                                                {subSkills.map((subSkill, i) => {
                                                    const subskillSelected =
                                                        skillSelected?.subskills?.includes(
                                                            subSkill
                                                        );

                                                    return (
                                                        <BoostCMSSubSkillButton
                                                            key={subSkill}
                                                            handleRemoveSubSkill={
                                                                handleRemoveSubSkill
                                                            }
                                                            handleAddSubSkill={handleAddSubSkill}
                                                            skill={skill}
                                                            subSkill={subSkill}
                                                            subskillSelected={subskillSelected}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })}
                    </IonRow>
                </IonGrid>
                <div className="w-full flex items-center justify-center pb-8">
                    <button
                        onClick={() => handleCloseModal()}
                        className="text-grayscale-900 text-center text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </IonContent>
        </IonPage>
    );
};

export const BoostCMSSkillsForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
}> = ({ state, setState }) => {
    const handleAddSkill = (skill: { skill: BoostCMSSkill | string; subskills: string[] }) => {
        setState(prevState => {
            return {
                ...prevState,
                skills: [...prevState.skills, skill],
            };
        });
    };

    const handleRemoveSkill = (skill: BoostCMSSkill | string) => {
        setState(prevState => {
            return {
                ...prevState,
                skills: prevState.skills.filter(s => s.skill !== skill),
            };
        });
    };

    const handleAddSubSkill = (skill: BoostCMSSkill | string, subskill: string) => {
        setState(prevState => {
            return {
                ...prevState,
                skills: prevState.skills.map(s => {
                    if (skill === s.skill) {
                        return {
                            ...s,
                            subskills: [...s.subskills, subskill],
                        };
                    }

                    return s;
                }),
            };
        });
    };

    const handleRemoveSubSkill = (skill: BoostCMSSkill | string, subskill: string) => {
        console.log('clicking me here!!');

        setState(prevState => {
            return {
                ...prevState,
                skills: prevState.skills.map(s => {
                    if (skill === s.skill) {
                        return {
                            ...s,
                            subskills: s.subskills.filter(s => s !== subskill),
                        };
                    }

                    return s;
                }),
            };
        });
    };

    const [presentCenterModal, dismissCenterModal] = useIonModal(BoostCMSSkillOptions, {
        state: state,
        setState: setState,
        title: (
            <p className="font-mouse flex items-center justify-center text-3xl w-full h-full text-grayscale-900">
                Select Skills
            </p>
        ),
        showCloseButton: true,
        handleAddSkill: (skill: { skill: BoostCMSSkill | string; subskills: string[] }) =>
            handleAddSkill(skill),
        handleRemoveSkill: (skill: BoostCMSSkill | string) => handleRemoveSkill(skill),
        handleAddSubSkill: (skill: BoostCMSSkill | string, subskill: string) =>
            handleAddSubSkill(skill, subskill),
        handleRemoveSubSkill: (skill: BoostCMSSkill | string, subskill: string) =>
            handleRemoveSubSkill(skill, subskill),
        handleCloseModal: () => dismissCenterModal(),
    });

    const [presentSheetModal, dismissSheetModal] = useIonModal(BoostCMSSkillOptions, {
        state: state,
        setState: setState,
        title: (
            <p className="font-mouse flex items-center justify-center text-3xl w-full h-full text-grayscale-900">
                Select Skills
            </p>
        ),
        showCloseButton: false,
        handleAddSkill: (skill: { skill: BoostCMSSkill | string; subskills: string[] }) =>
            handleAddSkill(skill),
        handleRemoveSkill: (skill: BoostCMSSkill | string) => handleRemoveSkill(skill),
        handleAddSubSkill: (skill: BoostCMSSkill | string, subskill: string) =>
            handleAddSubSkill(skill, subskill),
        handleRemoveSubSkill: (skill: BoostCMSSkill | string, subskill: string) =>
            handleRemoveSubSkill(skill, subskill),
        handleCloseModal: () => dismissSheetModal(),
        customHeaderClass: '!pt-10',
    });

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
            <IonCol
                size="12"
                className="w-full flex-col items-center justify-center bg-white rounded-[20px]"
            >
                <div className="flex items-center justify-between w-full ion-padding">
                    <h1 className="font-mouse text-black text-3xl p-0 m-0">Skills</h1>

                    <button
                        onClick={() =>
                            presentCenterModal({
                                cssClass: 'center-modal user-options-modal',
                                backdropDismiss: false,
                                showBackdrop: false,
                            })
                        }
                        className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl modal-btn-desktop"
                    >
                        <Plus className="w-8 h-auto" />
                    </button>

                    <button
                        onClick={() => {
                            presentSheetModal({
                                cssClass: 'mobile-modal user-options-modal',
                                initialBreakpoint: 1,
                                breakpoints: [0, 1],
                                handleBehavior: 'cycle',
                            });
                        }}
                        className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl modal-btn-mobile"
                    >
                        <Plus className="w-8 h-auto" />
                    </button>
                </div>

                <div className="ion-padding pt-0 pb-4 flex items-center justify-center flex-col w-full">
                    {state?.skills?.map(skill => {
                        return (
                            <>
                                <div className="flex items-center justify-between w-full bg-[#9b51e026] rounded-full mb-4">
                                    <div className="flex items-center justify-start w-[70%] px-[6px] py-[12px] overflow-hidden">
                                        <h3 className="ml-[10px] text-3xl text-black font-mouse">
                                            {skill?.skill}
                                        </h3>
                                    </div>

                                    <div className="flex items-center justify-center rounded-full bg-white mr-4 h-[40px] w-[40px] shadow-3xl">
                                        <button
                                            onClick={() => {
                                                handleRemoveSkill(skill?.skill);
                                            }}
                                            className="bg-white"
                                        >
                                            <X className="text-grayscale-900 h-[30px] w-[30px]" />
                                        </button>
                                    </div>
                                </div>
                                {skill?.subskills?.length > 0 &&
                                    skill.subskills.map(subskill => {
                                        return (
                                            <div
                                                key={subskill}
                                                className="flex items-center justify-between w-full bg-[#9b51e026] rounded-full mb-4"
                                            >
                                                <div className="flex flex-col items-center justify-start w-[70%] px-[6px] py-[10px] pl-[10px] overflow-hidden">
                                                    <h3 className="pl-3 text-2xl text-left text-black font-mouse w-full">
                                                        {skill?.skill}
                                                    </h3>
                                                    <p className="flex items-center justify-start w-full pl-3 font-semibold font-mouse tracking-wider text-xl text-black">
                                                        <button className="flex items-center justify-center text-grayscale-800 rounded-full bg-white shadow-3xl w-[24px] h-[24px] mr-2">
                                                            <ArrowFatRight className="w-[18px] h-[18px]" />
                                                        </button>{' '}
                                                        {subskill}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-center rounded-full bg-white mr-4 h-[40px] w-[40px] shadow-3xl">
                                                    <button
                                                        onClick={() => {
                                                            handleRemoveSubSkill(
                                                                skill?.skill,
                                                                subskill
                                                            );
                                                        }}
                                                        className="bg-white"
                                                    >
                                                        <X className="text-grayscale-900 h-[30px] w-[30px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </>
                        );
                    })}
                </div>
            </IonCol>
        </IonRow>
    );
};

export default BoostCMSSkillsForm;
