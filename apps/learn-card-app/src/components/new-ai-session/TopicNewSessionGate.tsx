import React, { useEffect, useState } from 'react';

import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { IonSpinner } from '@ionic/react';
import { useGetCurrentLCNUser, useModal, useDeviceTypeByWidth } from 'learn-card-base';
import { useWallet } from 'learn-card-base/hooks/useWallet';
import { AiSessionsIconWithShape } from 'learn-card-base/svgs/wallet/AiSessionsIcon';

import NewAiSessionContainer from './NewAiSessionContainer';
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

    return (
        <div
            className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-5 ${
                isDesktop ? 'max-w-[800px]' : ''
            }`}
        >
            <div className="relative flex items-center justify-center">
                <AiSessionsIconWithShape className="w-[72px] h-auto" />
                <IonSpinner
                    name="crescent"
                    color="dark"
                    className="absolute -inset-3 w-[96px] h-[96px] opacity-70"
                />
            </div>
            <p className="text-grayscale-800 font-poppins font-semibold text-[16px] m-0">
                Spinning up your session...
            </p>
        </div>
    );
};

export default TopicNewSessionGate;
