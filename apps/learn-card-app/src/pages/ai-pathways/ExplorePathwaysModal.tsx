import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import {
    conditionalPluralize,
    useGetBoostSkills,
    useGetSelfAssignedSkillsBoost,
    useManageSelfAssignedSkillsBoost,
    useSemanticSearchSkills,
    useModal,
    useToast,
    ToastTypeEnum,
    useVerifiableData,
    ModalTypes,
} from 'learn-card-base';

import { Plus, X } from 'lucide-react';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import { ExperiencesIconSolid } from 'learn-card-base/svgs/wallet/ExperiencesIcon';
import { AiPathwaysIconWithShape } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';
import SlimCaretLeft from 'src/components/svgs/SlimCaretLeft';
import SlimCaretRight from 'src/components/svgs/SlimCaretRight';
import Pencil from 'src/components/svgs/Pencil';
import SkillTag from '../skills/SkillTag';
import SkillSearchSelector from '../skills/SkillSearchSelector';
import {
    SKILL_PROFILE_GOALS_KEY,
    SkillProfileGoalsData,
} from './ai-pathways-skill-profile/SkillProfileStep1';
import { IonSpinner } from '@ionic/react';
import type { SelectedSkill } from '../skills/skillTypes';
import SelfAssignSkillsModal from '../skills/SelfAssignSkillsModal';
import EditGoalsModal from './EditGoalsModal';
import { SkillFrameworkNode } from '../../components/boost/boost';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { AiPathwaysWhatWouldYouLikeToDoCardOptions } from './ai-pathways-what-would-you-like-to-do/AiPathwaysWhatWouldYouLikeToDoCard';
import PathwaySearchInput from './ai-pathways-what-would-you-like-to-do/PathwaySearchInput';
import ExploreRoles from './ExploreRoles';

type SemanticSkillRecord = {
    id: string;
    score?: number;
};

export type ExplorePathwaysModalProps = {
    initialSearchQuery?: string;
    option?: AiPathwaysWhatWouldYouLikeToDoCardOptions;
};

