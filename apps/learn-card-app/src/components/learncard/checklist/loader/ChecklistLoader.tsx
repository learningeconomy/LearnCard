import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper';

import { IonSpinner } from '@ionic/react';
import { ProfilePicture } from 'learn-card-base';
import Sparkles from '../../../../assets/images/purple-sparkles.gif';

// Import styles
import 'swiper/css';
import 'swiper/css/autoplay';

import { UploadTypesEnum, useModal } from 'learn-card-base';

import useTheme from '../../../../theme/hooks/useTheme';

const fileTypeQuotes: Record<UploadTypesEnum, string[]> = {
    [UploadTypesEnum.Resume]: [
        'Scanning your resume for hidden gems...',
        'Extracting your work history — one line at a time.',
        'Highlighting your accomplishments...',
        'Polishing your achievements into credentials...',
        'Turning experience into verifiable skills...',
        'Giving your resume the credential treatment...',
        'Building your learning and work timeline...',
        'Parsing education and work history...',
        'Verifying your resume for smart records...',
        'Creating digital proof of your career journey...',
    ],
    [UploadTypesEnum.Certificate]: [
        'Reading your certificate details...',
        'Extracting certified skills and knowledge...',
        'Identifying your issuing authority...',
        'Verifying your certification date...',
        'Translating your certificate into a credential...',
        'Generating a smart badge for your expertise...',
        'Recognizing your certified accomplishments...',
        'Checking for expiration or renewal status...',
        'Transforming paper credentials into digital records...',
        'Capturing verified skills from your certificate...',
    ],
    [UploadTypesEnum.Transcript]: [
        'Parsing your academic transcript...',
        'Extracting course history and grades...',
        'Mapping your educational timeline...',
        'Reading earned credits and GPA (if available)...',
        'Converting course data into credentials...',
        'Tracking your learning progress...',
        'Translating transcripts into verifiable records...',
        'Analyzing your academic performance...',
        'Identifying completed programs or majors...',
        'Building smart records from your coursework...',
    ],
    [UploadTypesEnum.Diploma]: [
        'Analyzing your diploma...',
        'Verifying institution and degree type...',
        'Recognizing your awarded qualification...',
        'Converting your diploma into a verifiable record...',
        'Recording your academic milestone...',
        'Extracting awarded date and field of study...',
        'Documenting your graduation achievement...',
        'Preserving proof of your education...',
        'Digitizing your academic honor...',
        'Building a portable credential from your diploma...',
    ],
    [UploadTypesEnum.RawVC]: [
        'Parsing your raw JSON credential...',
        'Extracting credential details...',
        'Verifying credential signature...',
        'Converting JSON into a verifiable credential...',
        'Generating a smart badge for your expertise...',
        'Recognizing your verified accomplishments...',
        'Checking for expiration or renewal status...',
        'Transforming paper credentials into digital records...',
        'Capturing verified skills from your credential...',
    ],
};

export const ChecklistLoader: React.FC<{ fileType: UploadTypesEnum }> = ({ fileType }) => {
    const { closeModal } = useModal();
    const activeQuotes = fileTypeQuotes?.[fileType ?? UploadTypesEnum.Resume];

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <div className="h-[100vh] w-full flex items-center justify-center absolute top-0 left-0 z-9999 bg-black/50">
            <div className="w-full flex flex-col justify-center items-center gap-[60px] bg-white rounded-[24px] px-[30px] pt-[60px] pb-[40px] max-w-[340px] mx-auto min-h-[400px] shadow-box-bottom">
                <div className="relative w-full flex items-center justify-center">
                    <ProfilePicture
                        customContainerClass="text-white h-[70px] w-[70px] min-h-[70px] min-w-[70px] max-h-[70px] max-w-[70px] mt-[0px] mb-0 z-50"
                        customImageClass="w-full h-full object-cover"
                    />
                    <img src={Sparkles} className="absolute h-[182px] w-[182px] z-20" />
                    <IonSpinner
                        name="crescent"
                        style={{ color: '#6366F1' }}
                        className="z-[100] absolute h-[94px] w-[94px]"
                    />
                </div>

                <div className="w-full text-center">
                    <Swiper
                        modules={[Autoplay]}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        loop
                        allowTouchMove={false}
                        slidesPerView={1}
                        className="w-full h-[50px]"
                    >
                        {activeQuotes.map((quote, index) => (
                            <SwiperSlide key={index}>
                                <span className="block font-notoSans text-grayscale-900 text-[17px] font-[600] leading-[24px] tracking-[0.25px]">
                                    {quote}
                                </span>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                <div className="w-full flex items-center justify-center">
                    <button
                        onClick={() => closeModal()}
                        className={`px-6 py-2 rounded-full text-white font-semibold bg-${primaryColor}`}
                    >
                        Notify me when it's ready
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChecklistLoader;
