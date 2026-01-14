import React, { useMemo } from 'react';

import careerOneStopLogo from '../../../assets/images/career-one-stop-logo.png';
import timeMachineIcon from '../../../assets/images/time-machine.icon.png';
import AiPathwaySchoolProgramDetails from './AiPathwaySchoolProgramDetails';

import { useModal } from 'learn-card-base';

import { ModalTypes } from 'learn-card-base';
import { TrainingProgram } from 'learn-card-base/types/careerOneStop';

const AiPathwaySchoolProgramItem: React.FC<{ program: TrainingProgram }> = ({ program }) => {
    const { newModal } = useModal();

    const openCourseDetailsModal = () => {
        newModal(<AiPathwaySchoolProgramDetails program={program} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    const occupationTags = useMemo(() => {
        return program?.Occupationslist?.length
            ? [...program.Occupationslist]
                  .sort(() => Math.random() - 0.5)
                  .slice(0, 3)
                  .map(occupation => occupation.Value)
            : [];
    }, [program?.Occupationslist]);

    const schoolImage = program?.school?.image_url;

    const logo = schoolImage ? schoolImage : careerOneStopLogo;

    return (
        <div
            onClick={openCourseDetailsModal}
            className="w-full flex flex-col items-start justify-start px-4 py-2 gap-1 border-solid border-[1px] border-grayscale-200 rounded-xl"
        >
            <p className="text-indigo-500 font-normal text-sm line-clamp-1 font-notoSans uppercase text-left">
                {occupationTags.join(', ')}
            </p>
            <div className="w-full flex items-center justify-between">
                <h2 className="text-lg text-left font-semibold text-grayscale-800 line-clamp-2 w-[70%]">
                    {program?.ProgramName}
                </h2>
            </div>

            <p className="text-sm text-grayscale-600 font-notoSans">{program?.SchoolName}</p>

            <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="h-full flex items-start justify-start">
                        <img
                            src={timeMachineIcon}
                            alt="Time Machine"
                            className="w-5 h-5 object-contain"
                        />
                    </div>
                    <div className="flex flex-col items-start justify-end">
                        <span className="text-xs text-grayscale-700 font-medium text-left max-w-[90%]">
                            Total: {program?.ProgramLength?.[0]?.Value} to complete
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-1">
                    <img src={logo} alt="Edx Logo" className="w-12 h-12 object-contain" />
                </div>
            </div>
        </div>
    );
};

export default AiPathwaySchoolProgramItem;
