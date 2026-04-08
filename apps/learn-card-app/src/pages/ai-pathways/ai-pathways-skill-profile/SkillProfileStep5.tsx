import React, { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    useGetSelfAssignedSkillsBoost,
    useManageSelfAssignedSkillsBoost,
    useGetBoostSkills,
    useToast,
    ToastTypeEnum,
    useVerifiableData,
} from 'learn-card-base';
import { IonSpinner } from '@ionic/react';

import SkillSearchSelector, { SelectedSkill } from 'src/pages/skills/SkillSearchSelector';
import { SKILL_PROFILE_PROFILE_KEY, SkillProfileProfileData } from './SkillProfileStep1';

type SkillProfileStep5Props = {
    handleNext: () => void;
    handleBack: () => void;
};

const SkillProfileStep5: React.FC<SkillProfileStep5Props> = ({ handleNext, handleBack }) => {
    const flags = useFlags();
    const { presentToast } = useToast();

    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);

    const frameworkId = flags?.selfAssignedSkillsFrameworkId;

    const { mutateAsync: createOrUpdateSkills } = useManageSelfAssignedSkillsBoost();
    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills } = useGetBoostSkills(sasBoostData?.uri);

    const { data: profileData } = useVerifiableData<SkillProfileProfileData>(
        SKILL_PROFILE_PROFILE_KEY,
        {
            name: 'Professional Profile',
            description: 'Professional title and experience level',
        }
    );

    const professionalTitle = profileData?.professionalTitle || '';

    useEffect(() => {
        if (sasBoostSkills) {
            setSelectedSkills(
                sasBoostSkills.map((s: { id: string; proficiencyLevel: number }) => ({
                    id: s.id,
                    proficiency: s.proficiencyLevel,
                }))
            );
        }
    }, [sasBoostSkills]);

    const skillsExist = sasBoostSkills?.length > 0;

    const handleFinish = async () => {
        setIsUpdating(true);
        try {
            await createOrUpdateSkills({
                skills: selectedSkills.map(s => ({
                    frameworkId: frameworkId,
                    id: s.id,
                    proficiencyLevel: s.proficiency,
                })),
            });

            presentToast('Skills saved successfully!', {
                type: ToastTypeEnum.Success,
            });

            handleNext();
        } catch (error: any) {
            console.error('Error creating or updating skills:', error);
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
