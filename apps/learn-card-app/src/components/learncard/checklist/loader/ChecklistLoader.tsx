import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';

import { IonSpinner } from '@ionic/react';
import { ProfilePicture } from 'learn-card-base';
import Sparkles from '../../../../assets/images/purple-sparkles.gif';

// Import styles
import 'swiper/css';
import 'swiper/css/autoplay';

import { UploadTypesEnum, useModal } from 'learn-card-base';

import useTheme from '../../../../theme/hooks/useTheme';
import * as m from '../../../../paraglide/messages.js';

// Dotted catalog key prefixes for each upload type's rotating loader quotes.
// Quotes are resolved at RENDER time via the message function (not module load)
// so they stay in sync with the active locale. Each type has q0..qN keys in the catalog.
const QUOTE_KEY_PREFIX: Record<UploadTypesEnum, string> = {
    [UploadTypesEnum.Resume]: 'passport.buildMyLearnCard.loader.quotes.resume',
    [UploadTypesEnum.Certificate]: 'passport.buildMyLearnCard.loader.quotes.certificate',
    [UploadTypesEnum.Transcript]: 'passport.buildMyLearnCard.loader.quotes.transcript',
    [UploadTypesEnum.Diploma]: 'passport.buildMyLearnCard.loader.quotes.diploma',
    [UploadTypesEnum.RawVC]: 'passport.buildMyLearnCard.loader.quotes.rawVC',
};

// Number of catalog quote keys per type (must match translation.json).
const QUOTE_COUNT: Record<UploadTypesEnum, number> = {
    [UploadTypesEnum.Resume]: 10,
    [UploadTypesEnum.Certificate]: 10,
    [UploadTypesEnum.Transcript]: 10,
    [UploadTypesEnum.Diploma]: 10,
    [UploadTypesEnum.RawVC]: 9,
};

export const ChecklistLoader: React.FC<{ fileType: UploadTypesEnum; onDismiss?: () => void }> = ({
    fileType,
    onDismiss,
}) => {
    const { closeModal } = useModal();
    const activeType = fileType ?? UploadTypesEnum.Resume;
    // Resolve quotes at render time so they reflect the current locale
    // (calling the message function at module load would freeze the load-time locale).
    const quotePrefix = QUOTE_KEY_PREFIX[activeType];
    const activeQuotes = Array.from({ length: QUOTE_COUNT[activeType] }, (_, i) =>
        m[`${quotePrefix}.q${i}`]()
    );

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
                        onClick={() => (onDismiss ? onDismiss() : closeModal())}
                        className={`px-6 py-2 rounded-full text-white font-semibold bg-${primaryColor}`}
                    >
                        {m['passport.buildMyLearnCard.loader.notifyWhenReady']()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChecklistLoader;
