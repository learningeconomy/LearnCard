import { TextInput, useModal, useVerifiableData } from 'learn-card-base';
import React, { useEffect, useState } from 'react';
import {
    SKILL_PROFILE_GOALS_KEY,
    SkillProfileGoalsData,
} from './ai-pathways-skill-profile/SkillProfileStep1';
import { Plus, X } from 'lucide-react';

type EditGoalsModalProps = {};

const EditGoalsModal: React.FC<EditGoalsModalProps> = ({}) => {
    const { closeModal } = useModal();
    const [goalInput, setGoalInput] = useState('');
    const [goals, setGoals] = useState<string[]>([]);
    const {
        data: goalsData,
        isLoading: goalsLoading,
        saveIfChanged: saveGoals,
        isSaving: goalsSaving,
    } = useVerifiableData<SkillProfileGoalsData>(SKILL_PROFILE_GOALS_KEY, {
        name: 'Career Goals',
        description: 'Self-reported career goals and aspirations',
    });

    useEffect(() => {
        if (goalsData) {
            setGoals(goalsData.goals ?? []);
        }
    }, [goalsData]);

    const handleAddGoal = () => {
        const nextGoal = goalInput.trim();

        if (!nextGoal) {
            return;
        }

        setGoals([...goals, nextGoal.slice(0, 35)]);
        setGoalInput('');
    };

    const handleRemoveGoal = (index: number) => {
        setGoals(goals.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        await saveGoals({ goals });
        closeModal();
    };

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden text-grayscale-900">
            <div className="px-[15px] py-[20px] bg-white safe-area-top-margin flex flex-col gap-[15px] z-20 relative shadow-bottom-1-5 rounded-b-[20px]">
                <div className="flex items-center gap-[10px] text-grayscale-900">
                    <h5 className="text-[21px] font-poppins font-[600] leading-[24px]">
                        Edit Goals
                    </h5>
                </div>
                <button onClick={closeModal} className="absolute top-[20px] right-[20px]">
                    <X />
                </button>
            </div>

            <section className="h-full pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0 relative">
                <div className="flex flex-col gap-[20px]">
                    <div className="flex flex-col gap-[10px]">
                        <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                            Edit your goals
                        </h3>
                        <p className="text-[16px] text-grayscale-700 font-poppins leading-[130%]">
                            These goals help personalize your AI pathways.
                        </p>
                    </div>

                    <div className="flex flex-col gap-[10px]">
                        <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                            Goals
                        </span>

                        <TextInput
                            value={goalInput}
                            onChange={value => setGoalInput(value ?? '')}
                            placeholder="I want to..."
                            maxLength={35}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddGoal();
                                }
                            }}
                            endButton={
                                <button
                                    type="button"
                                    onClick={handleAddGoal}
                                    className="text-grayscale-600 hover:text-grayscale-700 rounded-[7px] p-[6px] bg-grayscale-200"
                                >
                                    <Plus className="w-[24px] h-[24px]" />
                                </button>
                            }
                        />

                        {goals.length > 0 && (
                            <div className="flex flex-wrap gap-[5px]">
                                {goals.map((goal, index) => (
                                    <span
                                        key={`${goal}-${index}`}
                                        className="flex items-center gap-[8px] border-solid border-[2px] border-sky-600 bg-sky-50 pl-[15px] pr-[10px] py-[7px] rounded-full text-sky-600 font-poppins text-[13px] font-bold leading-[18px]"
                                    >
                                        {goal}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveGoal(index)}
                                        >
                                            <X className="w-[15px] h-[15px]" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <footer className="w-full flex justify-center bg-opacity-70 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white">
                <div className="w-full flex flex-col items-center justify-center gap-[10px] max-w-[600px]">
                    <button
                        className="bg-emerald-500 text-white w-full rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] h-[44px] disabled:opacity-50"
                        onClick={handleSave}
                        disabled={goalsSaving || goalsLoading}
                    >
                        {goalsSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default EditGoalsModal;
