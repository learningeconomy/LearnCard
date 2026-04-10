import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import {
    ModalTypes,
    VideoMetadata,
    getVideoMetadata,
    useModal,
    useCareerOneStopVideo,
} from 'learn-card-base';
import AiPathwayContentPreview from './ai-pathway-explore-content/AiPathwayContentPreview';
import careerOneStopLogo from '../../assets/images/career-one-stop-logo.png';
import GrowSkillsSkillChips from './GrowSkillsSkillChips';

type GrowSkillsOccupation = {
    OnetCode?: string;
    OnetTitle?: string;
    OnetDescription?: string;
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
    const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = useRef(false);

    const dragThreshold = 8;

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
        const contentId = occupation?.OnetCode
            ? Number.parseInt(occupation.OnetCode, 10)
            : undefined;

        const content = {
            id: Number.isNaN(contentId as number) ? undefined : contentId,
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

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        pointerStartRef.current = {
            x: event.clientX,
            y: event.clientY,
        };
        hasDraggedRef.current = false;
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerStartRef.current) return;

        const deltaX = Math.abs(event.clientX - pointerStartRef.current.x);
        const deltaY = Math.abs(event.clientY - pointerStartRef.current.y);

        if (deltaX > dragThreshold || deltaY > dragThreshold) {
            hasDraggedRef.current = true;
        }
    };

    const handlePointerUp = () => {
        pointerStartRef.current = null;
    };

    const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!hasDraggedRef.current) return;

        event.preventDefault();
        event.stopPropagation();
        hasDraggedRef.current = false;
    };

    useEffect(() => {
        if (!video?.youtubeUrl && !fallbackUrl) {
            setMetaData(null);
            return;
        }

        handleGetVideoMetadata();
    }, [fallbackUrl, video?.youtubeUrl]);

    return (
        <div
            className="flex flex-col rounded-[10px] overflow-hidden w-full h-full shadow-bottom-4-4 text-left"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClickCapture={handleClickCapture}
        >
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
            <div className="p-[10px] flex flex-col gap-[10px] h-full">
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
                <GrowSkillsSkillChips searchQuery={title} />
            </div>
        </div>
    );
};

export default GrowSkillsMediaItem;
