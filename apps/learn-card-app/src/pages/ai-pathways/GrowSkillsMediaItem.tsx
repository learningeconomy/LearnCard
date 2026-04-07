import React, { useState, useEffect } from 'react';
import { ModalTypes, VideoMetadata, getVideoMetadata, useModal } from 'learn-card-base';
import { useCareerOneStopVideo } from 'learn-card-base/react-query/queries/careerOneStop';
import AiPathwayContentPreview from './ai-pathway-explore-content/AiPathwayContentPreview';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import { Play } from 'lucide-react';

type GrowSkillsMediaItemProps = {
    title: string;
    mediaUrl: string;
    videoCode: string;
};

const GrowSkillsMediaItem: React.FC<GrowSkillsMediaItemProps> = ({
    title,
    mediaUrl,
    videoCode,
}) => {
    const { newModal } = useModal({ mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel });

    const { data: video } = useCareerOneStopVideo(videoCode || '');

    const [metaData, setMetaData] = useState<VideoMetadata | null>(null);

    const handleGetVideoMetadata = async () => {
        const metadata = await getVideoMetadata(video?.youtubeUrl || '');
        setMetaData(metadata);
    };

    const handleViewCourse = () => {
        newModal(
            <AiPathwayContentPreview content={{ title, url: video?.youtubeUrl, videoCode }} />,
            undefined,
            {
                desktop: ModalTypes.Right,
                mobile: ModalTypes.Right,
            }
        );
    };

    useEffect(() => {
        if (video?.youtubeUrl) {
            handleGetVideoMetadata();
        }
    }, [videoCode]);

    return (
        <div className="flex flex-col rounded-[10px] overflow-hidden w-full shadow-bottom-4-4">
            <div className="relative h-[162px] overflow-hidden flex-shrink-0">
                <div className="relative block h-full">
                    <img
                        src={metaData?.thumbnailUrl || EmptyImage}
                        alt={title || 'Video Cover'}
                        className="h-full w-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleViewCourse}
                        aria-label={`Play ${title || 'video'}`}
                        className="absolute inset-0 z-10 flex items-center justify-center"
                    >
                        <span className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-white shadow-bottom-4-4">
                            <Play className="h-[25px] w-[25px] text-grayscale-800 fill-current stroke-current" />
                        </span>
                    </button>
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent"></div>
                </div>
            </div>
            <div className="p-[10px] flex flex-col gap-[10px]">
                <div className="flex gap-[10px] items-start">
                    <div className="w-[40px] h-[40px] rounded-full bg-[#E0E0E0]"></div>
                    <div className="flex flex-col gap-[5px]">
                        <p className="text-grayscale-900 text-[14px] font-bold">{title}</p>
                        <p className="text-grayscale-700 text-[12px]">{metaData?.authorName}</p>
                    </div>
                </div>
                <div>skills...?</div>
            </div>
        </div>
    );
};

export default GrowSkillsMediaItem;
