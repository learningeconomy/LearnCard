import React, { useState } from 'react';

import {
    TextInput,
    conditionalPluralize,
    useGetBoostSkills,
    useGetSelfAssignedSkillsBoost,
    useModal,
    useVerifiableData,
} from 'learn-card-base';

import { X } from 'lucide-react';
import Search from 'learn-card-base/svgs/Search';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import { ExperiencesIconSolid } from 'learn-card-base/svgs/wallet/ExperiencesIcon';
import { AiPathwaysIconWithShape } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';
import Pencil from 'src/components/svgs/Pencil';
import SkillTag from '../skills/SkillTag';
import {
    SKILL_PROFILE_GOALS_KEY,
    SkillProfileGoalsData,
} from './ai-pathways-skill-profile/SkillProfileStep1';

type ExplorePathwaysModalProps = { initialSearchQuery?: string };

const ExplorePathwaysModal: React.FC<ExplorePathwaysModalProps> = ({ initialSearchQuery = '' }) => {
    const { closeModal } = useModal();

    const [search, setSearch] = useState(initialSearchQuery);

    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills } = useGetBoostSkills(sasBoostData?.uri);

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

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden text-grayscale-900">
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

                <TextInput
                    placeholder="Search by skill, goal, or job..."
                    value={search}
                    onChange={setSearch}
                    startIcon={<Search className="text-grayscale-900 w-[25px] h-[25px]" />}
                    endIcon={
                        search ? (
                            <button onClick={() => setSearch('')}>
                                <X className="text-grayscale-500 h-[25px] w-[25px]" />
                            </button>
                        ) : undefined
                    }
                />
            </div>

            {/* {isUpdating && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-30">
                    <IonSpinner color="dark" name="crescent" />
                </div>
            )} */}

            <section className="h-full pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0 relative">
                {sasBoostSkills?.length > 0 && (
                    <div className="flex flex-col gap-[10px] border-b-[1px] border-grayscale-200 border-solid pb-[15px]">
                        <h4 className="flex gap-[15px] items-center text-grayscale-900 font-poppins text-[17px] font-bold">
                            {conditionalPluralize(sasBoostSkills.length, 'Skill')}

                            <div className="flex items-center gap-[15px] ml-auto">
                                {sasBoostSkills.length > 3 && (
                                    <button className="text-grayscale-600 text-[14px] font-bold">
                                        View All
                                    </button>
                                )}
                                <button>
                                    <Pencil className="text-grayscale-700 h-[30px] w-[30px]" />
                                </button>
                            </div>
                        </h4>

                        {/* TODO Swiper probably */}
                        <div className="flex gap-[10px] overflow-x-auto">
                            {sasBoostSkills.map(skill => (
                                <SkillTag
                                    key={skill.id}
                                    skillId={skill.id}
                                    frameworkId={skill.frameworkId}
                                    proficiencyLevel={skill.proficiencyLevel}
                                    // handleRemoveSkill={() => handleToggleSelect(skill.id)}
                                    // handleEditSkill={proficiencyLevel =>
                                    //     handleChangeProficiency(skill.id, proficiencyLevel)
                                    // }
                                    selectedSkills={sasBoostSkills}
                                    // handleAddRelatedSkill={handleAddRelatedSkill}
                                    // handleEditRelatedSkill={handleEditRelatedSkill}
                                    // handleRemoveRelatedSkill={handleRemoveRelatedSkill}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-[10px] border-b-[1px] border-grayscale-200 border-solid pb-[15px] pt-[15px]">
                    <h4 className="flex gap-[15px] items-center text-grayscale-900 font-poppins text-[17px] font-bold">
                        {conditionalPluralize(goals.length, 'Goal')}

                        <div className="flex items-center gap-[15px] ml-auto">
                            {goals.length > 3 && (
                                <button className="text-grayscale-600 text-[14px] font-bold">
                                    View All
                                </button>
                            )}
                            <button>
                                <Pencil className="text-grayscale-700 h-[30px] w-[30px]" />
                            </button>
                        </div>
                    </h4>

                    {/* TODO Swiper probably */}
                    <div className="flex gap-[10px] overflow-x-auto">
                        {goals.map((goal, index) => (
                            <span
                                key={index}
                                className="flex items-center gap-[8px] border-solid border-[2px] border-sky-600 bg-sky-50 pl-[15px] pr-[10px] py-[7px] rounded-full text-sky-600 font-poppins text-[13px] font-bold leading-[18px]"
                            >
                                {goal}
                                <button
                                    type="button"
                                    onClick={() => console.log('remove goal', index)}
                                >
                                    <X className="w-[15px] h-[15px]" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="w-full flex justify-center bg-opacity-70 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white">
                <div className="w-full flex flex-col items-center justify-center gap-[10px] max-w-[600px]">
                    <button
                        onClick={closeModal}
                        className="w-full bg-violet-500 text-white font-bold flex items-center justify-center gap-[5px] py-[7px] px-[15px] rounded-[30px] shadow-bottom-3-4 font-poppins text-[17px] leading-[24px] tracking-[0.25px]"
                    >
                        <PuzzlePiece className="w-[30px] h-[30px]" version="filled" />
                        Grow Skills
                    </button>

                    <button
                        onClick={closeModal}
                        className="w-full bg-cyan-501 text-white font-bold flex items-center justify-center gap-[5px] py-[7px] px-[15px] rounded-[30px] shadow-bottom-3-4 font-poppins text-[17px] leading-[24px] tracking-[0.25px]"
                    >
                        <ExperiencesIconSolid inverseColors className="w-[30px] h-[30px]" />
                        Explore Roles
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default ExplorePathwaysModal;
