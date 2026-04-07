import React from 'react';
import { CalendarClock, ChevronRight } from 'lucide-react';

import careerOneStopLogo from '../../assets/images/career-one-stop-logo.png';
import timeMachineIcon from '../../assets/images/time-machine.icon.png';
import AiPathwaySchoolProgramDetails from './ai-pathway-courses/AiPathwaySchoolProgramDetails';

import { useModal, ModalTypes } from 'learn-card-base';
import { TrainingProgram } from 'learn-card-base/types/careerOneStop';
import { getProgramLengthDisplay } from './ai-pathway-courses/ai-pathway-courses.helpers';
import { ThickStudiesIconWithShape } from 'learn-card-base/svgs/wallet/StudiesIcon';

type GrowSkillsCourseItemProps = {
    program: TrainingProgram;
};

const GrowSkillsCourseItem: React.FC<GrowSkillsCourseItemProps> = ({ program }) => {
    const { newModal } = useModal();
    const programLengthDisplay = getProgramLengthDisplay(program);

    const openCourseDetailsModal = () => {
        newModal(<AiPathwaySchoolProgramDetails program={program} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    const schoolImage = program?.school?.image_url;
    const logo = schoolImage ? schoolImage : careerOneStopLogo;

    return (
        <div
            role="button"
            onClick={openCourseDetailsModal}
            className="w-full flex flex-col rounded-[15px] bg-white shadow-bottom-4-4 overflow-hidden cursor-pointer border-b-[3px] border-emerald-500"
        >
            <div className="px-[15px] py-[20px] flex flex-col gap-[5px]">
                <div className="flex items-start gap-[10px]">
                    <ThickStudiesIconWithShape className="w-[35px] h-[35px] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[17px] font-poppins font-[600] text-grayscale-900 leading-[24px] tracking-[0.25px] line-clamp-2">
                            {program?.ProgramName}
                        </h3>
                    </div>
                    <ChevronRight className="w-[20px] h-[20px] text-grayscale-700 flex-shrink-0" />
                </div>

                <div className="flex gap-[10px]">
                    <div className="flex flex-col gap-[5px]">
                        <p className="text-[14px] text-grayscale-600 font-notoSans">
                            {program?.SchoolName}
                        </p>
                        {programLengthDisplay && (
                            <div className="flex items-center gap-[5px]">
                                <CalendarClock className="w-[20px] h-[20px] text-grayscale-700 flex-shrink-0" />
                                <span className="text-[13px] text-grayscale-600 font-bold font-poppins capitalize">
                                    {programLengthDisplay}
                                </span>
                            </div>
                        )}
                    </div>

                    <img
                        src={logo}
                        alt={program?.SchoolName || 'Institution'}
                        className="w-[40px] h-[40px] rounded-full object-contain flex-shrink-0 ml-auto"
                    />
                </div>

                <div className="pt-[10px]">
                    <p className="text-[13px] text-grayscale-500 italic">Skills TODO</p>
                </div>
            </div>
        </div>
    );
};

export default GrowSkillsCourseItem;
