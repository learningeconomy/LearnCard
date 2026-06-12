import React, { useEffect, useState } from 'react';
import {
    useManageSelfAssignedSkillsBoost,
    useGetSelfAssignedSkillsBoost,
    useGetBoostSkills,
    useToast,
    ToastTypeEnum,
    useVerifiableData,
} from 'learn-card-base';
import { IonSpinner } from '@ionic/react';

import SkillSearchSelector, { SelectedSkill } from 'src/pages/skills/SkillSearchSelector';
import {
    SKILL_PROFILE_PROFESSIONAL_TITLE_KEY,
    SkillProfileProfessionalTitleData,
} from './SkillProfileStep1';
import { useGlobalSkillFrameworks } from '../../../helpers/globalSkillFrameworks.helpers';
import {
    useAnalytics,
    AnalyticsEvents,
    ProfileBuildMethod,
    useProfileSnapshotCapture,
    ACCOUNT_CREATED_AT_KEY,
    SESSION_START_KEY,
} from '@analytics';
import { useSkillProfileStepFunnel, trackSkillProfileCompleted } from './useSkillProfileStepFunnel';
import * as m from '../../../paraglide/messages.js';

type SkillProfileStep5Props = {
    handleNext: () => void;
    handleBack: () => void;
};

import { getLogger } from 'learn-card-base';
const log = getLogger('skill-profile-step5');

const SkillProfileStep5: React.FC<SkillProfileStep5Props> = ({ handleNext, handleBack }) => {
    const { presentToast } = useToast();

    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);

    const { mutateAsync: createOrUpdateSkills } = useManageSelfAssignedSkillsBoost();
    const { track } = useAnalytics();
    const { capture, snapshotRef } = useProfileSnapshotCapture();
    // LC-1784 fix: this file references `globalSkillFrameworks[0]?.frameworkId`
    // below (for the default-framework fallback when an existing skill has no
    // frameworkId on it), but the original LC-1784 PR forgot to import + call
    // the hook. Restoring the call so the fallback resolves to a real
    // frameworkId instead of `undefined.frameworkId` at runtime.
    const globalSkillFrameworks = useGlobalSkillFrameworks();
    const { markStepCompleted } = useSkillProfileStepFunnel(5, () => {
        const fields: string[] = [];
        if (selectedSkills.length > 0) fields.push('selectedSkills');
        return fields;
    });
    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills } = useGetBoostSkills(sasBoostData?.uri);

    const { data: profileData } = useVerifiableData<SkillProfileProfessionalTitleData>(
        SKILL_PROFILE_PROFESSIONAL_TITLE_KEY,
        {
            name: 'Professional Title',
            description: 'Your current professional title',
        }
    );

    const professionalTitle = profileData?.professionalTitle || '';

    useEffect(() => {
        if (sasBoostSkills) {
            setSelectedSkills(
                sasBoostSkills.map(
                    (s: { id: string; frameworkId?: string; proficiencyLevel: number }) => ({
                        id: s.id,
                        frameworkId: s.frameworkId ?? globalSkillFrameworks[0]?.frameworkId ?? '',
                        proficiency: s.proficiencyLevel,
                    })
                )
            );
        }
    }, [sasBoostSkills]);

    const skillsExist = sasBoostSkills?.length > 0;

    const handleFinish = async () => {
        setIsUpdating(true);
        // LC-1853: freeze pre-mutation profile snapshot for accurate totalItemsAfter.
        capture();
        // LC-1853 (review): only fire PROFILE_ITEM_ADDED for skills NEWLY added in
        // this session. Re-saving an unchanged list (or removing skills) shouldn't
        // inflate the analytics — `totalItemsAfter` represents items now in the
        // profile that weren't there before this mutation.
        const existingIds = new Set((sasBoostSkills ?? []).map((s: { id: string }) => s.id));
        const newlyAddedSkills = selectedSkills.filter(s => !existingIds.has(s.id));
        try {
            await createOrUpdateSkills({
                skills: selectedSkills.map(s => ({
                    frameworkId: s.frameworkId,
                    id: s.id,
                    proficiencyLevel: s.proficiency,
                })),
            });

            presentToast(m['toasts.skills.savedSuccess'](), {
                type: ToastTypeEnum.Success,
            });

            // LC-1853 (review): fire profile_item_added per *newly added* skill,
            // using skillsCount (not credentialCount) so totalItemsAfter matches
            // the itemType.
            const now = Date.now();
            const sessionStart = Number(localStorage.getItem(SESSION_START_KEY) ?? now);
            const accountCreatedAt = Number(localStorage.getItem(ACCOUNT_CREATED_AT_KEY) ?? now);
            for (let i = 0; i < newlyAddedSkills.length; i++) {
                track(AnalyticsEvents.PROFILE_ITEM_ADDED, {
                    method: ProfileBuildMethod.SelfArticulation,
                    itemType: 'skill',
                    itemCount: 1,
                    totalItemsAfter: snapshotRef.current.skillsCount + 1 + i,
                    msSinceAccountCreated: now - accountCreatedAt,
                    msSinceSessionStart: now - sessionStart,
                });
            }

            markStepCompleted();
            trackSkillProfileCompleted(track);

            handleNext();
        } catch (error: any) {
            log.error('Error creating or updating skills:', error);
            presentToast(`Error saving skills!${error?.message ? ` ${error?.message}` : ''}`, {
                type: ToastTypeEnum.Error,
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex flex-col gap-[20px] relative">
            {isUpdating && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-30">
                    <IonSpinner color="dark" name="crescent" />
                </div>
            )}

            <div className="flex flex-col gap-[10px]">
                <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                    {skillsExist ? 'Manage your current skills' : 'Choose your current skills'}
                </h3>
            </div>

            <div className="px-[3px] max-h-[450px] overflow-y-auto">
                <SkillSearchSelector
                    selectedSkills={selectedSkills}
                    onSelectedSkillsChange={setSelectedSkills}
                    showSuggestSkill={true}
                    className="pb-[20px]"
                    initialSearchQuery={professionalTitle}
                />
            </div>

            <div className="flex gap-[10px] w-full">
                <button
                    className="bg-grayscale-50 text-grayscale-800 rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 border-[1px] border-solid border-grayscale-200 h-[44px]"
                    onClick={handleBack}
                    disabled={isUpdating}
                >
                    Back
                </button>
                <button
                    className="bg-emerald-500 text-white rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 h-[44px] disabled:bg-grayscale-300"
                    onClick={handleFinish}
                    disabled={isUpdating}
                >
                    Finish
                </button>
            </div>
        </div>
    );
};

export default SkillProfileStep5;
