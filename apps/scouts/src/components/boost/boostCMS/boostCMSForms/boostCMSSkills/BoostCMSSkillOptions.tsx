import React, { useState } from 'react';

import BoostCMSSkillCategoryTypeSwiper from './BoostCMSSkillCategorySwiper';
import BoostCMSPrimarySkillButton from './BoostCMSPrimarySkillButton';
import BoostCMSSubSkillButton from './BoostCMSSubSkillButton';
import X from 'learn-card-base/svgs/X';

import { BoostCMSSkill, BoostCMSState } from '../../../boost';
import { BoostCMSSKillsCategoryEnum, CATEGORY_TO_SKILLS, SKILLS_TO_SUBSKILLS } from './boostSkills';
import { isPlatformIOS } from 'learn-card-base/helpers/platformHelpers';
import * as m from '../../../../../paraglide/messages.js';
import { useLocale } from '../../../../../i18n';
import { AppContent, AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

const BoostCMSSkillOptions: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    title?: string | React.ReactNode;
    showCloseButton?: boolean;
    handleAddSkill: (skill: { skill: BoostCMSSkill | string; subskills: string[] }) => void;
    handleRemoveSkill: (skill: BoostCMSSkill | string) => void;
    handleAddSubSkill: (skill: BoostCMSSkill | string, subskill: string) => void;
    handleRemoveSubSkill: (skill: BoostCMSSkill | string, subskill: string) => void;
    handleCloseModal: () => void;
    handleSaveSkills: () => void;
    customHeaderClass?: string;
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
    handleSaveSkills,
    customHeaderClass,
}) => {
    const locale = useLocale();

    const [activeCategoryType, setActiveCategoryType] = useState<BoostCMSSKillsCategoryEnum>(
        BoostCMSSKillsCategoryEnum.Durable
    );

    const skills = [...(CATEGORY_TO_SKILLS?.[activeCategoryType] ?? [])].sort((a, b) =>
        a.title.localeCompare(b.title, locale)
    );

    return (
        <AppPage id="user-options-modal">
            <AppHeader
                className={`ion-no-border bg-white pt-5 ${
                    isPlatformIOS() ? customHeaderClass : ''
                }`}
            >
                <AppRow className="w-full bg-white">
                    <AppCol className="w-full flex items-center justify-end px-3">
                        {showCloseButton && (
                            <button onClick={handleCloseModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </AppCol>
                </AppRow>

                <AppToolbar color="#fffff pt-8">
                    <div className="flex items-center justify-between px-4 mt-2 font-notoSans text-2xl">
                        {title}
                        <button
                            onClick={handleSaveSkills}
                            className="rounded-full font-medium ion-no-padding p-0 shadow-3xl text-xl px-4 py-2 font-notoSans bg-white text-grayscale-800"
                        >
                            {m['common.save']()}
                        </button>
                    </div>

                    <BoostCMSSkillCategoryTypeSwiper
                        activeCategoryType={activeCategoryType}
                        setActiveCategoryType={setActiveCategoryType}
                    />
                </AppToolbar>
            </AppHeader>
            <AppContent color="grayscale-100">
                <AppGrid className="ion-padding">
                    <AppRow>
                        {skills.map((skill, index) => {
                            const subSkills = [...(SKILLS_TO_SUBSKILLS?.[skill?.type] ?? [])].sort(
                                (a, b) => a.title.localeCompare(b.title, locale)
                            );

                            const selectedSkills = state?.skills ?? [];
                            const skillSelected = selectedSkills?.find(
                                s => s?.skill === skill?.type
                            );

                            return (
                                <React.Fragment key={index}>
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
                                                            key={subSkill?.type ?? i}
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
                    </AppRow>
                </AppGrid>
                <div className="w-full flex items-center justify-center pb-8">
                    <button
                        onClick={() => handleCloseModal()}
                        className="text-grayscale-900 text-center text-sm"
                    >
                        {m['common.cancel']()}
                    </button>
                </div>
            </AppContent>
        </AppPage>
    );
};

export default BoostCMSSkillOptions;
