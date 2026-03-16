import React, { useEffect, useMemo, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    useModal,
    ModalTypes,
    useGetSelfAssignedSkillsBoost,
    useManageSelfAssignedSkillsBoost,
    useGetBoostSkills,
    useToast,
    ToastTypeEnum,
    conditionalPluralize,
    useGetSkillFrameworkById,
} from 'learn-card-base';

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import SkillsCloseConfirmationModal from './SkillsCloseConfirmationModal';
import { IonFooter, IonSpinner } from '@ionic/react';
import { GenericErrorView } from 'learn-card-base/components/generic/GenericErrorBoundary';

import SkillSearchSelector, { SelectedSkill } from './SkillSearchSelector';

enum Step {
    Add,
    Review,
}

type SelfAssignSkillsModalProps = {};

const SelfAssignSkillsModal: React.FC<SelfAssignSkillsModalProps> = ({}) => {
    const flags = useFlags();
    const { presentToast } = useToast();
    const { closeModal, newModal } = useModal();

    const [isUpdating, setIsUpdating] = useState(false);
    const [step, setStep] = useState<Step>(Step.Add);
    const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);

    const frameworkId = flags?.selfAssignedSkillsFrameworkId;
    const { data: selfAssignedSkillFramework, isLoading: selfAssignedSkillFrameworkLoading } =
        useGetSkillFrameworkById(frameworkId);

    const { mutateAsync: createOrUpdateSkills } = useManageSelfAssignedSkillsBoost();
    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills, isLoading: skillsLoading } = useGetBoostSkills(sasBoostData?.uri);

    useEffect(() => {
        if (sasBoostSkills) {
            setSelectedSkills(
                sasBoostSkills.map(s => ({ id: s.id, proficiency: s.proficiencyLevel }))
            );
        }
    }, [sasBoostSkills]);

    const hasNoChanges = useMemo(() => {
        const currentIds = new Set(selectedSkills.map(s => s.id));
        const originalIds = new Set(sasBoostSkills?.map((s: { id: string }) => s.id) ?? []);
        const sameIds =
            currentIds.size === originalIds.size &&
            [...currentIds].every(id => originalIds.has(id));
        if (!sameIds) return false;
        return selectedSkills.every(s => {
            const original = sasBoostSkills?.find((o: { id: string }) => o.id === s.id);
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
                    frameworkId: frameworkId,
                    id: s.id,
                    proficiencyLevel: s.proficiency,
                })),
            });

            presentToast('Skills saved successfully!', {
                type: ToastTypeEnum.Success,
            });
        } catch (error: any) {
            console.error('Error creating or updating skills:', error);
            presentToast(`Error saving skills!${error?.message ? ` ${error?.message}` : ''}`, {
                type: ToastTypeEnum.Error,
            });
        } finally {
            setIsUpdating(false);
        }

        closeModal();
    };

    const isAdd = step === Step.Add;
    const isReview = step === Step.Review;

    const errorLoadingFramework = !selfAssignedSkillFramework && !selfAssignedSkillFrameworkLoading;

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden">
            <div className="px-[20px] py-[20px] bg-white safe-area-top-margin flex flex-col gap-[10px] z-20 relative border-b-[1px] border-grayscale-200 border-solid rounded-b-[30px]">
                <div className="flex items-center gap-[10px] text-grayscale-900">
                    <PuzzlePiece className="w-[40px] h-[40px]" version="filled" />
                    <h5 className="text-[22px] font-poppins font-[600] leading-[24px]">
                        {isAdd ? 'Add Skills' : 'Review Selected Skills'}
                    </h5>
                </div>
                {isReview && (
                    <p className="py-[10px] text-grayscale-800 text-[17px] font-poppins">
                        {conditionalPluralize(selectedSkills.length, 'Selected Skill')}
                    </p>
                )}
            </div>

            {errorLoadingFramework && <GenericErrorView errorMessage="Error loading framework" />}

            {isUpdating && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-30">
                    <IonSpinner color="dark" name="crescent" />
                </div>
            )}

            {!errorLoadingFramework && (
                <section className="h-full pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0 relative">
                    <SkillSearchSelector
                        selectedSkills={selectedSkills}
                        onSelectedSkillsChange={setSelectedSkills}
                        mode={isReview ? 'review' : 'add'}
                        shouldCollapseOptions={isReview}
                        showSuggestSkill={true}
                    />
                </section>
            )}

            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center bg-opacity-80 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white"
            >
                <div className="w-full flex items-center justify-center gap-[10px] max-w-[600px]">
                    {isReview && (
                        <button
                            onClick={() => setStep(Step.Add)}
                            className="p-[10px] bg-white rounded-full text-grayscale-900 shadow-button-bottom border-solid border-[1px] border-grayscale-200"
                        >
                            <SlimCaretLeft className="w-[22px] h-[22px]" />
                        </button>
                    )}

                    <button
                        onClick={handleClose}
                        className="p-[10px] bg-white rounded-full text-grayscale-900 shadow-button-bottom flex-1 font-poppins text-[17px] border-solid border-[1px] border-grayscale-200 leading-[22px]"
                    >
                        Close
                    </button>

                    <button
                        onClick={
                            isAdd
                                ? () => {
                                      setStep(Step.Review);
                                  }
                                : handleSave
                        }
                        className="px-[15px] py-[7px] bg-emerald-700 text-white rounded-[30px] text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] shadow-button-bottom h-[44px] flex-1 disabled:bg-grayscale-300"
                        disabled={
                            hasNoChanges || skillsLoading || isUpdating || errorLoadingFramework
                        }
                    >
                        {isAdd ? 'Select' : 'Save'}
                    </button>
                </div>
            </IonFooter>
        </div>
    );
};

export default SelfAssignSkillsModal;
