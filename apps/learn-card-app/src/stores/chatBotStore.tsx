import { useEffect } from 'react';
import { createStore } from '@udecode/zustood';

import { NewAiSessionStepEnum } from '../components/new-ai-session/newAiSession.helpers';
import {
    ChatBotQA,
    newSessionQAInitState,
    existingSessionQAInitState,
} from '../components/new-ai-session/NewAiSessionChatBot/newAiSessionChatbot.helpers';

import { 
    messages, 
    currentThreadId, 
    isTyping, 
    isLoading, 
    isEndingSession, 
    showEndingSessionLoader, 
    activeQuestions, 
    suggestedTopics, 
    topicCredentials, 
    sessionEnded, 
    planReady, 
    planReadyThread,
    disconnectWebSocket
} from 'learn-card-base/stores/nanoStores/chatStore';

export const chatBotStore = createStore('chatBotStore')<{
    chatBotSelected: NewAiSessionStepEnum | null;
    activeStep: NewAiSessionStepEnum;
    startInternalAiChatBot: boolean;
    chatBotQA: ChatBotQA[];
    existingChatBotQA: ChatBotQA[];
    visibleIndexes: number[];
    typingIndex: number | null;
    search: string | null | undefined;
}>(
    {
        activeStep: NewAiSessionStepEnum.topicSelector,
        chatBotSelected: null,
        startInternalAiChatBot: false,
        chatBotQA: newSessionQAInitState,
        existingChatBotQA: existingSessionQAInitState,
        visibleIndexes: [],
        typingIndex: null,
        search: '',
    },
    { persist: { name: 'chatBotStore', enabled: true } }
).extendActions(set => ({
    // AiSessionTopicsContainer
    setChatBotSelected: (step: NewAiSessionStepEnum | null) => {
        set.chatBotSelected(step);
    },
    // NewAiSessionContainer
    setActiveStep: (step: NewAiSessionStepEnum) => {
        set.activeStep(step);
    },
    setStartInternalAiChatBot: (startInternalAiChatBot: boolean) => {
        set.startInternalAiChatBot(startInternalAiChatBot);
    },
    // NewAiSessionChatBotContainer
    setChatBotQA: (next: ChatBotQA[] | ((prev: ChatBotQA[]) => ChatBotQA[])) => {
        const prev = chatBotStore.get.chatBotQA();
        const value =
            typeof next === 'function' ? (next as (p: ChatBotQA[]) => ChatBotQA[])(prev) : next;
        set.chatBotQA(value);
    },
    setExistingChatBotQA: (next: ChatBotQA[] | ((prev: ChatBotQA[]) => ChatBotQA[])) => {
        const prev = chatBotStore.get.existingChatBotQA();
        const value =
            typeof next === 'function' ? (next as (p: ChatBotQA[]) => ChatBotQA[])(prev) : next;
        set.existingChatBotQA(value);
    },
    setVisibleIndexes: (next: number[] | ((prev: number[]) => number[])) => {
        const prev = chatBotStore.get.visibleIndexes();
        const value = typeof next === 'function' ? (next as (p: number[]) => number[])(prev) : next;
        set.visibleIndexes(value);
    },
    setTypingIndex: (typingIndex: number | null) => {
        set.typingIndex(typingIndex);
    },
    setSearch: (search: string | null | undefined) => {
        set.search(search);
    },
    resetStore: () => {
        // Reset local store state
        set.activeStep(NewAiSessionStepEnum.topicSelector);
        set.chatBotSelected(null);
        set.startInternalAiChatBot(false);
        set.chatBotQA(newSessionQAInitState);
        set.existingChatBotQA(existingSessionQAInitState);
        set.visibleIndexes([]);
        set.typingIndex(null);
        
        // Reset chat store state
        messages.set([]);
        currentThreadId.set(null);
        isTyping.set(false);
        isLoading.set(false);
        isEndingSession.set(false);
        showEndingSessionLoader.set(false);
        activeQuestions.set([]);
        suggestedTopics.set([]);
        topicCredentials.set([]);
        sessionEnded.set(false);
        planReady.set(false);
        planReadyThread.set(null);
        
        // Disconnect WebSocket
        disconnectWebSocket();
    },
}));

// Guard to ensure we only initialize once per page load
let __didInitChatBotQA = false;

export const useChatBotQA = (initialState?: ChatBotQA[]) => {
    useEffect(() => {
        if (__didInitChatBotQA) return; // already initialized in this runtime

        const existing = chatBotStore.get.chatBotQA();
        // If store already has any answers (hydrated or user progress), do not overwrite
        const hasUserProgress = Array.isArray(existing) && existing.some(q => q?.answer != null);

        if (!hasUserProgress && initialState && initialState.length) {
            chatBotStore.set.setChatBotQA(initialState);
        }

        __didInitChatBotQA = true;
    }, [initialState]);

    return { chatBotQA: chatBotStore.useTracked.chatBotQA() };
};

let __didInitChatBotQAExisting = false;

export const useChatBotQAExisting = (initialState?: ChatBotQA[]) => {
    useEffect(() => {
        if (__didInitChatBotQAExisting) return; // already initialized in this runtime

        const existing = chatBotStore.get.existingChatBotQA();
        // If store already has any answers (hydrated or user progress), do not overwrite
        const hasUserProgress = Array.isArray(existing) && existing.some(q => q?.answer != null);

        if (!hasUserProgress && initialState && initialState.length) {
            chatBotStore.set.setExistingChatBotQA(initialState);
        }

        __didInitChatBotQAExisting = true;
    }, [initialState]);

    return { chatBotQA: chatBotStore.useTracked.existingChatBotQA() };
};
