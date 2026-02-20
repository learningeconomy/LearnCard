import React, { useEffect, useState } from 'react';

import { Lightbox, LightboxItem } from '@learncard/react';
import Video from 'learn-card-base/svgs/Video';
import { IonFooter } from '@ionic/react';

import { useModal, VideoMetadata, getVideoMetadata, getVideoSource } from 'learn-card-base';

import { AiPathwayContent } from './ai-pathway-content.helpers';

const AiPathwayContentPreview: React.FC<{ content: AiPathwayContent }> = ({ content }) => {
    const { closeModal } = useModal();

    const [metaData, setMetaData] = useState<VideoMetadata | null>(null);
    const [currentLightboxUrl, setCurrentLightboxUrl] = useState<string | undefined>(undefined);

    const handleGetVideoMetadata = async () => {
        const metadata = await getVideoMetadata(content.url || '');
        setMetaData(metadata);
    };

    useEffect(() => {
        handleGetVideoMetadata();
    }, [content]);

    return (
        <div
            onClick={e => e.stopPropagation()}
            className="flex flex-col gap-[10px] bg-transparent mx-auto cursor-auto min-w-[300px] h-full safe-area-top-margin"
        >
            <Lightbox
                items={[{ url: content.url || '', type: 'video' } as LightboxItem]}
                currentUrl={currentLightboxUrl}
                setCurrentUrl={setCurrentLightboxUrl}
            />
            <div className="h-full relative overflow-hidden bg-grayscale-200">
                <div className="h-full overflow-y-auto pb-[150px] px-[20px] flex flex-col items-center justify-start">
                    <section className="bg-white rounded-[24px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 mt-[60px] w-full">
                        {/* header */}
                        <div className="flex flex-col gap-[10px] items-center p-[20px] border-b-[1px] border-grayscale-200 border-solid">
                            <div className="w-full h-[195px] rounded-[20px] overflow-hidden relative">
                                <img
                                    src={metaData?.thumbnailUrl || ''}
                                    alt={content.title}
                                    className="w-full h-full object-cover"
                                />

                                <div
                                    className="absolute bottom-0 left-0 w-full h-1/2"
                                    style={{
                                        background:
                                            'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 54.69%, rgba(0, 0, 0, 0.50) 90.62%)',
                                    }}
                                />

                                <Video className="absolute left-2 bottom-2 h-[20px] w-[20px] text-white" />
                            </div>

                            <h2 className="text-[20px] text-grayscale-900 font-poppins">
                                {content.title}
                            </h2>
                        </div>

                        {/* details */}
                        <div className="flex gap-[10px] items-center justify-start p-[20px]">
                            <div className="flex flex-col items-start w-full">
                                <p className="text-grayscale-600 font-poppins font-semibold text-sm tracking-[-0.25px]">
                                    Provided by
                                </p>

                                <p className="text-grayscale-900 font-poppins text-base tracking-[-0.25px]">
                                    {content.source ?? getVideoSource(content.url || '')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-[10px] items-start justify-start px-[20px] pb-1">
                            <div className="w-full border-b-[1px] border-grayscale-200 border-solid" />
                        </div>

                        {/* description */}
                        <div className="flex flex-col gap-[10px] items-start justify-start p-[20px]">
                            <p className="text-grayscale-600 font-poppins text-base tracking-[-0.25px]">
                                {content.description}
                            </p>
                        </div>
                    </section>
                </div>
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
                        onClick={() => setCurrentLightboxUrl(content.url || '')}
                        className="p-[11px] bg-emerald-700 rounded-full text-white shadow-button-bottom flex-1 font-poppins text-[17px] font-semibold"
                    >
                        Start
                    </button>
                </div>
            </IonFooter>
        </div>
    );
};

export default AiPathwayContentPreview;
