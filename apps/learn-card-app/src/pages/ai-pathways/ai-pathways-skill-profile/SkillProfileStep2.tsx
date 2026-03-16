import React, { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import {
    TextInput,
    TextArea,
    Checkbox,
    useDeviceTypeByWidth,
    useModal,
    ModalTypes,
    useGetCredentialList,
} from 'learn-card-base';
import GearPlusIcon from 'learn-card-base/svgs/GearPlusIcon';

import SelectFrameworkToManageModal from 'src/pages/SkillFrameworks/SelectFrameworkToManageModal';
import BrowseFrameworkPage from 'src/pages/SkillFrameworks/BrowseFrameworkPage';
import DatePickerInput from 'src/components/date-picker/DatePickerInput';
import CompetencyIcon from 'src/pages/SkillFrameworks/CompetencyIcon';
import BoostEarnedCard from 'src/components/boost/boost-earned-card/BoostEarnedCard';
import SlimCaretLeft from 'src/components/svgs/SlimCaretLeft';
import SlimCaretRight from 'src/components/svgs/SlimCaretRight';
import Plus from 'src/components/svgs/Plus';
import X from 'src/components/svgs/X';
import { MapPin } from 'lucide-react';

import { ExperiencesIconWithShape } from 'learn-card-base/svgs/wallet/ExperiencesIcon';

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
    const { newModal, closeModal } = useModal();
    const [experiences, setExperiences] = useState<WorkExperience[]>([{ ...emptyExperience }]);
    const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedCredentialUris, setSelectedCredentialUris] = useState<string[]>([]);

    const swiperRef = useRef<any>(null);
    const [atBeginning, setAtBeginning] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const { data: credentialPages, isLoading } = useGetCredentialList('Work History' as any);
    const records = credentialPages?.pages?.flatMap(page => page?.records ?? []) ?? [];
    const hasExistingCredentials = !isLoading && records.length > 0;

    const handleSwiperUpdate = (swiper: any) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    const handleAddExperience = async () => {
        // TODO: Implement credential issuance using experience data
        console.log('Issuing work history credential with data:', experiences[0]);
        // Stub: After issuing, return to credential slider view
        setShowForm(false);
        setExperiences([{ ...emptyExperience }]);
        setSelectedSkills([]);
    };

    const handleSelectCredential = (uri: string) => {
        setSelectedCredentialUris(prev =>
            prev.includes(uri) ? prev.filter(u => u !== uri) : [...prev, uri]
        );
    };

    const updateExperience = (index: number, field: keyof WorkExperience, value: any) => {
        setExperiences(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSelectSkills = () => {
        newModal(
            <SelectFrameworkToManageModal
                hideCreateFramework
                isBoostSkillSelection
                onFrameworkSelectOverride={framework => {
                    newModal(
                        <BrowseFrameworkPage
                            isSelectSkillsFlow
                            selectedSkills={selectedSkills}
                            setSelectedSkills={setSelectedSkills}
                            frameworkInfo={framework}
                            handleClose={closeModal}
                        />,
                        undefined,
                        {
                            desktop: ModalTypes.FullScreen,
                            mobile: ModalTypes.FullScreen,
                        }
                    );
                }}
            />,
            {
                sectionClassName: '!bg-transparent !shadow-none !overflow-visible',
            },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const handleRemoveSkill = (skill: any) => {
        setSelectedSkills(prev => prev.filter(s => s.id !== skill.id));
    };

    const shouldShowForm = showForm || !hasExistingCredentials;

    return (
        <div className="flex flex-col gap-[20px]">
            {hasExistingCredentials && shouldShowForm ? (
                <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px] flex flex-col gap-[10px] items-center">
                    <ExperiencesIconWithShape className="w-[60px] h-[60px]" />
                    New Work Experience
                </h3>
            ) : (
                <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                    {shouldShowForm
                        ? 'What is your most recent work experience?'
                        : 'Select your most recent work experience'}
                </h3>
            )}

            {isLoading && <p className="text-xs text-grayscale-400">Loading credentials…</p>}

            {!isLoading && !shouldShowForm && (
                <>
                    <div className="relative overflow-hidden">
                        <Swiper
                            onSwiper={swiper => {
                                swiperRef.current = swiper;
                                handleSwiperUpdate(swiper);
                            }}
                            onSlideChange={handleSwiperUpdate}
                            onReachBeginning={() => setAtBeginning(true)}
                            onFromEdge={() => {
                                if (swiperRef.current) {
                                    setAtBeginning(swiperRef.current.isBeginning);
                                    setAtEnd(swiperRef.current.isEnd);
                                }
                            }}
                            onReachEnd={() => setAtEnd(true)}
                            spaceBetween={12}
                            slidesPerView={'auto'}
                            grabCursor={true}
                            preventClicks={false}
                            preventClicksPropagation={false}
                            style={{ overflow: 'visible' }}
                        >
                            {records.map((record, index) => {
                                const isSelected = selectedCredentialUris.includes(record.uri);
                                const boostCategory = record.category as any;

                                return (
                                    <SwiperSlide
                                        key={record.uri ?? index}
                                        style={{ width: 'auto' }}
                                        className="cursor-pointer transition-opacity"
                                    >
                                        <BoostEarnedCard
                                            record={record}
                                            categoryType={boostCategory}
                                            sizeLg={12}
                                            sizeMd={12}
                                            sizeSm={12}
                                            showChecked
                                            initialCheckmarkState={isSelected}
                                            onCheckMarkClick={() =>
                                                handleSelectCredential(record.uri)
                                            }
                                            isInSkillsModal
                                            hideOptionsMenu
                                            className="!min-h-[310px]"
                                        />
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>

                        {!atBeginning && (
                            <button
                                onClick={() => swiperRef.current?.slidePrev()}
                                aria-label="Previous credential"
                                className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-[1101] shadow-md hover:bg-gray-200 transition-all duration-200"
                                style={{ opacity: 0.85 }}
                            >
                                <SlimCaretLeft className="w-5 h-auto" />
                            </button>
                        )}

                        {(!atBeginning || records.length > 2) && (
                            <button
                                onClick={() => swiperRef.current?.slideNext()}
                                aria-label="Next credential"
                                className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-[1101] shadow-md hover:bg-gray-200 transition-all duration-200"
                                style={{ opacity: atEnd ? 0.35 : 0.85 }}
                            >
                                <SlimCaretRight className="w-5 h-auto" />
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="bg-cyan-501 text-white rounded-full pl-[30px] pr-[10px] py-[7px] text-[15px] font-bold leading-[24px] tracking-[0.25px] h-[44px] flex items-center justify-center gap-[10px]"
                    >
                        New Work Experience
                        <GearPlusIcon className="w-[30px] h-[30px] text-cyan-601" />
                    </button>
                </>
            )}

            {shouldShowForm &&
                experiences.map((experience, index) => (
                    <div key={index} className="flex flex-col gap-[20px]">
                        {index > 0 && <hr className="border-grayscale-200" />}

                        <div className="flex flex-col gap-[10px]">
                            <div className="flex items-center justify-between">
                                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                                    Job Title
                                </span>
                                <Checkbox
                                    checked={experience.isCurrentJob}
                                    onChange={checked =>
                                        updateExperience(index, 'isCurrentJob', checked)
                                    }
                                    label="Current Job"
                                />
                            </div>
                            <TextInput
                                value={experience.jobTitle}
                                onChange={value => updateExperience(index, 'jobTitle', value ?? '')}
                                placeholder={
                                    hasExistingCredentials
                                        ? 'What was your job title?'
                                        : 'What is your job title?'
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-[10px]">
                            <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                                Job Summary
                            </span>
                            <TextArea
                                value={experience.jobSummary}
                                onChange={value =>
                                    updateExperience(index, 'jobSummary', value ?? '')
                                }
                                placeholder={
                                    hasExistingCredentials ? 'What did you do?' : 'What do you do?'
                                }
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
                                placeholder={
                                    hasExistingCredentials
                                        ? 'Who did you work for?'
                                        : 'Who do you work for?'
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-[10px]">
                            <div className="flex items-center justify-between">
                                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                                    Job Location
                                </span>
                                <Checkbox
                                    checked={experience.workFromHome}
                                    onChange={checked =>
                                        updateExperience(index, 'workFromHome', checked)
                                    }
                                    label="Work from home"
                                />
                            </div>
                            <TextInput
                                value={experience.jobLocation}
                                onChange={value =>
                                    updateExperience(index, 'jobLocation', value ?? '')
                                }
                                placeholder={
                                    hasExistingCredentials
                                        ? 'Where was this job located?'
                                        : 'Where is this job located?'
                                }
                                disabled={experience.workFromHome}
                                endIcon={
                                    <MapPin
                                        className={`w-[20px] h-[20px] text-grayscale-500 ${
                                            experience.workFromHome ? 'opacity-50' : ''
                                        }`}
                                    />
                                }
                            />
                        </div>

                        <div className="flex gap-[20px]">
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
                                    <div className="py-[10px] text-grayscale-900 font-poppins text-[14px] font-bold h-full flex items-center">
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
                            <div className="flex items-start justify-between py-[10px] border-t-[1px] border-t-grayscale-200 border-solid">
                                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                                    Attach Skills
                                    {selectedSkills.length > 0 && ` • ${selectedSkills.length}`}
                                </span>
                                <button
                                    type="button"
                                    className="text-grayscale-900 p-[10px] bg-grayscale-100 rounded-full"
                                    onClick={handleSelectSkills}
                                >
                                    <Plus className="w-[20px] h-[20px]" />
                                </button>
                            </div>

                            {selectedSkills.length > 0 && (
                                <div className="flex gap-[10px] flex-wrap">
                                    {selectedSkills.map((skill, index) => (
                                        <div
                                            key={index}
                                            className="bg-violet-100 text-grayscale-900 pl-[3px] pr-[10px] py-[3px] rounded-[40px] flex items-center gap-[5px]"
                                        >
                                            <CompetencyIcon
                                                icon={skill.icon}
                                                size="small"
                                                withWhiteBackground
                                            />
                                            <span className="font-poppins text-[13px] font-bold leading-[130%]">
                                                {skill.targetName}
                                            </span>
                                            <button
                                                type="button"
                                                className="text-grayscale-700 p-[3px] rounded-full"
                                                onClick={() => handleRemoveSkill(skill)}
                                            >
                                                <X className="w-[23px] h-[23px]" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

            {shouldShowForm && (
                <button
                    type="button"
                    onClick={handleAddExperience}
                    className="bg-cyan-501 text-white rounded-full pl-[30px] pr-[10px] py-[7px] text-[15px] font-bold leading-[24px] tracking-[0.25px] h-[44px] flex items-center justify-center gap-[10px]"
                >
                    Add Experience
                    <GearPlusIcon className="w-[30px] h-[30px] text-cyan-601" />
                </button>
            )}

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
