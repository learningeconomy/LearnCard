import React, { useEffect, useState } from 'react';
import {
    useModal,
    useListMySkillFrameworks,
    useSearchFrameworkSkills,
    ModalTypes,
    conditionalPluralize,
    useManageSelfAssignedSkillsBoost,
    useGetSelfAssignedSkillsBoost,
    useGetBoost,
    useGetBoostSkills,
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
import { SkillLevel } from './SkillProgressBar';

enum Step {
    Add,
    Review,
}

type SelfAssignSkillsModalProps = {};

const SelfAssignSkillsModal: React.FC<SelfAssignSkillsModalProps> = ({}) => {
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

    // TODO this will be replaced an an AI powered search
    const { data: searchResultsApiData, isLoading: searchLoading } = useSearchFrameworkSkills(
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

    const suggestedSkills =
        // @ts-ignore
        searchResultsApiData?.records?.map((record: ApiSkillNode) =>
            convertApiSkillNodeToSkillTreeNode(record)
        ) || [];

    const handleToggleSelect = (skillId: string) => {
        const isAlreadySelected = selectedSkills.some(s => s.id === skillId);
        if (isAlreadySelected) {
            setSelectedSkills(selectedSkills.filter(s => s.id !== skillId));
        } else {
            setSelectedSkills([...selectedSkills, { id: skillId, proficiency: SkillLevel.Novice }]);
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

    const { mutateAsync: createOrUpdateSkills } = useManageSelfAssignedSkillsBoost();
    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoost } = useGetBoost(sasBoostData?.uri);
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

            <section className="h-full flex flex-col gap-[10px] pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0">
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

                {isAdd ? (
                    <p className="py-[10px] text-grayscale-600 text-[17px] font-[600] font-poppins border-solid border-t-[1px] border-grayscale-200">
                        Suggested Skills
                    </p>
                ) : (
                    <p className="py-[10px] text-grayscale-800 text-[17px] font-poppins">
                        {conditionalPluralize(selectedSkills.length, 'Selected Skill')}
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
                                    proficiencyLevel={selected?.proficiency ?? SkillLevel.Novice}
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