const ExplorePathwaysModal: React.FC<ExplorePathwaysModalProps> = ({
    initialSearchQuery = '',
    option = undefined,
}) => {
    const { newModal, closeModal } = useModal();
    const { presentToast } = useToast();
    const flags = useFlags();

    const [search, setSearch] = useState(initialSearchQuery);
    const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
    const skillsSwiperRef = useRef<any>(null);
    const goalsSwiperRef = useRef<any>(null);
    const [skillsAtBeginning, setSkillsAtBeginning] = useState(true);
    const [skillsAtEnd, setSkillsAtEnd] = useState(false);
    const [skillsExpanded, setSkillsExpanded] = useState(false);
    const [goalsAtBeginning, setGoalsAtBeginning] = useState(true);
    const [goalsAtEnd, setGoalsAtEnd] = useState(false);
    const [goalsExpanded, setGoalsExpanded] = useState(false);

    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills, isLoading: sasBoostSkillsLoading } = useGetBoostSkills(
        sasBoostData?.uri
    );
    const { mutateAsync: saveSkills, isPending: skillsSaving } = useManageSelfAssignedSkillsBoost();

    const frameworkId = flags?.selfAssignedSkillsFrameworkId;
    const searchQuery = search.trim();
    const hasSearchQuery = Boolean(searchQuery);

    const { data: semanticSearchSkillsData } = useSemanticSearchSkills(searchQuery, frameworkId, {
        limit: 25,
    });

    const {
        data: goalsData,
        isLoading: goalsLoading,
        saveIfChanged: saveGoals,
        isSaving: goalsSaving,
    } = useVerifiableData<SkillProfileGoalsData>(SKILL_PROFILE_GOALS_KEY, {
        name: 'Career Goals',
        description: 'Self-reported career goals and aspirations',
    });

    const goals = goalsData?.goals ?? [];

    const selectedSkillsBySemanticScore = useMemo(() => {
        if (!hasSearchQuery) {
            return selectedSkills;
        }

        const scoreBySkillId = new Map<string, number>(
            semanticSearchSkillsData?.records?.map((skill: SemanticSkillRecord) => [
                skill.id,
                skill.score ?? 0,
            ]) ?? []
        );

        return [...selectedSkills].sort(
            (left, right) =>
                (scoreBySkillId.get(right.id) ?? 0) - (scoreBySkillId.get(left.id) ?? 0)
        );
    }, [hasSearchQuery, searchQuery, selectedSkills, semanticSearchSkillsData?.records]);

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

    const persistSkills = async (nextSkills: SelectedSkill[]) => {
        const previousSkills = selectedSkills;
        setSelectedSkills(nextSkills);

        try {
            await saveSkills({
                skills: nextSkills.map(skill => ({
                    frameworkId,
                    id: skill.id,
                    proficiencyLevel: skill.proficiency,
                })),
            });
        } catch (error: any) {
            console.error('Error creating or updating skills:', error);
            setSelectedSkills(previousSkills);
            presentToast(`Error saving skills!${error?.message ? ` ${error?.message}` : ''}`, {
                type: ToastTypeEnum.Error,
            });
        }
    };

    const handleAddSkill = async (skill: SkillFrameworkNode, proficiencyLevel: number) => {
        if (!skill.id) return;

        await persistSkills([
            ...selectedSkills.filter(selected => selected.id !== skill.id),
            { id: skill.id, proficiency: proficiencyLevel },
        ]);
    };

    const handleEditSkill = async (skillId: string, proficiencyLevel: number) => {
        await persistSkills(
            selectedSkills.map(skill =>
                skill.id === skillId ? { ...skill, proficiency: proficiencyLevel } : skill
            )
        );
    };

    const handleRemoveSkill = async (skillId: string) => {
        await persistSkills(selectedSkills.filter(skill => skill.id !== skillId));
    };

    const openSelfAssignSkillsModal = () => {
        newModal(<SelfAssignSkillsModal />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    const openEditGoalsModal = () => {
        newModal(
            <EditGoalsModal />,
            { sectionClassName: '!bg-transparent' },
            {
                desktop: ModalTypes.Right,
                mobile: ModalTypes.Right,
            }
        );
    };

    const persistGoals = async (nextGoals: string[]) => {
        try {
            await saveGoals({ goals: nextGoals });
        } catch (error: any) {
            console.error('Error creating or updating goals:', error);
            presentToast(`Error saving goals!${error?.message ? ` ${error?.message}` : ''}`, {
                type: ToastTypeEnum.Error,
            });
        }
    };

    const handleRemoveGoal = async (goalIndex: number) => {
        await persistGoals(goals.filter((_, index) => index !== goalIndex));
    };

    const handleSwiperUpdate = (swiper: any, setAtBeginning: any, setAtEnd: any) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    useEffect(() => {
        if (skillsSwiperRef.current) {
            skillsSwiperRef.current.update();
            handleSwiperUpdate(skillsSwiperRef.current, setSkillsAtBeginning, setSkillsAtEnd);
        }
    }, [selectedSkills.length]);

    useEffect(() => {
        if (goalsSwiperRef.current) {
            goalsSwiperRef.current.update();
            handleSwiperUpdate(goalsSwiperRef.current, setGoalsAtBeginning, setGoalsAtEnd);
        }
    }, [goals.length]);

    const showSkillsViewToggle = skillsExpanded || !skillsAtBeginning || !skillsAtEnd;
    const showGoalsViewToggle = goalsExpanded || !goalsAtBeginning || !goalsAtEnd;

    const showAllOptions = option === undefined;
    const showGrowSkillsButton = option === AiPathwaysWhatWouldYouLikeToDoCardOptions.GrowSkills;
    const showExploreRolesButton = option === AiPathwaysWhatWouldYouLikeToDoCardOptions.FindRoles;

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden text-grayscale-900 flex flex-col">
            <div className="px-[15px] py-[20px] bg-white safe-area-top-margin flex flex-col gap-[15px] z-20 relative shadow-bottom-1-5 rounded-b-[20px]">
                <div className="flex items-center gap-[10px] text-grayscale-900">
                    <AiPathwaysIconWithShape className="w-[50px] h-[50px]" />
                    <h5 className="text-[21px] font-poppins font-[600] leading-[24px]">
                        Explore Pathways
                    </h5>
                </div>
                <button onClick={closeModal} className="absolute top-[20px] right-[20px]">
                    <X />
                </button>

                <PathwaySearchInput
                    variant="simple"
                    placeholder="Search by skill, goal, or job..."
                    value={search}
                    onValueChange={setSearch}
                    onSearchSubmit={setSearch}
                />
            </div>

            {/* {isUpdating && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-30">
                    <IonSpinner color="dark" name="crescent" />
                </div>
            )} */}

            <section className="flex-1 min-h-0 pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0 relative">
                <div className="flex flex-col gap-[10px] border-b-[1px] border-grayscale-200 border-solid pb-[15px]">
                    <div className="flex flex-col gap-[10px] relative">
                        {skillsSaving && (
                            <div className="absolute inset-0 z-20 bg-white/70 rounded-[15px] flex items-center justify-center">
                                <IonSpinner color="dark" name="crescent" />
                            </div>
                        )}

                        {selectedSkills.length === 0 && !sasBoostSkillsLoading && (
                            <button
                                onClick={openSelfAssignSkillsModal}
                                className="flex items-center justify-center gap-[5px] py-[15px] text-grayscale-700 text-[17px] font-bold border-[1px] border-solid border-grayscale-200 rounded-[10px] bg-white"
                            >
                                Add Skills
                                <Plus className="h-[30px] w-[30px]" />
                            </button>
                        )}

                        {selectedSkills.length > 0 && (
                            <>
                                <h4 className="flex gap-[15px] items-center text-grayscale-900 font-poppins text-[17px] font-bold">
                                    {conditionalPluralize(selectedSkills.length, 'Skill')}

                                    <div className="flex items-center gap-[15px] ml-auto">
                                        {showSkillsViewToggle && (
                                            <button
                                                type="button"
                                                onClick={() => setSkillsExpanded(prev => !prev)}
                                                className="text-grayscale-600 text-[14px] font-bold"
                                            >
                                                {skillsExpanded ? 'View Less' : 'View All'}
                                            </button>
                                        )}
                                        <button
                                            onClick={openSelfAssignSkillsModal}
                                            disabled={skillsSaving}
                                        >
                                            <Pencil className="text-grayscale-700 h-[30px] w-[30px] disabled:opacity-60" />
                                        </button>
                                    </div>
                                </h4>

                                <div className="relative w-full overflow-hidden transition-all duration-300 ease-in-out">
                                    {!skillsExpanded ? (
                                        <>
                                            <Swiper
                                                onSwiper={swiper => {
                                                    skillsSwiperRef.current = swiper;
                                                    handleSwiperUpdate(
                                                        swiper,
                                                        setSkillsAtBeginning,
                                                        setSkillsAtEnd
                                                    );
                                                }}
                                                onResize={swiper =>
                                                    handleSwiperUpdate(
                                                        swiper,
                                                        setSkillsAtBeginning,
                                                        setSkillsAtEnd
                                                    )
                                                }
                                                onSlideChange={swiper =>
                                                    handleSwiperUpdate(
                                                        swiper,
                                                        setSkillsAtBeginning,
                                                        setSkillsAtEnd
                                                    )
                                                }
                                                onReachBeginning={() => setSkillsAtBeginning(true)}
                                                onFromEdge={() => {
                                                    if (skillsSwiperRef.current) {
                                                        setSkillsAtBeginning(
                                                            skillsSwiperRef.current.isBeginning
                                                        );
                                                        setSkillsAtEnd(
                                                            skillsSwiperRef.current.isEnd
                                                        );
                                                    }
                                                }}
                                                onReachEnd={() => setSkillsAtEnd(true)}
                                                spaceBetween={12}
                                                slidesPerView={'auto'}
                                                grabCursor={true}
                                            >
                                                {selectedSkillsBySemanticScore.map(skill => (
                                                    <SwiperSlide
                                                        key={skill.id}
                                                        style={{ width: 'auto' }}
                                                    >
                                                        <SkillTag
                                                            skillId={skill.id}
                                                            frameworkId={frameworkId}
                                                            proficiencyLevel={skill.proficiency}
                                                            handleRemoveSkill={() =>
                                                                handleRemoveSkill(skill.id)
                                                            }
                                                            handleEditSkill={proficiencyLevel =>
                                                                handleEditSkill(
                                                                    skill.id,
                                                                    proficiencyLevel
                                                                )
                                                            }
                                                            disabled={skillsSaving}
                                                            selectedSkills={
                                                                selectedSkillsBySemanticScore
                                                            }
                                                            handleAddRelatedSkill={handleAddSkill}
                                                            handleEditRelatedSkill={handleEditSkill}
                                                            handleRemoveRelatedSkill={
                                                                handleRemoveSkill
                                                            }
                                                        />
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>

                                            {!skillsAtBeginning && (
                                                <button
                                                    onClick={() => {
                                                        skillsSwiperRef.current?.slidePrev();
                                                    }}
                                                    className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                                                    style={{ opacity: 0.8 }}
                                                    disabled={skillsSaving}
                                                >
                                                    <SlimCaretLeft className="w-5 h-auto" />
                                                </button>
                                            )}

                                            {!skillsAtEnd && (
                                                <button
                                                    onClick={() => {
                                                        skillsSwiperRef.current?.slideNext();
                                                    }}
                                                    className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                                                    style={{ opacity: 0.8 }}
                                                    disabled={skillsSaving}
                                                >
                                                    <SlimCaretRight className="w-5 h-auto" />
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-[10px]">
                                            {selectedSkillsBySemanticScore.map(skill => (
                                                <SkillTag
                                                    key={skill.id}
                                                    skillId={skill.id}
                                                    frameworkId={
                                                        sasBoostSkills?.[0]?.frameworkId ?? ''
                                                    }
                                                    proficiencyLevel={skill.proficiency}
                                                    handleRemoveSkill={() =>
                                                        handleRemoveSkill(skill.id)
                                                    }
                                                    handleEditSkill={proficiencyLevel =>
                                                        handleEditSkill(skill.id, proficiencyLevel)
                                                    }
                                                    disabled={skillsSaving}
                                                    selectedSkills={selectedSkillsBySemanticScore}
                                                    handleAddRelatedSkill={handleAddSkill}
                                                    handleEditRelatedSkill={handleEditSkill}
                                                    handleRemoveRelatedSkill={handleRemoveSkill}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {sasBoostSkillsLoading && selectedSkills.length === 0 && (
                        <div className="flex items-center justify-center py-[15px]">
                            <IonSpinner color="dark" name="crescent" />
                        </div>
                    )}
                </div>

                <div className="relative flex flex-col gap-[10px] pb-[15px] pt-[15px]">
                    {goalsSaving && (
                        <div className="absolute inset-0 z-20 bg-white/70 rounded-[15px] flex items-center justify-center">
                            <IonSpinner color="dark" name="crescent" />
                        </div>
                    )}

                    {goals.length === 0 && !goalsLoading && (
                        <button
                            onClick={openEditGoalsModal}
                            className="flex items-center justify-center gap-[5px] py-[15px] text-grayscale-700 text-[17px] font-bold border-[1px] border-solid border-grayscale-200 rounded-[10px] bg-white"
                        >
                            Add Goals
                            <Plus className="h-[30px] w-[30px]" />
                        </button>
                    )}

                    {goalsLoading && (
                        <div className="flex items-center justify-center py-[15px]">
                            <IonSpinner color="dark" name="crescent" />
                        </div>
                    )}

                    {goals.length > 0 && (
                        <>
                            <h4 className="flex gap-[15px] items-center text-grayscale-900 font-poppins text-[17px] font-bold">
                                {conditionalPluralize(goals.length, 'Goal')}

                                <div className="flex items-center gap-[15px] ml-auto">
                                    {showGoalsViewToggle && (
                                        <button
                                            type="button"
                                            onClick={() => setGoalsExpanded(prev => !prev)}
                                            className="text-grayscale-600 text-[14px] font-bold"
                                        >
                                            {goalsExpanded ? 'View Less' : 'View All'}
                                        </button>
                                    )}
                                    <button onClick={openEditGoalsModal}>
                                        <Pencil className="text-grayscale-700 h-[30px] w-[30px]" />
                                    </button>
                                </div>
                            </h4>

                            <div className="relative w-full overflow-hidden transition-all duration-300 ease-in-out">
                                {!goalsExpanded ? (
                                    <>
                                        <Swiper
                                            onSwiper={swiper => {
                                                goalsSwiperRef.current = swiper;
                                                handleSwiperUpdate(
                                                    swiper,
                                                    setGoalsAtBeginning,
                                                    setGoalsAtEnd
                                                );
                                            }}
                                            onResize={swiper =>
                                                handleSwiperUpdate(
                                                    swiper,
                                                    setGoalsAtBeginning,
                                                    setGoalsAtEnd
                                                )
                                            }
                                            onSlideChange={swiper =>
                                                handleSwiperUpdate(
                                                    swiper,
                                                    setGoalsAtBeginning,
                                                    setGoalsAtEnd
                                                )
                                            }
                                            onReachBeginning={() => setGoalsAtBeginning(true)}
                                            onFromEdge={() => {
                                                if (goalsSwiperRef.current) {
                                                    setGoalsAtBeginning(
                                                        goalsSwiperRef.current.isBeginning
                                                    );
                                                    setGoalsAtEnd(goalsSwiperRef.current.isEnd);
                                                }
                                            }}
                                            onReachEnd={() => setGoalsAtEnd(true)}
                                            spaceBetween={12}
                                            slidesPerView={'auto'}
                                            grabCursor={true}
                                        >
                                            {goals.map((goal, index) => (
                                                <SwiperSlide key={index} style={{ width: 'auto' }}>
                                                    <span className="flex items-center gap-[8px] border-solid border-[2px] border-sky-600 bg-sky-50 pl-[15px] pr-[10px] py-[7px] rounded-full text-sky-600 font-poppins text-[13px] font-bold leading-[18px]">
                                                        {goal}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveGoal(index)}
                                                            disabled={goalsSaving}
                                                        >
                                                            <X className="w-[15px] h-[15px]" />
                                                        </button>
                                                    </span>
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>

                                        {!goalsAtBeginning && (
                                            <button
                                                onClick={() => {
                                                    goalsSwiperRef.current?.slidePrev();
                                                }}
                                                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                                                style={{ opacity: 0.8 }}
                                            >
                                                <SlimCaretLeft className="w-5 h-auto" />
                                            </button>
                                        )}

                                        {!goalsAtEnd && (
                                            <button
                                                onClick={() => {
                                                    goalsSwiperRef.current?.slideNext();
                                                }}
                                                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                                                style={{ opacity: 0.8 }}
                                            >
                                                <SlimCaretRight className="w-5 h-auto" />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-[10px]">
                                        {goals.map((goal, index) => (
                                            <span
                                                key={index}
                                                className="flex items-center gap-[8px] border-solid border-[2px] border-sky-600 bg-sky-50 pl-[15px] pr-[10px] py-[7px] rounded-full text-sky-600 font-poppins text-[13px] font-bold leading-[18px] w-fit"
                                            >
                                                {goal}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveGoal(index)}
                                                    disabled={goalsSaving}
                                                >
                                                    <X className="w-[15px] h-[15px]" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <SkillSearchSelector
                    selectedSkills={selectedSkillsBySemanticScore}
                    onSelectedSkillsChange={async (nextSkills: SelectedSkill[]) => {
                        await persistSkills(nextSkills);
                    }}
                    showSuggestSkill={true}
                    showSearchInput={false}
                    showSelectedSkills={false}
                    searchQuery={search}
                    onSearchQueryChange={setSearch}
                    isSavingSkills={skillsSaving}
                    onAddSkill={handleAddSkill}
                    onEditSkill={handleEditSkill}
                    onRemoveSkill={handleRemoveSkill}
                />
            </section>

            <footer className="w-full flex justify-center bg-opacity-70 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white">
                <div className="w-full flex flex-col items-center justify-center gap-[10px] max-w-[600px]">
                    {(showAllOptions || showGrowSkillsButton) && (
                        <button
                            onClick={closeModal}
                            className="w-full bg-violet-500 text-white font-bold flex items-center justify-center gap-[5px] py-[7px] px-[15px] rounded-[30px] shadow-bottom-3-4 font-poppins text-[17px] leading-[24px] tracking-[0.25px]"
                        >
                            <PuzzlePiece className="w-[30px] h-[30px]" version="filled" />
                            Grow Skills
                        </button>
                    )}

                    {(showAllOptions || showExploreRolesButton) && (
                        <button
                            onClick={() =>
                                newModal(
                                    <ExploreRoles initialSearchQuery={search.trim()} />,
                                    undefined,
                                    {
                                        desktop: ModalTypes.Right,
                                        mobile: ModalTypes.Right,
                                    }
                                )
                            }
                            className="w-full bg-cyan-501 text-white font-bold flex items-center justify-center gap-[5px] py-[7px] px-[15px] rounded-[30px] shadow-bottom-3-4 font-poppins text-[17px] leading-[24px] tracking-[0.25px]"
                        >
                            <ExperiencesIconSolid inverseColors className="w-[30px] h-[30px]" />
                            Explore Roles
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default ExplorePathwaysModal;
