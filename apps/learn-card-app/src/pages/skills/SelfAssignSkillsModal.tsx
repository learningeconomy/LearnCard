import React, { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    useModal,
    ModalTypes,
    useGetSkillFrameworkById,
    useSearchFrameworkSkills,
    useSemanticSearchSkills,
    useGetSelfAssignedSkillsBoost,
    useManageSelfAssignedSkillsBoost,
    useGetBoostSkills,
    useGetProfile,
    useToast,
    ToastTypeEnum,
    conditionalPluralize,
} from 'learn-card-base';

import X from 'learn-card-base/svgs/X';
import Search from 'learn-card-base/svgs/Search';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import SelfAssignedSkillRow from './SelfAssignedSkillRow';
import SkillsCloseConfirmationModal from './SkillsCloseConfirmationModal';
import { IonFooter, IonInput, IonSpinner } from '@ionic/react';
import { GenericErrorView } from 'learn-card-base/components/generic/GenericErrorBoundary';

import {
    ApiSkillNode,
    convertApiSkillNodeToSkillTreeNode,
} from '../../helpers/skillFramework.helpers';
import { SkillFrameworkNode } from '../../components/boost/boost';
import { SkillLevel } from './SkillProficiencyBar';

enum Step {
    Add,
    Review,
}

type SelfAssignSkillsModalProps = {};

