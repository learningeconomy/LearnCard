import React, { useEffect, useRef, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import {
    useGetSkillFrameworkById,
    useSearchFrameworkSkills,
    useSemanticSearchSkills,
    useGetSelfAssignedSkillsBoost,
    useGetBoostSkills,
    useGetProfile,
    useToast,
    ToastTypeEnum,
    conditionalPluralize,
    useModal,
    ModalTypes,
} from 'learn-card-base';

import X from 'learn-card-base/svgs/X';
import Plus from '../../components/svgs/Plus';
import Search from 'learn-card-base/svgs/Search';
import VerifiedBadgeIcon from 'learn-card-base/svgs/VerifiedBadgeIcon';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import SlimCaretLeft from 'src/components/svgs/SlimCaretLeft';
import SlimCaretRight from 'src/components/svgs/SlimCaretRight';
import AddSkillModal from './AddSkillModal';
import SkillTag from './SkillTag';
import { IonInput, IonSpinner } from '@ionic/react';
import { GenericErrorView } from 'learn-card-base/components/generic/GenericErrorBoundary';

import {
    ApiSkillNode,
    convertApiSkillNodeToSkillTreeNode,
} from '../../helpers/skillFramework.helpers';
import { SkillFrameworkNode } from '../../components/boost/boost';
import { SkillLevel } from './skillTypes';
import type { SelectedSkill } from './skillTypes';

type SkillSearchSelectorProps = {
    selectedSkills: SelectedSkill[];
    onSelectedSkillsChange: (skills: SelectedSkill[]) => void;
    showSuggestSkill?: boolean;
    showSearchInput?: boolean;
    showSelectedSkills?: boolean;
    searchQuery?: string;
    onSearchQueryChange?: (searchQuery: string) => void;
    isSavingSkills?: boolean;
    onAddSkill?: (skill: SkillFrameworkNode, proficiencyLevel: SkillLevel) => void;
    onEditSkill?: (skillId: string, proficiencyLevel: SkillLevel) => void;
    onRemoveSkill?: (skillId: string) => void;
    className?: string;
    initialSearchQuery?: string;
};

const SkillSearchSelector: React.FC<SkillSearchSelectorProps> = ({
    selectedSkills,
    onSelectedSkillsChange,
    showSuggestSkill = true,
    showSearchInput = true,
    showSelectedSkills = true,
    searchQuery,
    onSearchQueryChange,
    isSavingSkills = false,
    onAddSkill,
    onEditSkill,
    onRemoveSkill,
    className = '',
    initialSearchQuery,
}) => {
    const flags = useFlags();
    const { newModal } = useModal();
    const { presentToast } = useToast();
    const { data: lcNetworkProfile } = useGetProfile();

    const [isSubmittingSkillSuggestion, setIsSubmittingSkillSuggestion] = useState(false);
    const [internalSearchInput, setInternalSearchInput] = useState(initialSearchQuery || '');
    const selectedSkillsSwiperRef = useRef<any>(null);
    const [selectedSkillsAtBeginning, setSelectedSkillsAtBeginning] = useState(true);
    const [selectedSkillsAtEnd, setSelectedSkillsAtEnd] = useState(false);
    const [selectedSkillsExpanded, setSelectedSkillsExpanded] = useState(false);

    const initialSkillIds = flags?.initialSelfAssignedSkillIds?.skillIds as string[];
    const frameworkId = flags?.selfAssignedSkillsFrameworkId;

    const { data: selfAssignedSkillFramework, isLoading: selfAssignedSkillFrameworkLoading } =
        useGetSkillFrameworkById(frameworkId);

    const { data: initialSkillsData, isLoading: initialSkillsLoading } = useSearchFrameworkSkills(
        frameworkId,
        { id: { $in: initialSkillIds ?? [] } },
        { enabled: !!initialSkillIds?.length }
    );

    const isControlledSearch = searchQuery !== undefined;
    const searchInput = isControlledSearch ? searchQuery : internalSearchInput;

    const setSearchInput = (nextSearchQuery: string) => {
        if (isControlledSearch) {
            onSearchQueryChange?.(nextSearchQuery);
            return;
        }

        setInternalSearchInput(nextSearchQuery);
    };

    const { data: semanticResultsApiData, isLoading: semanticLoading } = useSemanticSearchSkills(
        searchInput,
        frameworkId,
        { limit: 25 }
    );

    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills } = useGetBoostSkills(sasBoostData?.uri);

    const hasSearchQuery = Boolean(searchInput?.trim());
    const searchLoading = hasSearchQuery ? semanticLoading : initialSkillsLoading;

    const initialSkills: SkillFrameworkNode[] =
        (initialSkillsData as any)?.records?.map((record: ApiSkillNode) =>
            convertApiSkillNodeToSkillTreeNode(record)
        ) ?? [];

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
    const suggestedSkillsToShow = suggestedSkills.filter(
        skill => !selectedSkills.find(selected => selected.id === skill.id)
    );
    const addSkillsTitle = hasSearchQuery
        ? `${suggestedSkillsToShow.length} More skills for ${searchInput?.trim() ?? ''}`
        : 'Add Skills';

    const handleToggleSelect = (skillId: string, proficiencyLevel?: SkillLevel) => {
        const isAlreadySelected = selectedSkills.some(s => s.id === skillId);
        if (isAlreadySelected) {
            onSelectedSkillsChange(selectedSkills.filter(s => s.id !== skillId));
        } else {
            onSelectedSkillsChange([
                ...selectedSkills,
                { id: skillId, proficiency: proficiencyLevel ?? SkillLevel.Hidden },
            ]);
        }
    };

    const handleChangeProficiency = (skillId: string, proficiencyLevel: SkillLevel) => {
        onSelectedSkillsChange(
            selectedSkills.map(s =>
                s.id === skillId ? { ...s, proficiency: proficiencyLevel } : s
            )
        );
    };

    const handleAddSkillToSelection = (skill: SkillFrameworkNode, proficiencyLevel: SkillLevel) => {
        if (onAddSkill) {
            onAddSkill(skill, proficiencyLevel);
            return;
        }

        handleToggleSelect(skill.id!, proficiencyLevel);
    };

    const handleEditSkillInSelection = (skillId: string, proficiencyLevel: SkillLevel) => {
        if (onEditSkill) {
            onEditSkill(skillId, proficiencyLevel);
            return;
        }

        handleChangeProficiency(skillId, proficiencyLevel);
    };

    const handleRemoveSkillFromSelection = (skillId: string) => {
        if (onRemoveSkill) {
            onRemoveSkill(skillId);
            return;
        }

        handleToggleSelect(skillId);
    };

    const handleSwiperUpdate = (swiper: any, setAtBeginning: any, setAtEnd: any) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    useEffect(() => {
        if (selectedSkillsSwiperRef.current) {
            selectedSkillsSwiperRef.current.update();
            handleSwiperUpdate(
                selectedSkillsSwiperRef.current,
                setSelectedSkillsAtBeginning,
                setSelectedSkillsAtEnd
            );
        }
    }, [selectedSkills.length]);

    const showSelectedSkillsViewToggle =
        selectedSkillsExpanded || !selectedSkillsAtBeginning || !selectedSkillsAtEnd;

    const handleSubmitSkillSuggestion = async () => {
        if (isSubmittingSkillSuggestion) return;

        setIsSubmittingSkillSuggestion(true);
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

    const handleAddRelatedSkill = (skill: SkillFrameworkNode, proficiencyLevel: SkillLevel) => {
        handleAddSkillToSelection(skill, proficiencyLevel);
    };

    const handleEditRelatedSkill = (skillId: string, proficiencyLevel: SkillLevel) => {
        handleEditSkillInSelection(skillId, proficiencyLevel);
    };

    const handleRemoveRelatedSkill = (skillId: string) => {
        handleRemoveSkillFromSelection(skillId);
    };

    const openAddSkillModal = (skill: SkillFrameworkNode) => {
        newModal(
            <AddSkillModal
                frameworkId={frameworkId}
                skill={skill}
                handleAdd={(skill, proficiencyLevel) => {
                    handleAddSkillToSelection(skill, proficiencyLevel);
                }}
                selectedSkills={selectedSkills}
                handleAddRelatedSkill={handleAddRelatedSkill}
                handleEditRelatedSkill={handleEditRelatedSkill}
                handleRemoveRelatedSkill={handleRemoveRelatedSkill}
            />,
            undefined,
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const noResults = !!searchInput && suggestedSkillsToShow.length === 0 && !searchLoading;
    const errorLoadingFramework = !selfAssignedSkillFramework && !selfAssignedSkillFrameworkLoading;

    return (
        <div className={`flex flex-col gap-[20px] ${className}`}>
            {errorLoadingFramework && <GenericErrorView errorMessage="Error loading framework" />}

            {!errorLoadingFramework && (
                <>
                    {showSearchInput && (
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                                <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                            </div>
                            <IonInput
                                type="text"
                                value={searchInput}
                                placeholder={'Search by skill, goal, or job...'}
                                onIonInput={e => setSearchInput(e.detail.value ?? '')}
                                className="bg-grayscale-100 text-grayscale-800 rounded-[10px] !py-[4px] font-normal !font-notoSans text-[14px] !pl-[44px] !text-left !pr-[36px]"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => setSearchInput('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-600 hover:text-grayscale-800 transition-colors z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}

                    {showSelectedSkills && selectedSkills.length > 0 && (
                        <div className="py-[10px] border-t-[1px] border-solid border-grayscale-200 flex flex-col gap-[10px]">
                            <h4 className="flex gap-[5px] items-center text-grayscale-900 font-poppins text-[14px] font-bold">
                                <VerifiedBadgeIcon />
                                {conditionalPluralize(selectedSkills.length, 'Self Assigned Skill')}

                                <div className="ml-auto flex items-center gap-[10px]">
                                    {showSelectedSkillsViewToggle && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSkillsExpanded(prev => !prev)}
                                            className="text-grayscale-600 text-[14px] font-bold"
                                        >
                                            {selectedSkillsExpanded ? 'View Less' : 'View All'}
                                        </button>
                                    )}
                                </div>
                            </h4>

                            <div className="relative w-full overflow-hidden transition-all duration-300 ease-in-out">
                                {!selectedSkillsExpanded ? (
                                    <>
                                        <Swiper
                                            onSwiper={swiper => {
                                                selectedSkillsSwiperRef.current = swiper;
                                                handleSwiperUpdate(
                                                    swiper,
                                                    setSelectedSkillsAtBeginning,
                                                    setSelectedSkillsAtEnd
                                                );
                                            }}
                                            onResize={swiper =>
                                                handleSwiperUpdate(
                                                    swiper,
                                                    setSelectedSkillsAtBeginning,
                                                    setSelectedSkillsAtEnd
                                                )
                                            }
                                            onSlideChange={swiper =>
                                                handleSwiperUpdate(
                                                    swiper,
                                                    setSelectedSkillsAtBeginning,
                                                    setSelectedSkillsAtEnd
                                                )
                                            }
                                            onReachBeginning={() =>
                                                setSelectedSkillsAtBeginning(true)
                                            }
                                            onFromEdge={() => {
                                                if (selectedSkillsSwiperRef.current) {
                                                    setSelectedSkillsAtBeginning(
                                                        selectedSkillsSwiperRef.current.isBeginning
                                                    );
                                                    setSelectedSkillsAtEnd(
                                                        selectedSkillsSwiperRef.current.isEnd
                                                    );
                                                }
                                            }}
                                            onReachEnd={() => setSelectedSkillsAtEnd(true)}
                                            spaceBetween={12}
                                            slidesPerView={'auto'}
                                            grabCursor={true}
                                        >
                                            {selectedSkills.map(skill => (
                                                <SwiperSlide
                                                    key={skill.id}
                                                    style={{ width: 'auto' }}
                                                >
                                                    <SkillTag
                                                        skillId={skill.id}
                                                        frameworkId={frameworkId}
                                                        proficiencyLevel={skill.proficiency}
                                                        handleRemoveSkill={() =>
                                                            handleRemoveSkillFromSelection(skill.id)
                                                        }
                                                        handleEditSkill={proficiencyLevel =>
                                                            handleEditSkillInSelection(
                                                                skill.id,
                                                                proficiencyLevel
                                                            )
                                                        }
                                                        disabled={isSavingSkills}
                                                        selectedSkills={selectedSkills}
                                                        handleAddRelatedSkill={
                                                            handleAddRelatedSkill
                                                        }
                                                        handleEditRelatedSkill={
                                                            handleEditRelatedSkill
                                                        }
                                                        handleRemoveRelatedSkill={
                                                            handleRemoveRelatedSkill
                                                        }
                                                    />
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>

                                        {!selectedSkillsAtBeginning && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    selectedSkillsSwiperRef.current?.slidePrev();
                                                }}
                                                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                                                style={{ opacity: 0.8 }}
                                                disabled={isSavingSkills}
                                            >
                                                <SlimCaretLeft className="w-5 h-auto" />
                                            </button>
                                        )}

                                        {!selectedSkillsAtEnd && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    selectedSkillsSwiperRef.current?.slideNext();
                                                }}
                                                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                                                style={{ opacity: 0.8 }}
                                                disabled={isSavingSkills}
                                            >
                                                <SlimCaretRight className="w-5 h-auto" />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-row flex-wrap gap-[10px]">
                                        {selectedSkills.map(skill => (
                                            <SkillTag
                                                key={skill.id}
                                                skillId={skill.id}
                                                frameworkId={frameworkId}
                                                proficiencyLevel={skill.proficiency}
                                                handleRemoveSkill={() =>
                                                    handleRemoveSkillFromSelection(skill.id)
                                                }
                                                handleEditSkill={proficiencyLevel =>
                                                    handleEditSkillInSelection(
                                                        skill.id,
                                                        proficiencyLevel
                                                    )
                                                }
                                                disabled={isSavingSkills}
                                                selectedSkills={selectedSkills}
                                                handleAddRelatedSkill={handleAddRelatedSkill}
                                                handleEditRelatedSkill={handleEditRelatedSkill}
                                                handleRemoveRelatedSkill={handleRemoveRelatedSkill}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {showSuggestSkill && (
                        <div className="relative py-[10px] border-t-[1px] border-solid border-grayscale-200 flex flex-col gap-[10px]">
                            {isSavingSkills && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 rounded-[10px]">
                                    <IonSpinner color="dark" name="crescent" />
                                </div>
                            )}

                            <h4 className="text-grayscale-900 font-poppins text-[14px] font-bold">
                                {addSkillsTitle}
                            </h4>

                            {searchLoading && (
                                <div className="flex-1 flex justify-center pt-[30px]">
                                    <IonSpinner color="dark" name="crescent" />
                                </div>
                            )}

                            {!searchLoading &&
                                suggestedSkillsToShow.map(skill => (
                                    <button
                                        key={skill.id}
                                        onClick={() => openAddSkillModal(skill)}
                                        disabled={isSavingSkills}
                                        className="p-[10px] flex gap-[10px] items-center background-grayscale-50 rounded-[15px] shadow-bottom-2-4 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <CompetencyIcon icon={skill.icon!} />
                                        <span className="text-grayscale-900 font-poppins text-[17px] line-clamp-2 text-left">
                                            {skill?.targetName}
                                        </span>
                                        <Plus
                                            className="h-[25px] w-[25px] text-grayscale-700 ml-auto"
                                            strokeWidth="2"
                                        />
                                    </button>
                                ))}

                            {noResults && (
                                <p className="py-[10px] text-grayscale-600 text-[17px] font-[600] font-poppins">
                                    No results or suggestions
                                </p>
                            )}

                            {searchInput && !searchLoading && (
                                <div className="flex flex-col gap-[10px] pb-[10px] pt-[10px] border-t border-grayscale-200 border-solid">
                                    <p className="text-grayscale-900 text-[17px] font-[600] font-poppins">
                                        Didn&apos;t find what you&apos;re looking for?
                                    </p>
                                    <p className="font-poppins text-[17px] text-grayscale-700">
                                        We are always adding new skills and your suggestions help!
                                    </p>

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
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SkillSearchSelector;
