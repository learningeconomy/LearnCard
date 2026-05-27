import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import {
    useGetSelfAssignedSkillsBoost,
    useGetBoostSkills,
    conditionalPluralize,
    useGetProfile,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import X from 'learn-card-base/svgs/X';
import Search from 'learn-card-base/svgs/Search';
import VerifiedBadgeIcon from 'learn-card-base/svgs/VerifiedBadgeIcon';
import SlimCaretLeft from 'src/components/svgs/SlimCaretLeft';
import SlimCaretRight from 'src/components/svgs/SlimCaretRight';
import SkillTag from './SkillTag';
import { IonInput, IonSpinner } from '@ionic/react';
import { GenericErrorView } from 'learn-card-base/components/generic/GenericErrorBoundary';

import { SkillFrameworkNode } from '../../components/boost/boost';
import { SkillLevel } from './skillTypes';
import type { SelectedSkill } from './skillTypes';
import SkillSearchFrameworkSection from './SkillSearchFrameworkSection';
import useDebounce from '../../hooks/useDebounce';
import {
    useGlobalSemanticSearchSkills,
    useGlobalSkillFrameworks,
} from '../../helpers/globalSkillFrameworks.helpers';
import type { ApiSkillNode } from '../../helpers/skillFramework.helpers';

type SemanticSkillRecord = ApiSkillNode & { score?: number };

const MAX_SEARCH_LENGTH = 100;
const SEARCH_DEBOUNCE_MS = 350;

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
    onEditSkill?: (frameworkId: string, skillId: string, proficiencyLevel: SkillLevel) => void;
    onRemoveSkill?: (frameworkId: string, skillId: string) => void;
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
    const { presentToast } = useToast();
    const { data: lcNetworkProfile } = useGetProfile();

    const [isSubmittingSkillSuggestion, setIsSubmittingSkillSuggestion] = useState(false);
    const [internalSearchInput, setInternalSearchInput] = useState(initialSearchQuery || '');
    const [debouncedSearchInput, setDebouncedSearchInput] = useState(initialSearchQuery || '');
    const selectedSkillsSwiperRef = useRef<any>(null);
    const [selectedSkillsAtBeginning, setSelectedSkillsAtBeginning] = useState(true);
    const [selectedSkillsAtEnd, setSelectedSkillsAtEnd] = useState(false);
    const [selectedSkillsExpanded, setSelectedSkillsExpanded] = useState(false);

    const globalSkillFrameworks = useGlobalSkillFrameworks();
    const frameworkIds = useMemo(
        () => globalSkillFrameworks.map(framework => framework.frameworkId),
        [globalSkillFrameworks]
    );

    const isControlledSearch = searchQuery !== undefined;
    const searchInput = (isControlledSearch ? searchQuery : internalSearchInput ?? '').slice(
        0,
        MAX_SEARCH_LENGTH
    );

    const updateDebouncedSearchInput = useDebounce(() => {
        setDebouncedSearchInput(searchInput);
    }, SEARCH_DEBOUNCE_MS);

    useEffect(() => {
        updateDebouncedSearchInput();

        return () => {
            updateDebouncedSearchInput.cancel?.();
        };
    }, [searchInput, updateDebouncedSearchInput]);

    const { data: semanticSearchSkillsData, isLoading: semanticLoading } =
        useGlobalSemanticSearchSkills(debouncedSearchInput ?? '', frameworkIds, { limit: 25 });

    const setSearchInput = (nextSearchQuery: string) => {
        const nextValue = nextSearchQuery.slice(0, MAX_SEARCH_LENGTH);

        if (isControlledSearch) {
            onSearchQueryChange?.(nextValue);
            return;
        }

        setInternalSearchInput(nextValue);
    };

    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills } = useGetBoostSkills(sasBoostData?.uri);

    const hasSearchQuery = Boolean(debouncedSearchInput?.trim());
    const hasGlobalFrameworks = globalSkillFrameworks.length > 0;

    const selectedSkillKey = (frameworkId: string, skillId: string) => `${frameworkId}::${skillId}`;

    const selectedSkillsBySemanticScore = useMemo(() => {
        if (!hasSearchQuery) {
            return selectedSkills;
        }

        const scoreBySkillId = new Map<string, number>(
            semanticSearchSkillsData?.records?.map((skill: SemanticSkillRecord) => [
                selectedSkillKey(skill.frameworkId ?? '', skill.id),
                skill.score ?? 0,
            ]) ?? []
        );

        return [...selectedSkills].sort(
            (left, right) =>
                (scoreBySkillId.get(selectedSkillKey(right.frameworkId, right.id)) ?? 0) -
                (scoreBySkillId.get(selectedSkillKey(left.frameworkId, left.id)) ?? 0)
        );
    }, [hasSearchQuery, semanticSearchSkillsData?.records, selectedSkills]);

    const handleToggleSelect = (
        frameworkId: string,
        skillId: string,
        proficiencyLevel?: SkillLevel
    ) => {
        const isAlreadySelected = selectedSkills.some(
            skill => skill.id === skillId && skill.frameworkId === frameworkId
        );
        if (isAlreadySelected) {
            onSelectedSkillsChange(
                selectedSkills.filter(
                    skill => !(skill.id === skillId && skill.frameworkId === frameworkId)
                )
            );
        } else {
            onSelectedSkillsChange([
                ...selectedSkills,
                {
                    id: skillId,
                    frameworkId,
                    proficiency: proficiencyLevel ?? SkillLevel.Hidden,
                },
            ]);
        }
    };

    const handleChangeProficiency = (
        frameworkId: string,
        skillId: string,
        proficiencyLevel: SkillLevel
    ) => {
        onSelectedSkillsChange(
            selectedSkills.map(s =>
                s.id === skillId && s.frameworkId === frameworkId
                    ? { ...s, proficiency: proficiencyLevel }
                    : s
            )
        );
    };

    const handleAddSkillToSelection = (
        skill: SkillFrameworkNode,
        proficiencyLevel: SkillLevel,
        frameworkIdFromParent?: string
    ) => {
        const frameworkId =
            frameworkIdFromParent ?? skill.frameworkId ?? skill.targetFramework ?? '';

        if (!frameworkId) {
            return;
        }

        const normalizedSkill: SkillFrameworkNode = {
            ...skill,
            frameworkId,
            targetFramework: skill.targetFramework ?? frameworkId,
        };

        if (onAddSkill) {
            onAddSkill(normalizedSkill, proficiencyLevel);
            return;
        }

        if (!skill.id) {
            return;
        }

        handleToggleSelect(frameworkId, skill.id, proficiencyLevel);
    };

    const handleEditSkillInSelection = (
        frameworkId: string,
        skillId: string,
        proficiencyLevel: SkillLevel
    ) => {
        if (onEditSkill) {
            onEditSkill(frameworkId, skillId, proficiencyLevel);
            return;
        }

        handleChangeProficiency(frameworkId, skillId, proficiencyLevel);
    };

    const handleRemoveSkillFromSelection = (frameworkId: string, skillId: string) => {
        if (onRemoveSkill) {
            onRemoveSkill(frameworkId, skillId);
            return;
        }

        handleToggleSelect(frameworkId, skillId);
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

    const totalSemanticSearchResults = semanticSearchSkillsData?.records?.length ?? 0;
    const showSkillSuggestionPrompt =
        showSuggestSkill &&
        !!debouncedSearchInput?.trim() &&
        !semanticLoading &&
        totalSemanticSearchResults === 0;

    return (
        <div className={`flex flex-col gap-[20px] ${className}`}>
            {!hasGlobalFrameworks && (
                <GenericErrorView errorMessage="No skill frameworks configured" />
            )}

            {hasGlobalFrameworks && (
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
                                maxlength={MAX_SEARCH_LENGTH}
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
                                            {selectedSkillsBySemanticScore.map(skill => (
                                                <SwiperSlide
                                                    key={`${skill.frameworkId}-${skill.id}`}
                                                    style={{ width: 'auto' }}
                                                >
                                                    <SkillTag
                                                        skillId={skill.id}
                                                        frameworkId={skill.frameworkId}
                                                        proficiencyLevel={skill.proficiency}
                                                        handleRemoveSkill={() =>
                                                            handleRemoveSkillFromSelection(
                                                                skill.frameworkId,
                                                                skill.id
                                                            )
                                                        }
                                                        handleEditSkill={proficiencyLevel =>
                                                            handleEditSkillInSelection(
                                                                skill.frameworkId,
                                                                skill.id,
                                                                proficiencyLevel
                                                            )
                                                        }
                                                        disabled={isSavingSkills}
                                                        selectedSkills={
                                                            selectedSkillsBySemanticScore
                                                        }
                                                        handleAddRelatedSkill={
                                                            handleAddSkillToSelection
                                                        }
                                                        handleEditRelatedSkill={(
                                                            skillId,
                                                            proficiencyLevel
                                                        ) =>
                                                            handleEditSkillInSelection(
                                                                skill.frameworkId,
                                                                skillId,
                                                                proficiencyLevel
                                                            )
                                                        }
                                                        handleRemoveRelatedSkill={skillId =>
                                                            handleRemoveSkillFromSelection(
                                                                skill.frameworkId,
                                                                skillId
                                                            )
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
                                        {selectedSkillsBySemanticScore.map(skill => (
                                            <SkillTag
                                                key={`${skill.frameworkId}-${skill.id}`}
                                                skillId={skill.id}
                                                frameworkId={skill.frameworkId}
                                                proficiencyLevel={skill.proficiency}
                                                handleRemoveSkill={() =>
                                                    handleRemoveSkillFromSelection(
                                                        skill.frameworkId,
                                                        skill.id
                                                    )
                                                }
                                                handleEditSkill={proficiencyLevel =>
                                                    handleEditSkillInSelection(
                                                        skill.frameworkId,
                                                        skill.id,
                                                        proficiencyLevel
                                                    )
                                                }
                                                disabled={isSavingSkills}
                                                selectedSkills={selectedSkills}
                                                handleAddRelatedSkill={handleAddSkillToSelection}
                                                handleEditRelatedSkill={(
                                                    skillId,
                                                    proficiencyLevel
                                                ) =>
                                                    handleEditSkillInSelection(
                                                        skill.frameworkId,
                                                        skillId,
                                                        proficiencyLevel
                                                    )
                                                }
                                                handleRemoveRelatedSkill={skillId =>
                                                    handleRemoveSkillFromSelection(
                                                        skill.frameworkId,
                                                        skillId
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {showSuggestSkill &&
                        globalSkillFrameworks.map(framework => (
                            <SkillSearchFrameworkSection
                                key={framework.frameworkId}
                                framework={framework}
                                selectedSkills={selectedSkillsBySemanticScore}
                                searchInput={searchInput ?? ''}
                                isSavingSkills={isSavingSkills}
                                boostSkills={sasBoostSkills ?? []}
                                onAddSkill={handleAddSkillToSelection}
                                onEditSkill={handleEditSkillInSelection}
                                onRemoveSkill={handleRemoveSkillFromSelection}
                            />
                        ))}

                    {showSkillSuggestionPrompt && (
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
                </>
            )}
        </div>
    );
};

export default SkillSearchSelector;
