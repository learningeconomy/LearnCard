import React, { useEffect, useState } from 'react';
import {
    useModal,
    useListMySkillFrameworks,
    useSearchFrameworkSkills,
    useSemanticSearchSkills,
    ModalTypes,
    conditionalPluralize,
    useManageSelfAssignedSkillsBoost,
    useGetSelfAssignedSkillsBoost,
    useGetBoostSkills,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import X from 'learn-card-base/svgs/X';
import Search from 'learn-card-base/svgs/Search';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import SelfAssignedSkillRow from './SelfAssignedSkillRow';
import SkillsCloseConfirmationModal from './SkillsCloseConfirmationModal';
import { IonFooter, IonInput, IonSpinner } from '@ionic/react';

import {
    ApiSkillNode,
    convertApiSkillNodeToSkillTreeNode,
} from '../../helpers/skillFramework.helpers';
import { SkillLevel } from './SkillProficiencyBar';

enum Step {
    Add,
    Review,
}

type SelfAssignSkillsModalProps = {};

const SelfAssignSkillsModal: React.FC<SelfAssignSkillsModalProps> = ({}) => {
    const { presentToast } = useToast();
    const { closeModal, newModal } = useModal();

    const [isUpdating, setIsUpdating] = useState(false);
    const [step, setStep] = useState<Step>(Step.Add);
    const [searchInput, setSearchInput] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<
        {
            id: string;
            proficiency: SkillLevel;
        }[]
    >([]);

    const { data: frameworks = [] } = useListMySkillFrameworks();
    const selfAssignedSkillFramework = frameworks[0]; // TODO arbitrary for now
    const frameworkId = selfAssignedSkillFramework?.id;

    const { data: suggestedApiData, isLoading: suggestedLoading } = useSearchFrameworkSkills(
        frameworkId,
        {
            // $or: [
            //     { code: { $regex: `/${searchInput}/i` } }, // Case-insensitive regex match on code
            //     { statement: { $regex: `/${searchInput}/i` } }, // Case-insensitive regex match on statement
            // ],
            type: 'competency',

            // Doesn't work :/
            // $and: [
            //     { type: 'competency' },
            //     {
            //         $or: [
            //             { code: { $regex: searchInput, $options: 'i' } }, // Case-insensitive regex match on code
            //             { statement: { $regex: searchInput, $options: 'i' } }, // Case-insensitive regex match on statement
            //         ],
            //     },
            // ],
        }
    );

    const { data: semanticResultsApiData, isLoading: semanticLoading } = useSemanticSearchSkills(
        searchInput,
        frameworkId,
        { limit: 25 }
    );

    const searchLoading = Boolean(searchInput?.trim()) ? semanticLoading : suggestedLoading;

    const resultsToShow = Boolean(searchInput?.trim()) ? semanticResultsApiData : suggestedApiData;

    const suggestedSkills =
        // @ts-ignore
        (resultsToShow as any)?.records
            ? // Paginated results shape (string search)
              (resultsToShow as any)?.records?.map((record: ApiSkillNode) =>
                  convertApiSkillNodeToSkillTreeNode(record)
              )
            : // Array results shape (semantic search)
              (resultsToShow as any)?.map((record: ApiSkillNode) =>
                  convertApiSkillNodeToSkillTreeNode(record)
              ) || [];

    const handleToggleSelect = (skillId: string) => {
        const isAlreadySelected = selectedSkills.some(s => s.id === skillId);
        if (isAlreadySelected) {
            setSelectedSkills(selectedSkills.filter(s => s.id !== skillId));
        } else {
            setSelectedSkills([...selectedSkills, { id: skillId, proficiency: SkillLevel.Hidden }]);
        }
    };

    const handleClose = () => {
        if (selectedSkills.length > 0) {
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

    const handleSubmitSkillSuggestion = async () => {
        // const webhookUrl = process.env.REACT_APP_SKILL_SUGGESTION_WEBHOOK;
        // Results can be viewed here: https://docs.google.com/spreadsheets/d/1FjAL8Napvf0U0fB4Lh4tzzmQvBZntIZJpDRCHyYFvdc/edit?usp=sharing
        //   restricted to LEF members
        const webhookUrl =
            'https://script.google.com/macros/s/AKfycbxLWcLBp1u7CfIzjPJT0ZTf4TkdgCMsVxNz3YifmUjmHlLTr7xvsoXGJXJKMxjofg3k1A/exec';
        if (!webhookUrl) {
            console.warn('REACT_APP_SKILL_SUGGESTION_WEBHOOK not configured');
            presentToast('Thank you for your suggestion!', {
                type: ToastTypeEnum.Success,
            });
            return;
        }
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suggestion: searchInput,
                    timestamp: new Date().toISOString(),
                    role: 'test',
                }),
                mode: 'no-cors',
            });
            presentToast('Thank you for your suggestion!', {
                type: ToastTypeEnum.Success,
            });
        } catch (error) {
            console.error('Failed to submit skill suggestion:', error);
            presentToast('Thank you for your suggestion!', {
                type: ToastTypeEnum.Success,
            });
        }
    };

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

    const handleSave = async () => {
        setIsUpdating(true);
        try {
            const { boostUri } = await createOrUpdateSkills({
                skills: selectedSkills.map(s => ({
                    frameworkId: frameworkId,
                    id: s.id,
                    proficiencyLevel: s.proficiency,
                })),
            });

            // TODO maybe a toast?
        } catch (error) {
            console.error('Error creating or updating skills:', error);
        } finally {
            setIsUpdating(false);
        }

        closeModal();
    };

    const isAdd = step === Step.Add;
    const isReview = step === Step.Review;
    const noResults = !!searchInput && suggestedSkills.length === 0 && !searchLoading;

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden">
            <div className="px-[20px] py-[20px] bg-white safe-area-top-margin flex flex-col gap-[10px] z-20 relative border-b-[1px] border-grayscale-200 border-solid rounded-b-[30px]">
                <div className="flex items-center gap-[10px] text-grayscale-900">
                    <PuzzlePiece className="w-[40px] h-[40px]" version="filled" />
                    <h5 className="text-[22px] font-poppins font-[600] leading-[24px]">
                        {isAdd ? 'Add Skills' : 'Review Selected Skills'}
                    </h5>
                </div>
            </div>

            <section className="h-full flex flex-col gap-[20px] pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                    </div>
                    <IonInput
                        type="text"
                        value={searchInput}
                        placeholder={
                            isAdd ? 'Search by skill or occupation...' : 'Search skills...'
                        }
                        onIonInput={e => setSearchInput(e.detail.value)}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[10px] !py-[4px] font-normal !font-notoSans text-[14px] !pl-[44px] !text-left !pr-[36px]"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchInput('');
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-600 hover:text-grayscale-800 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {!noResults && (
                    <>
                        {isAdd ? (
                            <p className="py-[10px] text-grayscale-600 text-[17px] font-[600] font-poppins">
                                Suggested Skills
                            </p>
                        ) : (
                            <p className="py-[10px] text-grayscale-800 text-[17px] font-poppins">
                                {conditionalPluralize(selectedSkills.length, 'Selected Skill')}
                            </p>
                        )}
                    </>
                )}
                {noResults && (
                    <p className="py-[10px] text-grayscale-600 text-[17px] font-[600] font-poppins">
                        No results or suggestions
                    </p>
                )}

                {searchLoading ? (
                    <div className="flex-1 flex justify-center pt-[30px]">
                        <IonSpinner color="dark" name="crescent" />
                    </div>
                ) : (
                    <>
                        {suggestedSkills.map((skill, index) => {
                            const selected = selectedSkills.find(s => s.id === skill.id);
                            if (isReview && !selected) {
                                // TODO logic will eventually have to be more sophisticated
                                return null;
                            }

                            return (
                                <SelfAssignedSkillRow
                                    skill={skill}
                                    framework={selfAssignedSkillFramework}
                                    handleToggleSelect={() => handleToggleSelect(skill.id)}
                                    isNodeSelected={!!selected}
                                    shouldCollapseOptions={isReview}
                                    proficiencyLevel={selected?.proficiency ?? SkillLevel.Hidden}
                                    onChangeProficiency={level =>
                                        setSelectedSkills(prev =>
                                            prev.map(s =>
                                                s.id === skill.id ? { ...s, proficiency: level } : s
                                            )
                                        )
                                    }
                                />
                            );
                        })}
                    </>
                )}

                {searchInput && !searchLoading && (
                    <div className="flex flex-col gap-[20px] w-full pt-[20px] border-t-[1px] border-grayscale-200 border-solid">
                        <div className="flex flex-col items-start gap-[10px] pb-[10px]">
                            <p className="text-grayscale-900 text-[17px] font-[600] font-poppins">
                                Didn't find what you're looking for?
                            </p>
                            <p className="font-poppins text-[17px] text-grayscale-700">
                                We are always adding new skills and your suggestions help!
                            </p>
                        </div>

                        <p className="text-grayscale-900 font-poppins text-[17px] font-[600] italic text-center">
                            {searchInput}
                        </p>

                        <button
                            className="px-[20px] py-[7px] rounded-[30px] bg-indigo-500 text-white text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px]"
                            onClick={handleSubmitSkillSuggestion}
                        >
                            Suggest Skill
                        </button>
                    </div>
                )}
            </section>

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
                                      setSearchInput('');
                                  }
                                : handleSave
                        }
                        className="px-[15px] py-[7px] bg-emerald-700 text-white rounded-[30px] text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] shadow-button-bottom h-[44px] flex-1 disabled:bg-grayscale-300"
                        disabled={selectedSkills.length === 0 || skillsLoading || isUpdating}
                    >
                        {isAdd ? 'Select' : 'Save'}
                    </button>
                </div>
            </IonFooter>
        </div>
    );
};

export default SelfAssignSkillsModal;
