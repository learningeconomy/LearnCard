import React, { useEffect, useMemo, useState } from 'react';
import {
    useModal,
    ModalTypes,
    useGetSelfAssignedSkillsBoost,
    useManageSelfAssignedSkillsBoost,
    useGetBoostSkills,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { getLogger } from 'learn-card-base';
const log = getLogger('self-assign-skills-modal');

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SkillsCloseConfirmationModal from './SkillsCloseConfirmationModal';
import { IonFooter, IonSpinner } from '@ionic/react';

import SkillSearchSelector from './SkillSearchSelector';
import { SelectedSkill } from './skillTypes';
import * as m from '../../paraglide/messages.js';
import { useAnalytics, AnalyticsEvents } from '@analytics';

type SelfAssignSkillsModalProps = {};

const SelfAssignSkillsModal: React.FC<SelfAssignSkillsModalProps> = ({}) => {
    const { presentToast } = useToast();
    const { closeModal, newModal } = useModal();
    const { track } = useAnalytics();

    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);

    const { mutateAsync: createOrUpdateSkills } = useManageSelfAssignedSkillsBoost();
    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills, isLoading: skillsLoading } = useGetBoostSkills(sasBoostData?.uri);

    useEffect(() => {
        if (sasBoostSkills) {
            setSelectedSkills(
                sasBoostSkills.map(
                    (s: { id: string; frameworkId: string; proficiencyLevel: number }) => ({
                        id: s.id,
                        frameworkId: s.frameworkId,
                        proficiency: s.proficiencyLevel,
                    })
                )
            );
        }
    }, [sasBoostSkills]);

    const hasNoChanges = useMemo(() => {
        const currentKeys = new Set(
            selectedSkills.map(skill => `${skill.frameworkId}::${skill.id}`)
        );
        const originalKeys = new Set(
            sasBoostSkills?.map(
                (skill: { id: string; frameworkId: string }) => `${skill.frameworkId}::${skill.id}`
            ) ?? []
        );
        const sameIds =
            currentKeys.size === originalKeys.size &&
            [...currentKeys].every(key => originalKeys.has(key));
        if (!sameIds) return false;
        return selectedSkills.every(s => {
            const original = sasBoostSkills?.find(
                (o: { id: string; frameworkId: string }) =>
                    o.id === s.id && o.frameworkId === s.frameworkId
            );
            return original && original.proficiencyLevel === s.proficiency;
        });
    }, [selectedSkills, sasBoostSkills]);

    const handleClose = () => {
        if (!hasNoChanges) {
            newModal(
                <SkillsCloseConfirmationModal />,
                { sectionClassName: '!bg-transparent !shadow-none !overflow-visible' },
                {
                    desktop: ModalTypes.Center,
                    mobile: ModalTypes.Center,
                }
            );
        } else {
            closeModal();
        }
    };

    const handleSave = async () => {
        setIsUpdating(true);
        try {
            await createOrUpdateSkills({
                skills: selectedSkills.map(s => ({
                    frameworkId: s.frameworkId,
                    id: s.id,
                    proficiencyLevel: s.proficiency,
                })),
            });

            track(AnalyticsEvents.PROFILE_ITEM_UPDATED, {
                itemType: 'skill',
                surface: 'self_assign_skills_modal',
            });

            presentToast(m['toasts.skills.savedSuccess'](), {
                type: ToastTypeEnum.Success,
            });
        } catch (error: any) {
            log.error('Error creating or updating skills:', error);
            presentToast(`Error saving skills!${error?.message ? ` ${error?.message}` : ''}`, {
                type: ToastTypeEnum.Error,
            });
        } finally {
            setIsUpdating(false);
        }

        closeModal();
    };

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden">
            <div className="px-[20px] py-[20px] bg-white safe-area-top-margin flex flex-col gap-[10px] z-20 relative border-b-[1px] border-grayscale-200 border-solid rounded-b-[30px]">
                <div className="flex items-center gap-[10px] text-grayscale-900">
                    <PuzzlePiece className="w-[40px] h-[40px]" version="filled" />
                    <h5 className="text-[22px] font-poppins font-[600] leading-[24px]">
                        {m['boost.cms.skills.addSkills']()}
                    </h5>
                </div>
            </div>

            {isUpdating && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-30">
                    <IonSpinner color="dark" name="crescent" />
                </div>
            )}

            <section className="h-full pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0 relative">
                <SkillSearchSelector
                    selectedSkills={selectedSkills}
                    onSelectedSkillsChange={setSelectedSkills}
                    showSuggestSkill={true}
                />
            </section>

            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center bg-opacity-80 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white"
            >
                <div className="w-full flex items-center justify-center gap-[10px] max-w-[600px]">
                    <button
                        onClick={handleClose}
                        className="p-[10px] bg-white rounded-full text-grayscale-900 shadow-button-bottom flex-1 font-poppins text-[17px] border-solid border-[1px] border-grayscale-200 leading-[22px]"
                    >
                        {m['common.close']()}
                    </button>

                    <button
                        onClick={handleSave}
                        className="px-[15px] py-[7px] bg-emerald-700 text-white rounded-[30px] text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] shadow-button-bottom h-[44px] flex-1 disabled:bg-grayscale-300"
                        disabled={hasNoChanges || skillsLoading || isUpdating}
                    >
                        {m['common.save']()}
                    </button>
                </div>
            </IonFooter>
        </div>
    );
};

export default SelfAssignSkillsModal;
