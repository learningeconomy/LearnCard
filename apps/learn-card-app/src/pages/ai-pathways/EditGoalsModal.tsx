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
        <div className="relative h-full overflow-hidden text-grayscale-900 bg-grayscale-100 bg-opacity-10 backdrop-blur-[5px]">
            {/* <div className="absolute inset-0 bg-white/10" /> */}

            <section className="relative h-full px-[20px] flex flex-col justify-center">
                <div className="w-full max-w-[600px] mx-auto rounded-[15px] bg-white shadow-bottom-4-4 px-[15px] pb-[15px] pt-[30px] flex flex-col gap-[30px]">
                    <h3 className="text-[20px] font-poppins font-[700] leading-[24px] tracking-[0.24px] text-grayscale-900">
                        Manage your Goals
                    </h3>

                    <div className="flex flex-col gap-[10px]">
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
                            <div className="flex flex-wrap gap-[8px]">
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

            <footer className="absolute bottom-0 left-0 w-full p-[20px] bg-white/70 border-t-[1px] border-white border-solid">
                <div className="flex items-center gap-[10px] max-w-[600px] mx-auto">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="h-[44px] flex-1 rounded-full border-[1px] border-grayscale-200 border-solid bg-grayscale-50 text-grayscale-800 font-poppins text-[17px] leading-[24px] tracking-[0.25px]"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="h-[44px] flex-1 rounded-full bg-emerald-500 text-white font-poppins font-[700] text-[17px] leading-[24px] tracking-[0.25px] disabled:opacity-50"
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
