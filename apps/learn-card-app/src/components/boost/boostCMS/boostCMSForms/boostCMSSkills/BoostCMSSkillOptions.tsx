import React, { useState } from 'react';

import { IonRow, IonCol, IonHeader, IonPage, IonContent, IonGrid, IonToolbar } from '@ionic/react';

import BoostCMSSkillCategoryTypeSwiper from './BoostCMSSkillCategorySwiper';
import BoostCMSPrimarySkillButton from './BoostCMSPrimarySkillButton';
import BoostCMSSubSkillButton from './BoostCMSSubSkillButton';
import X from 'learn-card-base/svgs/X';

import { BoostCMSSkill, BoostCMSState } from '../../../boost';
import { BoostCMSSKillsCategoryEnum, CATEGORY_TO_SKILLS, SKILLS_TO_SUBSKILLS } from './boostSkills';
import { isPlatformIOS, useDeviceTypeByWidth, useModal } from 'learn-card-base';

type BoostCMSSkillOptionsProps = {
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    title?: String | React.ReactNode;
    showCloseButton?: boolean;
    handleAddSkill: (skill: { skill: BoostCMSSkill | string; subskills: string[] }) => void;
    handleRemoveSkill: (skill: BoostCMSSkill | string) => void;
    handleAddSubSkill: (skill: BoostCMSSkill | string, subskill: string) => void;
    handleRemoveSubSkill: (skill: BoostCMSSkill | string, subskill: string) => void;
    handleCloseModal: () => void;
    handleSaveSkills: () => void;
    customHeaderClass?: string;
};

const BoostCMSSkillOptions: React.FC<BoostCMSSkillOptionsProps> = ({
    state,
    setState,
    title,
    showCloseButton,
    handleAddSkill,
    handleRemoveSkill,
    handleAddSubSkill,
    handleRemoveSubSkill,
    handleCloseModal,
    handleSaveSkills,
    customHeaderClass,
}) => {
    const { closeModal } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();

    const [activeCategoryType, setActiveCategoryType] = useState<BoostCMSSKillsCategoryEnum>(
        BoostCMSSKillsCategoryEnum.Durable
    );

    const skills = CATEGORY_TO_SKILLS?.[activeCategoryType]?.sort((a, b) => {
        let titleA = a.title.toLowerCase();
        let titleB = b.title.toLowerCase();
        if (titleA < titleB) return -1;
        if (titleA > titleB) return 1;
        return 0;
    });

    return (
        <IonPage id="user-options-modal">
            {/* <section
                <IonPage id="user-options-modal">
            id="user-options-modal"
            className={`overflow-y-hidden flex flex-col ${isDesktop ? 'h-[500px]' : 'h-full'}`}
        > */}
            <IonHeader
                className={`ion-no-border bg-white pt-5 ${isPlatformIOS() ? customHeaderClass : ''
                    }`}
            >
                <IonRow className="w-full bg-white">
                    <IonCol className="w-full flex items-center justify-end px-3">
                        {showCloseButton && (
                            <button onClick={handleCloseModal}>
                                {/* <button onClick={closeModal}> */}
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </IonCol>
                </IonRow>

                <IonToolbar color="#fffff pt-8">
                    <div className="flex items-center justify-between px-4 mt-2">
                        {title}
                        <button
                            onClick={handleSaveSkills}
                            className="rounded-full ion-no-padding p-0 shadow-3xl font-poppins text-xl  text-grayscale-800 w-[86px] h-[44px] bg-white"
                        >
                            Save
                        </button>
                    </div>

                    <BoostCMSSkillCategoryTypeSwiper
                        activeCategoryType={activeCategoryType}
                        setActiveCategoryType={setActiveCategoryType}
                    />
                </IonToolbar>
            </IonHeader>
            <IonContent color="grayscale-100">
                {/* <div className="h-full overflow-y-auto bg-grayscale-100"> */}
                <IonGrid className="ion-padding">
                    <IonRow>
                        {skills.map((skill, index) => {
                            const subSkills = SKILLS_TO_SUBSKILLS?.[skill?.type]?.sort((a, b) => {
                                let titleA = a.title.toLowerCase();
                                let titleB = b.title.toLowerCase();
                                if (titleA < titleB) return -1;
                                if (titleA > titleB) return 1;
                                return 0;
                            });

                            const selectedSkills = state?.skills ?? [];
                            const skillSelected = selectedSkills?.find(
                                s => s?.skill === skill?.type
                            );

                            return (
                                <React.Fragment key={skill.type || index}>
                                    <BoostCMSPrimarySkillButton
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
                                                            subSkill?.type
                                                        );

                                                    return (
                                                        <BoostCMSSubSkillButton
                                                            key={subSkill.type || i}
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
                                </React.Fragment>
                            );
                        })}
                    </IonRow>
                </IonGrid>
                <div className="w-full flex items-center justify-center pb-8">
                    <button
                        // onClick={() => closeModal()}
                        onClick={() => handleCloseModal()}
                        className="text-grayscale-900 text-center text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </IonContent>
        </IonPage>
        // </div>
        // </section>
    );
};

export default BoostCMSSkillOptions;
