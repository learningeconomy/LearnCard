import React, { useRef } from 'react';
import { Play } from 'lucide-react';
import { ModalTypes, useModal, type YouTubeVideo } from 'learn-card-base';
import AiPathwayContentPreview from './ai-pathway-explore-content/AiPathwayContentPreview';
import GrowSkillsSkillChips from './GrowSkillsSkillChips';

type GrowSkillsYouTubeMediaItemProps = {
    video: YouTubeVideo;
    className?: string;
};

const GrowSkillsYouTubeMediaItem: React.FC<GrowSkillsYouTubeMediaItemProps> = ({
    video,
    className = '',
}) => {
    const { newModal } = useModal({ mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel });
    const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = useRef(false);

    const dragThreshold = 10;

    const handleViewVideo = () => {
        const content = {
            title: video.title,
            description: video.description,
            source: 'YouTube',
            url: video.url,
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

        if (!hasDraggedRef.current) {
            handleViewVideo();
        }
    };

    const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!hasDraggedRef.current) return;

        event.preventDefault();
        event.stopPropagation();
        hasDraggedRef.current = false;
    };

    return (
        <div
            className={`flex shrink-0 flex-col rounded-[10px] overflow-hidden w-full shadow-bottom-4-4 text-left ${className}`.trim()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClickCapture={handleClickCapture}
            role="button"
        >
            <div className="relative h-[162px] overflow-hidden flex-shrink-0 bg-grayscale-200">
                {video.thumbnailUrl && (
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
                    />
                )}
                <div
                    aria-label={`Play ${video.title || 'video'}`}
                    className="absolute inset-0 z-10 flex items-center justify-center"
                >
                    <span className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-white shadow-bottom-4-4">
                        <Play className="h-[25px] w-[25px] text-grayscale-800 fill-current stroke-current" />
                    </span>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent"></div>
            </div>
            <div className="p-[10px] flex flex-col h-full gap-[10px] min-h-[92px]">
                <div className="flex gap-[10px] items-start">
                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-red-600">
                        <svg
                            viewBox="0 0 24 24"
                            className="h-[22px] w-[22px] fill-white"
                            aria-hidden="true"
                        >
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                    </div>
                    <div className="flex flex-col gap-[5px]">
                        <p className="text-grayscale-900 text-[14px] font-bold line-clamp-2">
                            {video.title}
                        </p>
                        <p className="text-grayscale-700 text-[12px]">{video.channelTitle}</p>
                    </div>
                </div>
                <GrowSkillsSkillChips searchQuery={video.title} />
            </div>
        </div>
    );
};

export default GrowSkillsYouTubeMediaItem;