const SelfAssignSkillsModal: React.FC<SelfAssignSkillsModalProps> = ({}) => {
    const flags = useFlags();
    const { presentToast } = useToast();
    const { closeModal, newModal } = useModal();
    const { data: lcNetworkProfile } = useGetProfile();

    const [isUpdating, setIsUpdating] = useState(false);
    const [isSubmittingSkillSuggestion, setIsSubmittingSkillSuggestion] = useState(false);
    const [step, setStep] = useState<Step>(Step.Add);
    const [searchInput, setSearchInput] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<
        {
            id: string;
            proficiency: SkillLevel;
        }[]
    >([]);
    const [selectedSkillNodesCache, setSelectedSkillNodesCache] = useState<
        Map<string, SkillFrameworkNode>
    >(new Map());

    const initialSkillIds = flags?.initialSelfAssignedSkillIds?.skillIds as string[];

    const frameworkId = flags?.selfAssignedSkillsFrameworkId; // https://app.launchdarkly.com/projects/default/flags/selfAssignedSkillsFrameworkId/targeting?env=test&env=production&selected-env=test
    const { data: selfAssignedSkillFramework, isLoading: selfAssignedSkillFrameworkLoading } =
        useGetSkillFrameworkById(frameworkId);

    const { data: initialSkillsData, isLoading: initialSkillsLoading } = useSearchFrameworkSkills(
        frameworkId,
        { id: { $in: initialSkillIds ?? [] } },
        { enabled: !!initialSkillIds?.length }
    );

    const { data: semanticResultsApiData, isLoading: semanticLoading } = useSemanticSearchSkills(
        searchInput,
        frameworkId,
        { limit: 25 }
    );

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

    const hasSearchQuery = Boolean(searchInput?.trim());
    const searchLoading = hasSearchQuery ? semanticLoading : initialSkillsLoading;

    const initialSkills: SkillFrameworkNode[] =
        (initialSkillsData as any)?.records?.map((record: ApiSkillNode) =>
            convertApiSkillNodeToSkillTreeNode(record)
        ) ?? [];

    // We keep a stable, display-only list of any *pre-selected* skills that are not included in
    // `initialSkillIds`.
    //
    // If we derived this list directly from `selectedSkills`, then de-selecting one of these
    // skills would remove it from the list, causing the visible list to re-order ("jump").
    // Instead, we capture these nodes once from the initially saved boost skills and keep them
    // in the default list so toggling selection doesn't change list ordering.
    const [stableExtraSkillNodes, setStableExtraSkillNodes] = useState<SkillFrameworkNode[]>([]);

    useEffect(() => {
        if (stableExtraSkillNodes.length === 0 && sasBoostSkills) {
            const extraNodes: SkillFrameworkNode[] = sasBoostSkills
                .filter((sk: { id: string }) => !initialSkillIds?.includes(sk.id))
                .map((sk: any) => convertApiSkillNodeToSkillTreeNode(sk as any));
            if (extraNodes.length > 0) {
                setStableExtraSkillNodes(extraNodes);
            }
        }
    }, [sasBoostSkills, initialSkillIds, stableExtraSkillNodes.length]);

    const defaultSkillsToShow: SkillFrameworkNode[] = [...stableExtraSkillNodes, ...initialSkills];

    const semanticSkills: SkillFrameworkNode[] =
        semanticResultsApiData?.records?.map((record: ApiSkillNode) =>
            convertApiSkillNodeToSkillTreeNode(record)
        ) ?? [];

    const suggestedSkills = hasSearchQuery ? semanticSkills : defaultSkillsToShow;

    const handleToggleSelect = (skillId: string, skillNode?: SkillFrameworkNode) => {
        const isAlreadySelected = selectedSkills.some(s => s.id === skillId);
        if (isAlreadySelected) {
            setSelectedSkills(selectedSkills.filter(s => s.id !== skillId));
        } else {
            setSelectedSkills([...selectedSkills, { id: skillId, proficiency: SkillLevel.Hidden }]);
            if (skillNode) {
                setSelectedSkillNodesCache(prev => new Map(prev).set(skillId, skillNode));
            }
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
        if (isSubmittingSkillSuggestion) return;

        setIsSubmittingSkillSuggestion(true);
        // const webhookUrl = process.env.REACT_APP_SKILL_SUGGESTION_WEBHOOK;
        // Results can be viewed here: https://docs.google.com/spreadsheets/d/1FjAL8Napvf0U0fB4Lh4tzzmQvBZntIZJpDRCHyYFvdc/edit?usp=sharing
        //   restricted to LEF members
        const webhookUrl =
            'https://script.google.com/macros/s/AKfycbxLWcLBp1u7CfIzjPJT0ZTf4TkdgCMsVxNz3YifmUjmHlLTr7xvsoXGJXJKMxjofg3k1A/exec';
        try {
            if (!webhookUrl) {
                console.warn('REACT_APP_SKILL_SUGGESTION_WEBHOOK not configured');
                presentToast('Thank you for your suggestion!', {
                    type: ToastTypeEnum.Success,
                });
                return;
            }

            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suggestion: searchInput,
                    timestamp: new Date().toISOString(),
                    role: lcNetworkProfile?.role,
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
        } finally {
            setIsSubmittingSkillSuggestion(false);
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
    const noResults = !!searchInput && suggestedSkills.length === 0 && !searchLoading;

    const errorLoadingFramework = !selfAssignedSkillFramework && selfAssignedSkillFrameworkLoading;

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

            {errorLoadingFramework && <GenericErrorView errorMessage="Error loading framework" />}

            {!errorLoadingFramework && (
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
                                hasSearchQuery && (
                                    <p className="py-[10px] text-grayscale-600 text-[17px] font-[600] font-poppins">
                                        Suggested Skills
                                    </p>
                                )
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
                    ) : isReview ? (
                        // In review mode, show all selected skills from combined sources
                        <>
                            {selectedSkills.map(selected => {
                                // Try to find full skill data from multiple sources
                                const savedSkill = sasBoostSkills?.find(
                                    (s: { id: string }) => s.id === selected.id
                                );
                                const cachedSkill = selectedSkillNodesCache.get(selected.id);
                                const suggestedSkill = suggestedSkills.find(
                                    (s: SkillFrameworkNode) => s.id === selected.id
                                );

                                // Convert to SkillFrameworkNode format (priority: saved > cached > suggested)
                                const skill = savedSkill
                                    ? convertApiSkillNodeToSkillTreeNode(savedSkill as any)
                                    : cachedSkill ?? suggestedSkill;

                                if (!skill) return null;

                                return (
                                    <SelfAssignedSkillRow
                                        key={selected.id}
                                        skill={skill}
                                        framework={selfAssignedSkillFramework}
                                        handleToggleSelect={() => handleToggleSelect(selected.id)}
                                        isNodeSelected={true}
                                        shouldCollapseOptions={isReview}
                                        proficiencyLevel={selected.proficiency}
                                        onChangeProficiency={level =>
                                            setSelectedSkills(prev =>
                                                prev.map(s =>
                                                    s.id === selected.id
                                                        ? { ...s, proficiency: level }
                                                        : s
                                                )
                                            )
                                        }
                                    />
                                );
                            })}
                        </>
                    ) : (
                        <>
                            {suggestedSkills.map((skill, index) => {
                                const selected = selectedSkills.find(s => s.id === skill.id);

                                return (
                                    <SelfAssignedSkillRow
                                        key={skill.id}
                                        skill={skill}
                                        framework={selfAssignedSkillFramework}
                                        handleToggleSelect={() =>
                                            handleToggleSelect(skill.id!, skill)
                                        }
                                        isNodeSelected={!!selected}
                                        shouldCollapseOptions={false}
                                        proficiencyLevel={
                                            selected?.proficiency ?? SkillLevel.Hidden
                                        }
                                        onChangeProficiency={level =>
                                            setSelectedSkills(prev =>
                                                prev.map(s =>
                                                    s.id === skill.id
                                                        ? { ...s, proficiency: level }
                                                        : s
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
                                className="px-[20px] py-[7px] rounded-[30px] bg-indigo-500 text-white text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] disabled:bg-grayscale-200"
                                onClick={handleSubmitSkillSuggestion}
                                disabled={isSubmittingSkillSuggestion}
                            >
                                Suggest Skill
                            </button>
                        </div>
                    )}
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
                                      setSearchInput('');
                                  }
                                : handleSave
                        }
                        className="px-[15px] py-[7px] bg-emerald-700 text-white rounded-[30px] text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] shadow-button-bottom h-[44px] flex-1 disabled:bg-grayscale-300"
                        disabled={
                            selectedSkills.length === 0 ||
                            skillsLoading ||
                            isUpdating ||
                            errorLoadingFramework
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
