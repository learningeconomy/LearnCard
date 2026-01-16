import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

import { IonFooter } from '@ionic/react';
// import Star from 'learn-card-base/svgs/shapes/Star';
// import TimeCircle from 'learn-card-base/svgs/TimeCircle';
import CareerLaptopIcon from '../../../assets/images/career.laptop.icon.png';
import openSyllabusLogo from '../../../assets/images/open-syllabus-logo.webp';

import { useModal } from 'learn-card-base';

const AiPathwayCourseDetails: React.FC<{ course: any }> = ({ course }) => {
    const { closeModal } = useModal();

    const school = course?.institution;

    const schoolUrl = school?.url;
    const schoolImage = school?.image_url;
    const logo = schoolImage ? schoolImage : openSyllabusLogo;

    const handleExploreSchool = async () => {
        if (!schoolUrl) return;
        if (Capacitor?.isNativePlatform()) {
            await Browser.open({ url: schoolUrl });
        } else {
            window.open(schoolUrl, '_blank');
        }
    };

    return (
        <div
            onClick={e => e.stopPropagation()}
            className="flex flex-col gap-[10px] bg-transparent mx-auto cursor-auto min-w-[300px] h-full safe-area-top-margin"
        >
            <div className="h-full relative overflow-hidden bg-grayscale-200">
                <div className="h-full overflow-y-auto pb-[150px] px-[20px] flex flex-col items-center justify-start">
                    <section className="bg-white rounded-[24px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 mt-[60px] w-full">
                        {/* header */}
                        <div className="flex flex-col gap-[10px] items-center p-[20px] border-b-[1px] border-grayscale-200 border-solid">
                            <img
                                src={CareerLaptopIcon}
                                alt="career icon"
                                className="w-[80px] h-[80px]"
                            />

                            <h2 className="text-[20px] text-grayscale-900 font-poppins text-center">
                                {course.title}
                            </h2>
                        </div>

                        {/* details */}
                        <div className="flex gap-[10px] items-center justify-start p-[20px]">
                            <div className="flex flex-col items-start w-full">
                                <p className="text-grayscale-600 font-poppins font-semibold text-sm tracking-[-0.25px]">
                                    Provided by
                                </p>

                                <p className="text-grayscale-900 font-poppins text-base tracking-[-0.25px]">
                                    {school.institution}
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
                            </div>
                        </div>
                        {/* <div className="flex flex-col gap-[10px] items-start justify-start px-[20px]">
                            <p className="text-grayscale-600 font-poppins font-semibold text-sm tracking-[-0.25px]">
                                Rated
                            </p>
                            <div className="flex items-center gap-1">
                                <Star className="w-6 h-6 text-yellow-500" />
                                <p className="text-base text-grayscale-800 font-semibold font-notoSans">
                                    {course.rating}
                                    <span className="text-grayscale-400">/5</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-[10px] items-start justify-start p-[20px]">
                            <p className="text-grayscale-600 font-poppins font-semibold text-sm tracking-[-0.25px]">
                                Duration
                            </p>
                            <div className="flex items-center gap-2">
                                <TimeCircle className="w-6 h-6 text-yellow-500" />
                                <p className="text-base text-grayscale-800 font-semibold font-notoSans">
                                    {course.durationAvg}
                                </p>
                                <p className="text-base text-grayscale-800 font-semibold font-notoSans">
                                    • {course.durationTotal}
                                </p>
                            </div>
                        </div> */}

                        <div className="flex flex-col gap-[10px] items-start justify-start px-[20px] pb-1">
                            <div className="w-full border-b-[1px] border-grayscale-200 border-solid" />
                        </div>

                        {/* description */}
                        <div className="flex flex-col gap-[10px] items-start justify-start p-[20px]">
                            <p className="text-grayscale-600 font-poppins text-base tracking-[-0.25px]">
                                {course.description}
                            </p>
                        </div>
                    </section>
                </div>
                <IonFooter
                    mode="ios"
                    className="w-full flex justify-center items-center bg-opacity-80 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white"
                >
                    <div className="w-full flex items-center justify-center gap-[10px] max-w-[600px]">
                        <button
                            onClick={closeModal}
                            className="p-[11px] bg-white rounded-full text-grayscale-900 shadow-button-bottom flex-1 font-poppins text-[17px]"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleExploreSchool}
                            className="p-[11px] bg-emerald-700 rounded-full text-white shadow-button-bottom flex-1 font-poppins text-[17px] font-semibold"
                        >
                            Explore
                        </button>
                    </div>
                </IonFooter>
            </div>
        </div>
    );
};

export default AiPathwayCourseDetails;
