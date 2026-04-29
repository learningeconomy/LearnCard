import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCurrentLCNUser, useModal, useDeviceTypeByWidth } from 'learn-card-base';
import { useWallet } from 'learn-card-base/hooks/useWallet';

import NewAiSessionContainer from './NewAiSessionContainer';
import OnboardingHeader from './NewAiSessionChatBot/helpers/OnboardingHeader';
import AiSessionLearningPathwayItemSkeleton from './AiSessionLearningPathways/AiSessionLearningPathwayItemSkeleton';
import {
    fetchLearningPathwaysForSession,
    learningPathwaysQueryKey,
} from './AiSessionLearningPathways/ai-learningPathways.helpers';
import { NewAiSessionStepEnum } from './newAiSession.helpers';
import { AiPassportAppsEnum } from '../ai-passport-apps/aiPassport-apps.helpers';

type AiAppContext = { type?: string; url?: string } | undefined;

type Props = {
    topicUri: string;
    topicTitle?: string;
    firstSessionUri?: string;
    topicBoostUri?: string;
    app?: AiAppContext;
    seedRevisit: (topicUri: string, topicTitle?: string) => void;
};

// Mounted inside the modal opened by useNewSessionForTopicMobile. Shows the
// pathway skeleton while fetching the topic's pathways, then either swaps to
// the Revisit picker when pathways exist, or closes the modal and navigates
// to a fresh chat when they don't. Keeps the modal-open animation snappy
// without showing the Revisit content for a topic that has no pathways.
const TopicNewSessionGate: React.FC<Props> = ({
    topicUri,
    topicTitle,
    firstSessionUri,
    topicBoostUri,
    app,
    seedRevisit,
}) => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { closeAllModals } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();

    const [phase, setPhase] = useState<'checking' | 'ready'>('checking');

    useEffect(() => {
        let cancelled = false;

        const navAway = () => {
            const uri = topicBoostUri ?? topicUri;
            closeAllModals?.();
            if (app?.type === AiPassportAppsEnum.learncardapp) {
                history.push(`/chats?topicUri=${encodeURIComponent(uri)}`);
            } else if (app?.url) {
                window.location.href = `${app.url}/chats?topicUri=${encodeURIComponent(
                    uri
                )}&did=${encodeURIComponent(currentLCNUser?.did ?? '')}`;
            } else {
                history.push(`/chats?topicUri=${encodeURIComponent(uri)}`);
            }
        };

        const run = async () => {
            if (!firstSessionUri) {
                if (!cancelled) navAway();
                return;
            }

            try {
                const pathways = await queryClient.fetchQuery({
                    queryKey: learningPathwaysQueryKey(firstSessionUri),
                    queryFn: async () => {
                        const wallet = await initWallet();
                        return fetchLearningPathwaysForSession(wallet, firstSessionUri);
                    },
                });
                if (cancelled) return;

                if (!pathways || pathways.length === 0) {
                    navAway();
                    return;
                }

                seedRevisit(topicUri, topicTitle);
                setPhase('ready');
            } catch {
                if (!cancelled) navAway();
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, []);

    if (phase === 'ready') {
        return (
            <NewAiSessionContainer
                shortCircuitStep={NewAiSessionStepEnum.revisitTopic}
                disableEdit
            />
        );
    }

    const headerTitle = topicTitle?.trim()
        ? `New Session for ${topicTitle.trim()}`
        : 'New Session';

    return (
        <div
            className={`w-full flex flex-col overflow-y-auto pt-[80px] ${
                isDesktop ? 'max-w-[800px]' : ''
            } scrollbar-hide relative`}
            style={{ paddingTop: 'calc(80px + env(safe-area-inset-top))' }}
        >
            <OnboardingHeader title={headerTitle} />
            <div
                className={`w-full bg-grayscale-100 ion-padding ${
                    isDesktop ? 'rounded-[20px] mt-4' : ''
                }`}
            >
                <Swiper spaceBetween={16} slidesPerView={'auto'} style={{ paddingBottom: '2px' }}>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <SwiperSlide key={index} style={{ width: '240px', height: '194px' }}>
                            <AiSessionLearningPathwayItemSkeleton />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default TopicNewSessionGate;
