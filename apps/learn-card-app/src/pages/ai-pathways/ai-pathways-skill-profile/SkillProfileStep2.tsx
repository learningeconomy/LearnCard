import React, { useState } from 'react';
import { TextInput, TextArea, Toggle, useDeviceTypeByWidth } from 'learn-card-base';
// import Plus from 'learn-card-base/svgs/Plus';
// import MapPin from 'learn-card-base/svgs/MapPin';
import DatePickerInput from 'src/components/date-picker/DatePickerInput';
import Plus from 'src/components/svgs/Plus';
import { MapPin } from 'lucide-react';

type SkillProfileStep2Props = {
    handleNext: () => void;
    handleBack: () => void;
};

type WorkExperience = {
    jobTitle: string;
    isCurrentJob: boolean;
    jobSummary: string;
    employer: string;
    jobLocation: string;
    workFromHome: boolean;
    startDate: string;
    endDate: string;
};

const emptyExperience: WorkExperience = {
    jobTitle: '',
    isCurrentJob: false,
    jobSummary: '',
    employer: '',
    jobLocation: '',
    workFromHome: false,
    startDate: '',
    endDate: '',
};

const SkillProfileStep2: React.FC<SkillProfileStep2Props> = ({ handleNext, handleBack }) => {
    const { isMobile } = useDeviceTypeByWidth();
    const [experiences, setExperiences] = useState<WorkExperience[]>([{ ...emptyExperience }]);

    const updateExperience = (index: number, field: keyof WorkExperience, value: any) => {
        setExperiences(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addExperience = () => {
        setExperiences(prev => [...prev, { ...emptyExperience }]);
    };

    return (
        <div className="flex flex-col gap-[20px]">
            <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                What is your most recent work experience?
            </h3>

            {experiences.map((experience, index) => (
                <div key={index} className="flex flex-col gap-[15px]">
                    {index > 0 && <hr className="border-grayscale-200" />}

                    <div className="flex flex-col gap-[10px]">
                        <div className="flex items-center justify-between">
                            <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                                Job Title
                            </span>
                            <Toggle
                                checked={experience.isCurrentJob}
                                onChange={checked =>
                                    updateExperience(index, 'isCurrentJob', checked)
                                }
                                label="Current Job"
                                labelPosition="left"
                                size="sm"
                            />
                        </div>
                        <TextInput
                            value={experience.jobTitle}
                            onChange={value => updateExperience(index, 'jobTitle', value ?? '')}
                            placeholder="What is your job title?"
                        />
                    </div>

                    <div className="flex flex-col gap-[10px]">
                        <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                            Job Summary
                        </span>
                        <TextArea
                            value={experience.jobSummary}
                            onChange={value => updateExperience(index, 'jobSummary', value ?? '')}
                            placeholder="What do you do?"
                            rows={2}
                        />
                    </div>

                    <div className="flex flex-col gap-[10px]">
                        <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                            Employer
                        </span>
                        <TextInput
                            value={experience.employer}
                            onChange={value => updateExperience(index, 'employer', value ?? '')}
                            placeholder="Who do you work for?"
                        />
                    </div>

                    <div className="flex flex-col gap-[10px]">
                        <div className="flex items-center justify-between">
                            <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                                Job Location
                            </span>
                            <Toggle
                                checked={experience.workFromHome}
                                onChange={checked =>
                                    updateExperience(index, 'workFromHome', checked)
                                }
                                label="Work from home"
                                labelPosition="left"
                                size="sm"
                            />
                        </div>
                        <TextInput
                            value={experience.jobLocation}
                            onChange={value => updateExperience(index, 'jobLocation', value ?? '')}
                            placeholder="Where is this job located?"
                            disabled={experience.workFromHome}
                            endIcon={<MapPin className="w-[20px] h-[20px] text-grayscale-500" />}
                        />
                    </div>

                    <div className="flex gap-[10px]">
                        <div className="flex flex-col gap-[10px] flex-1">
                            <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                                Start Date
                            </span>
                            <DatePickerInput
                                value={experience.startDate}
                                onChange={date => updateExperience(index, 'startDate', date)}
                                isMobile={isMobile}
                                label="Month, Year"
                            />
                        </div>
                        <div className="flex flex-col gap-[10px] flex-1">
                            <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                                End Date
                            </span>
                            {experience.isCurrentJob ? (
                                <div className="bg-grayscale-100 rounded-[15px] px-[16px] py-[16px] text-grayscale-900 font-poppins text-[14px]">
                                    Present
                                </div>
                            ) : (
                                <DatePickerInput
                                    value={experience.endDate}
                                    onChange={date => updateExperience(index, 'endDate', date)}
                                    isMobile={isMobile}
                                    label="Month, Year"
                                    minDate={experience.startDate || undefined}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-[10px]">
                        <div className="flex items-center justify-between">
                            <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                                Attach Skills
                            </span>
                            <button type="button" className="text-grayscale-600">
                                <Plus className="w-[20px] h-[20px]" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addExperience}
                className="bg-cyan-700 text-white rounded-full px-[20px] py-[10px] text-[17px] font-bold leading-[24px] tracking-[0.25px] h-[44px] flex items-center justify-center gap-[8px]"
            >
                Add Experience
                <Plus className="w-[20px] h-[20px]" />
            </button>

            <div className="flex gap-[10px] w-full">
                <button
                    className="bg-grayscale-50 text-grayscale-800 rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 border-[1px] border-solid border-grayscale-200 h-[44px]"
                    onClick={handleBack}
                >
                    Back
                </button>
                <button
                    className="bg-emerald-500 text-white rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 h-[44px]"
                    onClick={handleNext}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default SkillProfileStep2;
