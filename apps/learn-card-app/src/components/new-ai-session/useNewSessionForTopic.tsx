import React from 'react';

import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ModalTypes, useGetCurrentLCNUser, useModal } from 'learn-card-base';
import { useWallet } from 'learn-card-base/hooks/useWallet';

import NewAiSessionContainer from './NewAiSessionContainer';
import { NewAiSessionStepEnum } from './newAiSession.helpers';
import {
    ChatBotQA,
    ChatBotQuestionsEnum,
} from './NewAiSessionChatBot/newAiSessionChatbot.helpers';
import { AiPassportAppsEnum } from '../ai-passport-apps/aiPassport-apps.helpers';
import {
    fetchLearningPathwaysForSession,
    learningPathwaysQueryKey,
} from './AiSessionLearningPathways/ai-learningPathways.helpers';
import { chatBotStore } from '../../stores/chatBotStore';

type AiAppContext = { type?: string; url?: string } | undefined;

const seedRevisitWithTopic = (topicUri: string, topicTitle?: string) => {
    chatBotStore.set.resetStore();

    const trimmed = topicTitle?.trim();
    const hasTitle = !!trimmed;

    const customQA: ChatBotQA[] = [
        {
            id: 0,
            question: null,
            answer: hasTitle ? `New Session for ${trimmed}` : 'Revisit Topic',
            phraseToEmphasize: undefined,
            hidden: true,
        },
        {
            id: 1,
            question: "Select a topic you'd like to continue.",
            answer: topicUri,
            type: ChatBotQuestionsEnum.ResumeTopic,
            phraseToEmphasize: 'Select a topic',
            hidden: hasTitle,
        },
        {
            id: 2,
            question: hasTitle
                ? `Choose a Learning Pathway for ${trimmed}!`
                : 'Choose a Learning Pathway!',
            answer: null,
            type: ChatBotQuestionsEnum.LearningPathway,
            phraseToEmphasize: hasTitle
                ? `Learning Pathway for ${trimmed}!`
                : 'Learning Pathway!',
        },
    ];

    chatBotStore.set.setExistingChatBotQA(customQA);
    chatBotStore.set.setChatBotSelected(NewAiSessionStepEnum.revisitTopic);
};

// Matches AiSessionsEmptyState's "Start a new session" click handler so the
// no-sessions path lands users directly in chat rather than opening the
// Revisit modal (whose pathway picker would just fall back to the same nav,
// leaving a stale modal stacked on the chat page).
const navToFreshChat = (
    history: ReturnType<typeof useHistory>,
    uri: string,
    app: AiAppContext,
    did?: string
) => {
    if (app?.type === AiPassportAppsEnum.learncardapp) {
        history.push(`/chats?topicUri=${encodeURIComponent(uri)}`);
    } else if (app?.url) {
        window.location.href = `${app.url}/chats?topicUri=${encodeURIComponent(
            uri
        )}&did=${encodeURIComponent(did ?? '')}`;
    } else {
        history.push(`/chats?topicUri=${encodeURIComponent(uri)}`);
    }
};

type TopicNewSessionParams = {
    topicUri: string;
    topicTitle?: string;
    sessionCount: number;
    firstSessionUri?: string;
    topicBoostUri?: string;
    app?: AiAppContext;
};

export const useNewSessionForTopicMobile = () => {
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });
    const history = useHistory();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return async ({
        topicUri,
        topicTitle,
        sessionCount,
        firstSessionUri,
        topicBoostUri,
        app,
    }: TopicNewSessionParams) => {
        if (!topicUri) return;

        // Pre-check pathways before opening the modal so we don't flash the
        // Revisit pill on topics that have no pathways. The picker inside
        // the modal would just fall back to the same nav anyway.
        const navTarget = topicBoostUri ?? topicUri;
        if (sessionCount === 0 || !firstSessionUri) {
            navToFreshChat(history, navTarget, app, currentLCNUser?.did);
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

            if (!pathways || pathways.length === 0) {
                navToFreshChat(history, navTarget, app, currentLCNUser?.did);
                return;
            }
        } catch {
            navToFreshChat(history, navTarget, app, currentLCNUser?.did);
            return;
        }

        seedRevisitWithTopic(topicUri, topicTitle);
        newModal(
            <NewAiSessionContainer shortCircuitStep={NewAiSessionStepEnum.revisitTopic} />,
            { hideButton: true },
            { mobile: ModalTypes.Right, desktop: ModalTypes.Right }
        );
    };
};

export const useNewSessionForTopicDesktop = () => {
    const history = useHistory();
    const { currentLCNUser } = useGetCurrentLCNUser();

    return (
        params: TopicNewSessionParams,
        setChatBotSelected: (step: NewAiSessionStepEnum) => void
    ) => {
        const { topicUri, topicTitle, sessionCount, topicBoostUri, app } = params;
        if (!topicUri) return;

        if (sessionCount === 0) {
            navToFreshChat(history, topicBoostUri ?? topicUri, app, currentLCNUser?.did);
            return;
        }

        seedRevisitWithTopic(topicUri, topicTitle);
        setChatBotSelected(NewAiSessionStepEnum.revisitTopic);
    };
};
