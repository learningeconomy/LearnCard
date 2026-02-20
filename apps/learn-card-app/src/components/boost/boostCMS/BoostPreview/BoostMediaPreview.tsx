import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper';

import MediaLoader from './helpers/MediaLoader';
import SpilledCup from 'learn-card-base/svgs/SpilledCup';
import SlimCaretLeft from '../../../svgs/SlimCaretLeft';
import BoostDetailsSideBar from './BoostDetailsSideBar';
import SlimCaretRight from '../../../svgs/SlimCaretRight';
import { IonContent, IonFooter, IonPage } from '@ionic/react';
import MediaCollapseButton from './helpers/MediaCollapseButton';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';

import {
    useModal,
    useDeviceTypeByWidth,
    getVideoMetadata,
    BoostCategoryOptionsEnum,
    DisplayTypeEnum,
} from 'learn-card-base';
import { VC } from '@learncard/types';
import { VideoMetadata } from 'learn-card-base';
import {
    convertEvidenceToAttachments,
    getExistingAttachmentsOrEvidence,
} from 'learn-card-base/helpers/credentialHelpers';

export function getFilestackPreviewUrl(fileUrl: string): string {
    try {
        const url = new URL(fileUrl);
        const handle = url.pathname.split('/').filter(Boolean).pop();

        if (!handle) throw new Error('Invalid Filestack URL: No file handle found');

        return `https://cdn.filestackcontent.com/preview/${handle}`;
    } catch (e) {
        console.error('Failed to generate Filestack preview URL:', e);
        return '';
    }
}

