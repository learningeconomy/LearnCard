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
import { useModal } from 'learn-card-base';
import { IonSpinner } from '@ionic/react';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';

type GrowSkillsModalProps = {};

const GrowSkillsModal: React.FC<GrowSkillsModalProps> = ({}) => {
    const { closeModal } = useModal();
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
                    <h5 className="text-[21px] font-poppins font-[600] leading-[24px]">
                        Grow your skills
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
