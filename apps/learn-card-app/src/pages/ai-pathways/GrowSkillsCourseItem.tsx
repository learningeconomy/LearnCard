import React, { useRef } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { CalendarClock, ChevronRight } from 'lucide-react';

import careerOneStopLogo from '../../assets/images/career-one-stop-logo.png';
import AiPathwaySchoolProgramDetails from './ai-pathway-courses/AiPathwaySchoolProgramDetails';

import {
    useModal,
    ModalTypes,
    useSemanticSearchSkills,
    conditionalPluralize,
} from 'learn-card-base';
import { TrainingProgram } from 'learn-card-base/types/careerOneStop';
import { getProgramLengthDisplay } from './ai-pathway-courses/ai-pathway-courses.helpers';
import { ThickStudiesIconWithShape } from 'learn-card-base/svgs/wallet/StudiesIcon';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';

type GrowSkillsCourseItemProps = {
    program: TrainingProgram;
};

const GrowSkillsCourseItem: React.FC<GrowSkillsCourseItemProps> = ({ program }) => {
    const flags = useFlags();
    const { newModal } = useModal();

    const programLengthDisplay = getProgramLengthDisplay(program);

    const frameworkId = flags?.selfAssignedSkillsFrameworkId;
    const searchQuery = program?.ProgramName;
    const { data: semanticSearchSkillsData } = useSemanticSearchSkills(searchQuery, frameworkId, {
        limit: 25,
    });

    const skills = semanticSearchSkillsData?.records || [];

    console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
    console.log('semanticSearchSkillsData:', semanticSearchSkillsData);
    console.log('skills:', skills);

    const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = useRef(false);

    const dragThreshold = 8;

    const openCourseDetailsModal = () => {
        newModal(<AiPathwaySchoolProgramDetails program={program} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        pointerStartRef.current = {
            x: event.clientX,
            y: event.clientY,
        };
        hasDraggedRef.current = false;
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerStartRef.current) return;

        const deltaX = Math.abs(event.clientX - pointerStartRef.current.x);
        const deltaY = Math.abs(event.clientY - pointerStartRef.current.y);

        if (deltaX > dragThreshold || deltaY > dragThreshold) {
            hasDraggedRef.current = true;
        }
    };

    const handlePointerUp = () => {
        pointerStartRef.current = null;
    };

    const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!hasDraggedRef.current) return;

        event.preventDefault();
        event.stopPropagation();
        hasDraggedRef.current = false;
    };

    const schoolImage = program?.school?.image_url;
    const logo = schoolImage ? schoolImage : careerOneStopLogo;

    return (
        <div
            role="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClickCapture={handleClickCapture}
            onClick={openCourseDetailsModal}
            className="w-full h-full flex flex-col rounded-[15px] bg-white shadow-bottom-4-4 overflow-hidden cursor-pointer border-b-[3px] border-emerald-500 text-left"
        >
            <div className="px-[15px] py-[20px] flex flex-col gap-[5px] h-full">
                <div className="flex items-start gap-[10px]">
                    <ThickStudiesIconWithShape className="w-[35px] h-[35px] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[17px] font-poppins font-[600] text-grayscale-900 leading-[24px] tracking-[0.25px] line-clamp-2 text-left">
                            {program?.ProgramName}
                        </h3>
                    </div>
                    <ChevronRight className="w-[20px] h-[20px] text-grayscale-700 flex-shrink-0" />
                </div>

                <div className="flex gap-[10px]">
                    <div className="flex flex-col gap-[5px]">
                        <p className="text-[14px] text-grayscale-600 font-notoSans text-left">
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
                        className="!w-[40px] !h-[40px] rounded-full object-contain shrink-0 ml-auto"
                    />
                </div>

                {skills.length > 0 && (
                    <div className="pt-[10px] mt-auto flex flex-col gap-[5px]">
                        <p className="text-[14px] text-grayscale-600 font-bold leading-[14px] tracking-[0.32px]">
                            {conditionalPluralize(skills.length, 'Skill')}
                        </p>

                        <div className="flex gap-[5px] min-w-0">
                            <span className="min-w-0 w-fit max-w-full text-[13px] px-[10px] py-[5px] text-grayscale-900 font-poppins bg-violet-50 rounded-[40px] inline-flex gap-[5px] items-center leading-[130%] font-bold overflow-hidden">
                                <CompetencyIcon icon={skills[0]?.icon} size="x-small" />
                                <span className="min-w-0 truncate">{skills[0]?.statement}</span>
                            </span>
                            {skills.length > 1 && (
                                <span className="text-[13px] px-[10px] py-[5px] text-grayscale-900 font-poppins bg-violet-50 rounded-[40px] flex gap-[5px] items-center leading-[130%] font-bold shrink-0">
                                    +{skills.length - 1}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrowSkillsCourseItem;
