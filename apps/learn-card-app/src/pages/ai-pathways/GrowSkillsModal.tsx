import React, { useMemo } from 'react';

import {
    useOccupationDetailsForKeyword,
    useTrainingProgramsByKeyword,
} from 'learn-card-base/react-query/queries/careerOneStop';
import {
    filterCoursesByFieldOfStudy,
    normalizeSchoolPrograms,
} from './ai-pathway-courses/ai-pathway-courses.helpers';

import { X } from 'lucide-react';
import {
    ModalTypes,
    conditionalPluralize,
    useGetBoostSkills,
    useGetSelfAssignedSkillsBoost,
    useModal,
    useVerifiableData,
} from 'learn-card-base';
import { IonSpinner } from '@ionic/react';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import SelfAssignSkillsModal from '../skills/SelfAssignSkillsModal';
import EditGoalsModal from './EditGoalsModal';
import {
    SKILL_PROFILE_GOALS_KEY,
    SkillProfileGoalsData,
} from './ai-pathways-skill-profile/SkillProfileStep1';

type GrowSkillsModalProps = {};

const GrowSkillsModal: React.FC<GrowSkillsModalProps> = ({}) => {
    const { newModal, closeModal } = useModal();

    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills, isLoading: sasBoostSkillsLoading } = useGetBoostSkills(
        sasBoostData?.uri
    );

    const openSelfAssignSkillsModal = () => {
        newModal(<SelfAssignSkillsModal />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

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

    const fieldOfStudy = 'Computer Science';

    const { data: trainingPrograms, isLoading: fetchTrainingProgramsLoading } =
        useTrainingProgramsByKeyword({
            keywords: ['Software Developer'],
            fieldOfStudy,
        });

    const schoolPrograms = useMemo(() => {
        return trainingPrograms?.length ? normalizeSchoolPrograms(trainingPrograms) : [];
    }, [trainingPrograms]);

    const courses = useMemo(() => {
        return schoolPrograms?.length
            ? filterCoursesByFieldOfStudy(schoolPrograms, fieldOfStudy)
            : [];
    }, [schoolPrograms]);

    const { data: occupations, isLoading: fetchOccupationsLoading } =
        useOccupationDetailsForKeyword('Software Developer');

    const loading = false;

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden text-grayscale-900">
            <div className="px-[15px] py-[20px] bg-white safe-area-top-margin flex flex-col gap-[15px] z-20 relative shadow-bottom-1-5 rounded-b-[20px]">
                <div className="flex items-center gap-[10px] text-grayscale-900">
                    <SkillsIconWithShape className="w-[50px] h-[50px]" />
                    <h5 className="text-[21px] font-poppins font-[600] leading-[24px] flex flex-col gap-[5px]">
                        Grow your skills
                        <div className="text-[14px] font-poppins font-[600] text-grayscale-600 flex items-center gap-[5px]">
                            {conditionalPluralize(sasBoostSkills?.length || 0, 'Skill')}
                            <button
                                onClick={openSelfAssignSkillsModal}
                                className="text-indigo-500 bg-indigo-50 px-[5px] rounded-[5px]"
                            >
                                Edit
                            </button>

                            <span>•</span>

                            {conditionalPluralize(goals.length, 'Goal')}
                            <button
                                onClick={openEditGoalsModal}
                                className="text-indigo-500 bg-indigo-50 px-[5px] rounded-[5px]"
                            >
                                Edit
                            </button>
                        </div>
                    </h5>
                </div>
                <button onClick={closeModal} className="absolute top-[20px] right-[20px]">
                    <X />
                </button>
            </div>

            <section className="h-full pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0 relative">
                <div className="flex flex-col gap-[10px] border-b-[1px] border-grayscale-200 border-solid pb-[15px]">
                    <div className="flex flex-col gap-[10px] relative">
                        {loading && (
                            <div className="absolute inset-0 z-20 bg-white/70 rounded-[15px] flex items-center justify-center">
                                <IonSpinner color="dark" name="crescent" />
                            </div>
                        )}
                    </div>
                </div>
                Main content...
            </section>
        </div>
    );
};

export default GrowSkillsModal;
