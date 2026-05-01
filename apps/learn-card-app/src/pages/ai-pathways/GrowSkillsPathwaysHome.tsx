import React from 'react';

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import AiPathwaysEmptyPlaceholder from './AiPathwaysEmptyPlaceholder';
import GrowSkillsCarouselSection from './GrowSkillsCarouselSection';
import { ModalTypes, useModal } from 'learn-card-base';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import GrowSkillsCourseItem from './GrowSkillsCourseItem';
import GrowSkillsMediaItem from './GrowSkillsMediaItem';
import GrowSkillsYouTubeMediaItem from './GrowSkillsYouTubeMediaItem';
import { type GrowSkillsCard } from './useGrowSkillsContent';
import GrowSkillsModal, { type GrowSkillsTab } from './GrowSkillsModal';
import GrowSkillsAiSessionItem from './GrowSkillsAiSessionItem';
import { useGrowSkillsContent } from './useGrowSkillsContent';

type GrowSkillsPathwaysHomeProps = {};

const GrowSkillsPathwaysHome: React.FC<GrowSkillsPathwaysHomeProps> = ({}) => {
    const { newModal } = useModal();

    const { emptyPathways, learningPathwaysData, defaultCards, schoolPrograms } =
        useGrowSkillsContent();

    const mediaCards = defaultCards.filter(
        (card): card is Extract<GrowSkillsCard, { type: 'media' | 'youtube-media' }> =>
            card.type === 'media' || card.type === 'youtube-media'
    );

    const openGrowSkillsModal = (initialActiveTab: GrowSkillsTab = 'All') => {
        newModal(<GrowSkillsModal initialActiveTab={initialActiveTab} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    return (
        <>
            <div className="bg-grayscale-50 px-[15px] py-[20px] rounded-[15px] flex flex-col gap-[30px] w-full shadow-bottom-4-4 max-w-[568px] overflow-hidden">
                <div className="flex flex-col gap-[5px]">
                    <div className="flex items-center gap-[10px] text-grayscale-900">
                        <SkillsIconWithShape className="w-[50px] h-[50px]" />
                        <h5 className="text-[20px] font-poppins font-[600]">Grow Skills</h5>
                    </div>
                    <p className="text-[14px] font-poppins text-grayscale-700">
                        Explore <strong>courses</strong>, <strong>AI learning sessions</strong>, and{' '}
                        <strong>media</strong> to strengthen & diversify your skills
                    </p>
                </div>

                <GrowSkillsCarouselSection
                    title="AI Learning Sessions"
                    items={learningPathwaysData || []}
                    onViewAll={() => openGrowSkillsModal('AI Sessions')}
                    renderItem={item => <GrowSkillsAiSessionItem data={item} />}
                    getItemKey={item => item.pathwayUri || item.title || ''}
                />

                <GrowSkillsCarouselSection
                    title="Courses"
                    items={schoolPrograms}
                    onViewAll={() => openGrowSkillsModal('Courses')}
                    renderItem={program => <GrowSkillsCourseItem program={program} />}
                    getItemKey={program => program.ProgramName}
                />

                <GrowSkillsCarouselSection
                    title="Media"
                    items={mediaCards}
                    onViewAll={() => openGrowSkillsModal('Media')}
                    renderItem={card =>
                        card.type === 'youtube-media' ? (
                            <GrowSkillsYouTubeMediaItem video={card.video} className="h-full" />
                        ) : (
                            <GrowSkillsMediaItem occupation={card.occupation} className="h-full" />
                        )
                    }
                    getItemKey={card =>
                        card.type === 'youtube-media'
                            ? card.video.videoId
                            : card.occupation.OnetCode || card.occupation.OnetTitle || ''
                    }
                />

                <button
                    onClick={() => openGrowSkillsModal()}
                    className="w-full bg-violet-500 text-white font-bold flex items-center justify-center gap-[5px] py-[7px] px-[15px] rounded-[30px] shadow-bottom-3-4 font-poppins text-[17px] leading-[24px] tracking-[0.25px]"
                >
                    <PuzzlePiece className="w-[30px] h-[30px]" version="filled" />
                    Grow Skills
                </button>
            </div>

            {emptyPathways && (
                <div className="flex items-center justify-center w-full rounded-[10px] px-4 max-w-[600px]">
                    <AiPathwaysEmptyPlaceholder />
                </div>
            )}
        </>
    );
};

export default GrowSkillsPathwaysHome;
