import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { ModalTypes, VideoMetadata, getVideoMetadata, useModal } from 'learn-card-base';
import { useCareerOneStopVideo } from 'learn-card-base/react-query/queries/careerOneStop';
import AiPathwayContentPreview from './ai-pathway-explore-content/AiPathwayContentPreview';
import careerOneStopLogo from '../../assets/images/career-one-stop-logo.png';

type GrowSkillsOccupation = {
    OnetTitle?: string;
    COSVideoURL?: string | null;
    Video?: Array<{
        VideoCode?: string;
    } | null> | null;
};

type GrowSkillsMediaItemProps = {
    occupation: GrowSkillsOccupation;
};

const GrowSkillsMediaItem: React.FC<GrowSkillsMediaItemProps> = ({ occupation }) => {
    const { newModal } = useModal({ mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel });

    const title = occupation?.OnetTitle || 'Video';
    const videoCode = occupation?.Video?.[0]?.VideoCode?.replace(/[^0-9]/g, '') || '';
    const fallbackUrl = occupation?.COSVideoURL || '';

    const { data: video } = useCareerOneStopVideo(videoCode || '');

    const [metaData, setMetaData] = useState<VideoMetadata | null>(null);

    const handleGetVideoMetadata = async () => {
        const metadata = await getVideoMetadata(video?.youtubeUrl || fallbackUrl || '');
        setMetaData(metadata);
    };

    const handleViewCourse = () => {
        const contentUrl = video?.youtubeUrl || fallbackUrl;

        const content = {
            id: occupation?.OnetCode,
            title: occupation?.OnetTitle,
            description: occupation?.OnetDescription,
            videoCode: videoCode,
            source: 'CareerOneStop',
            url: contentUrl,
        };

        newModal(<AiPathwayContentPreview content={content} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    useEffect(() => {
        if (!video?.youtubeUrl && !fallbackUrl) {
            setMetaData(null);
            return;
        }

        handleGetVideoMetadata();
    }, [fallbackUrl, video?.youtubeUrl]);

    return (
        <div className="flex flex-col rounded-[10px] overflow-hidden w-full h-full shadow-bottom-4-4 text-left">
            <div className="relative h-[162px] overflow-hidden flex-shrink-0 bg-grayscale-200">
                {metaData?.thumbnailUrl && (
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${metaData.thumbnailUrl})` }}
                    />
                )}
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
            <div className="p-[10px] flex flex-col gap-[10px]">
                <div className="flex gap-[10px] items-start">
                    <img
                        src={careerOneStopLogo}
                        alt="Career One Stop"
                        className="!w-[40px] !h-[40px] rounded-full object-contain shrink-0"
                    />
                    <div className="flex flex-col gap-[5px]">
                        <p className="text-grayscale-900 text-[14px] font-bold">{title}</p>
                        <p className="text-grayscale-700 text-[12px]">
                            {metaData?.authorName ?? 'CareerOneStop'}
                        </p>
                    </div>
                </div>
                <p className="mt-auto text-[13px] text-grayscale-500 italic text-left">
                    Skills TODO
                </p>
            </div>
        </div>
    );
};

export default GrowSkillsMediaItem;