export const BoostMediaPreview: React.FC<{
    credential: VC;
    openDetailsSideModal: () => void;
    handleShareBoost: () => void;
    onDotsClick: () => void;
    verifications: any;
    handleCloseModal?: () => void;
}> = ({
    credential,
    openDetailsSideModal,
    handleShareBoost,
    onDotsClick,
    verifications,
    handleCloseModal,
}) => {
    const { closeModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth();
    const swiperRef = useRef<any>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    const [videoMetaData, setVideoMetaData] = useState<VideoMetadata | null>(null);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);
    const [isMediaLoading, setIsMediaLoading] = useState<boolean>(false);
    const [isMediaError, setIsMediaError] = useState<boolean>(false);

    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

    const attachments = getExistingAttachmentsOrEvidence(
        credential?.attachments || [],
        credential?.evidence || []
    );
    const attachment = attachments?.[0];

    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullScreen(false);
        };

        window.addEventListener('keydown', onKeydown);
        return () => window.removeEventListener('keydown', onKeydown);
    }, []);

    const handleGetVideoMetadata = async () => {
        try {
            setIsMediaLoading(true);
            const metadata = await getVideoMetadata(attachment?.url || '');
            setVideoMetaData(metadata);
        } catch (error) {
            console.error('Failed to get video metadata:', error);
        } finally {
            setIsMediaLoading(false);
        }
    };

    const handleGetDocumentUrl = async () => {
        try {
            setIsMediaLoading(true);
            const url = getFilestackPreviewUrl(attachment?.url || '');
            setDocumentUrl(url);
        } catch (error) {
            console.error('Failed to get document metadata:', error);
        } finally {
            setIsMediaLoading(false);
        }
    };

    useEffect(() => {
        if (attachment?.type === 'video') {
            handleGetVideoMetadata();
        } else if (attachment?.type === 'document') {
            handleGetDocumentUrl();
        }
    }, [attachment?.url]);

    let mediaContent = null;

    if (attachment?.type === 'document') {
        if (isMediaLoading) {
            mediaContent = <MediaLoader text="Document" />;
        } else if (documentUrl) {
            mediaContent = (
                <>
                    <iframe
                        src={documentUrl}
                        style={{
                            width: '100%',
                            height: '100vh',
                            border: 'none',
                            backgroundColor: '#353E64',
                            zIndex: isMobile ? -1 : 0, // ! work around for mobile
                            position: 'relative',
                        }}
                        onError={() => {
                            setIsMediaError(true);
                        }}
                        allowFullScreen
                    />
                </>
            );
        }
    }

    if (attachment?.type === 'video') {
        const embedUrl = videoMetaData?.embedUrl;
        const iframeSrc = embedUrl
            ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`
            : null;

        if (isMediaLoading) {
            mediaContent = <MediaLoader text="Video" />;
        } else if (iframeSrc) {
            mediaContent = (
                <>
                    <iframe
                        src={iframeSrc}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube video player"
                        onError={() => {
                            setIsMediaError(true);
                        }}
                        style={{
                            width: '100%',
                            height: '100vh',
                            border: 'none',
                            backgroundColor: '#353E64',
                            zIndex: isMobile ? -1 : 0, // ! work around for mobile
                            position: 'relative',
                        }}
                    />
                </>
            );
        }
    }

    if (attachment?.type === 'photo') {
        if (attachments?.length > 0) {
            const totalSlides = attachments.length;
            const isFirstSlide = currentSlide === 0;
            const isLastSlide = currentSlide === totalSlides - 1;

            mediaContent = (
                <>
                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={10}
                        slidesPerView={1}
                        onSwiper={swiper => {
                            swiperRef.current = swiper;
                        }}
                        onSlideChange={swiper => {
                            setCurrentSlide(swiper.activeIndex);
                        }}
                        className="w-full h-[100vh]"
                    >
                        {attachments.map((img, index) => (
                            <SwiperSlide key={index}>
                                <img
                                    src={img.url}
                                    alt={`Image ${index + 1}`}
                                    className="object-contain w-full h-full"
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {!isFirstSlide && (
                        <button
                            onClick={() => swiperRef.current?.slidePrev()}
                            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-20 shadow-md hover:bg-gray-200 opacity-50"
                        >
                            <SlimCaretLeft className="w-5 h-auto" />
                        </button>
                    )}

                    {!isLastSlide && (
                        <button
                            onClick={() => swiperRef.current?.slideNext()}
                            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-20 shadow-md hover:bg-gray-200 opacity-50"
                        >
                            <SlimCaretRight className="w-5 h-auto" />
                        </button>
                    )}
                </>
            );
        }
    }

    if (isMediaError) {
        mediaContent = (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-white">
                <SpilledCup />
                <h1 className="text-[17px] text-black font-poppins">Something went wrong.</h1>
            </div>
        );
    }

    return (
        <IonPage className="grayscale-800 h-full">
            {/* Mobile */}
            {isMobile && (
                <>
                    <IonContent fullscreen>{mediaContent}</IonContent>
                    {isFullScreen && <MediaCollapseButton onClick={() => setIsFullScreen(false)} />}
                    {!isFullScreen && (
                        <IonFooter>
                            <BoostFooter
                                showFullScreen
                                handleFullScreen={() => setIsFullScreen(!isFullScreen)}
                                showShareButton={false}
                                handleClose={() => {
                                    if (handleCloseModal) handleCloseModal?.();
                                    closeModal();
                                }}
                                handleDetails={isMobile ? () => openDetailsSideModal() : undefined}
                                handleShare={handleShareBoost}
                                handleDotMenu={onDotsClick}
                                useFullCloseButton={!isMobile || !handleShareBoost}
                            />
                        </IonFooter>
                    )}
                </>
            )}

            {/* Desktop */}
            {!isMobile && (
                <>
                    <section className="grayscale-800 h-full flex flex-row overflow-hidden">
                        <div className="flex-1 h-full overflow-hidden relative">{mediaContent}</div>
                        {!isMobile && !isFullScreen && (
                            <BoostDetailsSideBar
                                credential={credential}
                                categoryType={BoostCategoryOptionsEnum.accomplishment}
                                verificationItems={verifications}
                                displayType={DisplayTypeEnum.Media}
                            />
                        )}
                        {isFullScreen && (
                            <MediaCollapseButton onClick={() => setIsFullScreen(false)} />
                        )}
                    </section>
                    {!isFullScreen && (
                        <footer className="w-full flex justify-center items-center ion-no-border z-50">
                            <BoostFooter
                                handleClose={() => {
                                    if (handleCloseModal) handleCloseModal?.();
                                    closeModal();
                                }}
                                handleDetails={isMobile ? () => openDetailsSideModal() : undefined}
                                handleShare={handleShareBoost}
                                handleDotMenu={onDotsClick}
                                useFullCloseButton={!isMobile || !handleShareBoost}
                                showFullScreen
                                showShareButton={false}
                                handleFullScreen={() => setIsFullScreen(!isFullScreen)}
                            />
                        </footer>
                    )}
                </>
            )}
        </IonPage>
    );
};

export default BoostMediaPreview;
