import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useModal } from 'learn-card-base';

import { ChevronRight } from 'lucide-react';
import GrowSkillsSkillChips from './GrowSkillsSkillChips';
import { type GrowSkillsPathway } from './useGrowSkillsContent';
import { AiSessionsIconWithShape } from 'learn-card-base/svgs/wallet/AiSessionsIcon';

type GrowSkillsAiSessionItemProps = {
    data: GrowSkillsPathway;
};

const GrowSkillsAiSessionItem: React.FC<GrowSkillsAiSessionItemProps> = ({ data }) => {
    const history = useHistory();
    const { closeModal } = useModal();

    const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = useRef(false);

    const dragThreshold = 8;

    const { title, description, topicUri, pathwayUri } = data;

    const handleStart = () => {
        if (!topicUri || !pathwayUri) return;

        closeModal();
        history.push(
            `/chats?topicUri=${encodeURIComponent(topicUri)}&pathwayUri=${encodeURIComponent(
                pathwayUri
            )}`
        );
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

    return (
        <div
            role="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClickCapture={handleClickCapture}
            onClick={handleStart}
            className="w-full h-full flex flex-col rounded-[15px] bg-white shadow-bottom-4-4 overflow-hidden cursor-pointer border-b-[3px] border-cyan-401 text-left"
        >
            <div className="px-[15px] py-[20px] flex flex-col gap-[5px] h-full">
                <div className="flex items-start gap-[10px]">
                    <AiSessionsIconWithShape className="w-[35px] h-[35px] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[17px] font-poppins font-[600] text-grayscale-900 leading-[24px] tracking-[0.25px] line-clamp-2 text-left">
                            {title}
                        </h3>
                    </div>
                    <ChevronRight className="w-[20px] h-[20px] text-grayscale-700 flex-shrink-0" />
                </div>

                <p className="text-[14px] text-grayscale-600 font-notoSans text-left">
                    {description}
                </p>

                <GrowSkillsSkillChips searchQuery={title} />
            </div>
        </div>
    );
};

export default GrowSkillsAiSessionItem;
