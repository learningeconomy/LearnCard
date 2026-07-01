import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IonContent, IonIcon, IonPage, IonPopover } from '@ionic/react';
import { alertCircleOutline, chevronDownOutline, filterOutline } from 'ionicons/icons';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { ErrorBoundary } from 'react-error-boundary';
import { CredentialCategoryEnum, useGetCurrentLCNUser } from 'learn-card-base';

import { AiFeatureGate } from '../../components/ai-feature-gate/AiFeatureGate';
import ErrorBoundaryFallback from '../../components/boost/boostErrors/BoostErrorsDisplay';
import MainHeader from '../../components/main-header/MainHeader';
import AssistantAgentChatModal from './AssistantAgentChatModal';
import AssistantCardDetailsModal from './AssistantCardDetailsModal';
import AssistantInboxCard from './AssistantInboxCard';
import AssistantMemoriesModal from './AssistantMemoriesModal';
import AssistantProfileCard from './AssistantProfileCard';
import { useConsentFlowByUri } from '../consentFlow/useConsentFlow';
import {
    createLearnCardAssistantDebugCard,
    fetchLearnCardAssistantCards,
    fetchLearnCardAssistantConsentContract,
    fetchLearnCardAssistantProfile,
    getInitialAgentUrl,
    markLearnCardAssistantCardRead,
    normalizeAgentUrl,
    sendLearnCardAssistantCardFeedback,
    updateLearnCardAssistantProfile,
    type CreateLearnCardAssistantDebugCardInput,
    type LearnCardAssistantCard,
    type LearnCardAssistantCardType,
    type LearnCardAssistantProfile,
} from './learnCardAssistant.api';
import { getActivityCards, getInboxCards } from './learnCardAssistant.helpers';
import {
    loadAssistantAvatarConfig,
    saveAssistantAvatarConfig,
    type AssistantAvatarConfig,
} from './assistantAvatarOptions';

const AssistantCardsSkeleton: React.FC = () => (
    <div className="space-y-3">
        {[0, 1, 2].map(index => (
            <div
                key={index}
                className="bg-white border border-grayscale-200 rounded-[20px] p-5 space-y-3 shadow-bottom-2-4 animate-pulse"
            >
                <div className="h-4 w-28 bg-grayscale-100 rounded-full" />
                <div className="h-5 w-3/4 bg-grayscale-100 rounded-full" />
                <div className="h-4 w-full bg-grayscale-100 rounded-full" />
                <div className="h-4 w-2/3 bg-grayscale-100 rounded-full" />
            </div>
        ))}
    </div>
);

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="rounded-[20px] border border-grayscale-200 bg-white p-8 text-center space-y-1 shadow-bottom-2-4">
        <p className="text-base font-semibold text-grayscale-900">{title}</p>
        <p className="text-sm text-grayscale-600 leading-relaxed">{description}</p>
    </div>
);

const AssistantPageMark: React.FC = () => (
    <div className="w-6 h-6 text-emerald-500 mt-1" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
            <path
                d="M12 3v5M12 16v5M3 12h5M16 12h5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2"
                stroke="#8B91A7"
                strokeWidth="1.75"
                strokeLinecap="round"
            />
        </svg>
    </div>
);

const CARD_TYPE_FILTERS: Array<{ value: 'all' | LearnCardAssistantCardType; label: string }> = [
    { value: 'all', label: 'All types' },
    { value: 'message', label: 'Messages' },
    { value: 'job-suggestion', label: 'Job suggestions' },
    { value: 'pathway-update', label: 'Pathway updates' },
    { value: 'action-item', label: 'Action items' },
];

const TEST_ASSISTANT_CARDS: CreateLearnCardAssistantDebugCardInput[] = [
    {
        dedupeKey: 'debug:assistant:message',
        type: 'message',
        title: 'Quick check-in and next steps',
        description: 'I reviewed your recent activity and think you are on the right track.',
        detail: 'Want to explore data analyst roles next, or focus on completing your SQL lesson?',
        priority: 'normal',
        cta: { label: 'Open chat', href: '#assistant-chat' },
    },
    {
        dedupeKey: 'debug:assistant:job-suggestion',
        type: 'job-suggestion',
        title: 'Entry-Level Data Analyst',
        description:
            'Based on your skills in SQL, Excel, and data visualization, this role is a strong match.',
        detail: 'Estimated salary range: $55k–$70k • Remote • Full-time',
        priority: 'normal',
    },
    {
        dedupeKey: 'debug:assistant:pathway-update',
        type: 'pathway-update',
        title: 'Data Analyst Pathway Progress',
        description: 'You completed 3 of 4 steps in Build My LearnCard.',
        detail: 'One step away from unlocking recommended job matches.',
        priority: 'high',
    },
];

const MyAssistantPageContent: React.FC = () => {
    const flags = useFlags();
    const queryClient = useQueryClient();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const currentDid = currentLCNUser?.did;
    const normalizedAgentUrl = useMemo(() => normalizeAgentUrl(getInitialAgentUrl()), []);
    const [activeTab, setActiveTab] = useState<'inbox' | 'activity'>('inbox');
    const [memoriesOpen, setMemoriesOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterPopoverEvent, setFilterPopoverEvent] = useState<Event | undefined>();
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [typeFilter, setTypeFilter] = useState<'all' | LearnCardAssistantCardType>('all');
    const [selectedCard, setSelectedCard] = useState<LearnCardAssistantCard | undefined>();
    const [chatOpen, setChatOpen] = useState(false);
    const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>();
    const showDebugSeedButton = import.meta.env.DEV || Boolean(flags.enableLearnCardAssistantDebug);
    const [avatarConfig, setAvatarConfig] = useState<AssistantAvatarConfig>(() =>
        loadAssistantAvatarConfig(currentDid)
    );
    const [contractUri, setContractUri] = useState('');
    const [openContractWhenLoaded, setOpenContractWhenLoaded] = useState(false);
    const [isFetchingContract, setIsFetchingContract] = useState(false);
    const [actionError, setActionError] = useState('');
    const { contract, contractLoading, openConsentFlowModal } = useConsentFlowByUri(
        contractUri || undefined
    );
    const cardsQueryKey = ['learncard-assistant-cards', currentDid, normalizedAgentUrl];
    const profileQueryKey = ['learncard-assistant-profile', currentDid, normalizedAgentUrl];
    const {
        data: cards = [],
        isLoading: cardsLoading,
        isError: cardsError,
        refetch: refetchCards,
    } = useQuery<LearnCardAssistantCard[]>({
        queryKey: cardsQueryKey,
        queryFn: () => fetchLearnCardAssistantCards(normalizedAgentUrl, currentDid!, 50),
        enabled: Boolean(currentDid),
        refetchInterval: 60_000,
    });
    const { data: profile } = useQuery<LearnCardAssistantProfile>({
        queryKey: profileQueryKey,
        queryFn: () => fetchLearnCardAssistantProfile(normalizedAgentUrl, currentDid!),
        enabled: Boolean(currentDid),
    });
    const updateProfileMutation = useMutation({
        mutationFn: (input: { name?: string; personality?: string }) => {
            if (!currentDid) throw new Error('Sign in with a network profile to save changes.');

            return updateLearnCardAssistantProfile(normalizedAgentUrl, currentDid, input);
        },
        onSuccess: updatedProfile => {
            queryClient.setQueryData(profileQueryKey, updatedProfile);
            setActionError('');
        },
        onError: error => {
            setActionError(
                error instanceof Error ? error.message : 'Could not update assistant profile.'
            );
        },
    });
    const markReadMutation = useMutation({
        mutationFn: (id: string) =>
            markLearnCardAssistantCardRead(normalizedAgentUrl, currentDid!, id),
        onSuccess: updatedCard => {
            queryClient.setQueryData<LearnCardAssistantCard[]>(cardsQueryKey, currentCards =>
                (currentCards ?? []).map(card => (card.id === updatedCard.id ? updatedCard : card))
            );
        },
    });
    const feedbackMutation = useMutation({
        mutationFn: (id: string) =>
            sendLearnCardAssistantCardFeedback(normalizedAgentUrl, currentDid!, id),
        onSuccess: updatedCard => {
            queryClient.setQueryData<LearnCardAssistantCard[]>(cardsQueryKey, currentCards =>
                (currentCards ?? []).map(card => (card.id === updatedCard.id ? updatedCard : card))
            );
        },
    });
    const debugSeedMutation = useMutation({
        mutationFn: async () => {
            if (!currentDid) throw new Error('Sign in with a network profile to seed test cards.');

            return Promise.all(
                TEST_ASSISTANT_CARDS.map(card =>
                    createLearnCardAssistantDebugCard(normalizedAgentUrl, currentDid, card)
                )
            );
        },
        onSuccess: createdCards => {
            queryClient.setQueryData<LearnCardAssistantCard[]>(cardsQueryKey, currentCards => {
                const merged = new Map((currentCards ?? []).map(card => [card.id, card]));

                for (const card of createdCards) merged.set(card.id, card);

                return [...merged.values()];
            });
            setActionError('');
        },
        onError: error => {
            setActionError(
                error instanceof Error ? error.message : 'Could not create assistant test cards.'
            );
        },
    });

    useEffect(() => {
        if (!openContractWhenLoaded || !contractUri || contractLoading || !contract) return;

        openConsentFlowModal(true, undefined, undefined, undefined, true);
        setOpenContractWhenLoaded(false);
    }, [contract, contractLoading, contractUri, openConsentFlowModal, openContractWhenLoaded]);

    useEffect(() => {
        setAvatarConfig(loadAssistantAvatarConfig(currentDid));
    }, [currentDid]);

    const updateAvatarConfig = (config: AssistantAvatarConfig): void => {
        setAvatarConfig(config);
        saveAssistantAvatarConfig(config, currentDid);
    };

    const openChatModal = (prompt?: string): void => {
        setChatInitialPrompt(prompt);
        setChatOpen(true);
    };

    const closeDetailsModal = (): void => {
        const card = selectedCard;

        setSelectedCard(undefined);
        if (card && !card.readAt) void markReadMutation.mutateAsync(card.id);
    };

    const openConsent = async (): Promise<void> => {
        setActionError('');
        setIsFetchingContract(true);

        try {
            const contract = await fetchLearnCardAssistantConsentContract(normalizedAgentUrl);

            setContractUri(contract.uri);
            setOpenContractWhenLoaded(true);
        } catch (error) {
            setActionError(
                error instanceof Error ? error.message : 'Could not load shared data settings.'
            );
        } finally {
            setIsFetchingContract(false);
        }
    };

    const activeCards = useMemo(() => {
        const visibleCards = activeTab === 'inbox' ? getInboxCards(cards) : getActivityCards(cards);
        const filteredCards =
            typeFilter === 'all'
                ? visibleCards
                : visibleCards.filter(card => card.type === typeFilter);

        return sortOrder === 'newest' ? filteredCards : [...filteredCards].reverse();
    }, [activeTab, cards, sortOrder, typeFilter]);

    const activeTypeLabel =
        CARD_TYPE_FILTERS.find(option => option.value === typeFilter)?.label ?? 'All types';

    const filterSummary = `${activeTab === 'inbox' ? 'Unread' : 'All cards'} · ${
        sortOrder === 'newest' ? 'Newest first' : 'Oldest first'
    } · ${activeTypeLabel}`;

    return (
        <>
            <div className="w-full max-w-[864px] mx-auto px-4 pt-4 pb-10 font-poppins space-y-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <AssistantPageMark />
                        <div>
                            <h1 className="text-2xl font-semibold text-grayscale-900 mb-1">
                                My Assistant
                            </h1>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Your personal AI assistant for career growth and support.
                            </p>
                        </div>
                    </div>

                    {showDebugSeedButton && (
                        <button
                            type="button"
                            onClick={() => debugSeedMutation.mutate()}
                            disabled={!currentDid || debugSeedMutation.isPending}
                            className="py-3 px-4 rounded-[20px] border border-amber-100 bg-amber-50 text-amber-700 font-medium text-sm hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {debugSeedMutation.isPending ? 'Sending...' : 'Send test cards'}
                        </button>
                    )}
                </div>

                {actionError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-red-400 text-lg mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-red-700 leading-relaxed">{actionError}</span>
                    </div>
                )}

                <AssistantProfileCard
                    profile={profile}
                    avatarConfig={avatarConfig}
                    disabled={false}
                    isSaving={updateProfileMutation.isPending}
                    isLoadingConsent={
                        isFetchingContract || (openContractWhenLoaded && contractLoading)
                    }
                    onSave={async input => updateProfileMutation.mutateAsync(input)}
                    onAvatarChange={updateAvatarConfig}
                    onOpenChat={() => openChatModal()}
                    onOpenMemories={() => setMemoriesOpen(true)}
                    onOpenConsent={openConsent}
                />

                <section className="space-y-5">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                                Assistant Inbox
                            </h2>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Updates and recommendations from your assistant.
                            </p>
                            <p className="text-xs text-grayscale-500 mt-1">{filterSummary}</p>
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={event => {
                                    setFilterPopoverEvent(event.nativeEvent);
                                    setFilterOpen(true);
                                }}
                                className="shrink-0 inline-flex items-center gap-2 py-3 px-4 rounded-[20px] border border-grayscale-300 bg-white text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                            >
                                <IonIcon icon={filterOutline} className="text-lg" />
                                Filter
                                <IonIcon icon={chevronDownOutline} className="text-base" />
                            </button>

                            <IonPopover
                                isOpen={filterOpen}
                                event={filterPopoverEvent}
                                reference="event"
                                onDidDismiss={() => {
                                    setFilterOpen(false);
                                    setFilterPopoverEvent(undefined);
                                }}
                                className="assistant-filter-popover"
                            >
                                <div className="w-[280px] rounded-[20px] border border-grayscale-200 bg-white p-4 shadow-bottom-2-4 space-y-4 font-poppins">
                                    <div>
                                        <p className="text-xs font-medium text-grayscale-700 mb-2">
                                            Show
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['inbox', 'activity'] as const).map(value => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setActiveTab(value)}
                                                    className={`py-2.5 px-3 rounded-[20px] text-sm font-medium transition-colors ${
                                                        activeTab === value
                                                            ? 'bg-grayscale-900 text-white'
                                                            : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                                    }`}
                                                >
                                                    {value === 'inbox' ? 'Unread' : 'All cards'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-grayscale-700 mb-2">
                                            Sort
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['newest', 'oldest'] as const).map(value => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setSortOrder(value)}
                                                    className={`py-2.5 px-3 rounded-[20px] text-sm font-medium transition-colors ${
                                                        sortOrder === value
                                                            ? 'bg-grayscale-900 text-white'
                                                            : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                                    }`}
                                                >
                                                    {value === 'newest' ? 'Newest' : 'Oldest'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="assistant-card-type-filter"
                                            className="block text-xs font-medium text-grayscale-700 mb-2"
                                        >
                                            Card type
                                        </label>
                                        <select
                                            id="assistant-card-type-filter"
                                            value={typeFilter}
                                            onChange={event =>
                                                setTypeFilter(
                                                    event.target.value as
                                                        | 'all'
                                                        | LearnCardAssistantCardType
                                                )
                                            }
                                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                        >
                                            {CARD_TYPE_FILTERS.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </IonPopover>
                        </div>
                    </div>

                    {cardsLoading ? (
                        <AssistantCardsSkeleton />
                    ) : cardsError ? (
                        <div className="space-y-3">
                            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                                <IonIcon
                                    icon={alertCircleOutline}
                                    className="text-red-400 text-lg mt-0.5 shrink-0"
                                />
                                <span className="text-sm text-red-700 leading-relaxed">
                                    Assistant updates are unavailable right now.
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => void refetchCards()}
                                className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : activeCards.length === 0 ? (
                        activeTab === 'inbox' ? (
                            <EmptyState
                                title="You're all caught up."
                                description="New updates from your assistant will appear here."
                            />
                        ) : (
                            <EmptyState
                                title="No updates yet."
                                description="Your assistant will post updates after it runs."
                            />
                        )
                    ) : (
                        <div className="space-y-3">
                            {activeCards.map(card => (
                                <AssistantInboxCard
                                    key={card.id}
                                    avatarConfig={avatarConfig}
                                    card={card}
                                    onMarkRead={async id => {
                                        await markReadMutation.mutateAsync(id);
                                    }}
                                    onFeedback={async id => {
                                        await feedbackMutation.mutateAsync(id);
                                    }}
                                    onOpenDetails={setSelectedCard}
                                    onOpenChat={openChatModal}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <AssistantCardDetailsModal
                card={selectedCard}
                open={Boolean(selectedCard)}
                onClose={closeDetailsModal}
                onOpenChat={prompt => openChatModal(prompt)}
            />

            <AssistantAgentChatModal
                agentUrl={normalizedAgentUrl}
                avatarConfig={avatarConfig}
                consentFlowContractUri={contractUri || undefined}
                did={currentDid}
                initialPrompt={chatInitialPrompt}
                open={chatOpen}
                title={profile?.name ?? 'My Assistant'}
                onClose={() => setChatOpen(false)}
            />

            <AssistantMemoriesModal
                open={memoriesOpen}
                agentUrl={normalizedAgentUrl}
                did={currentDid}
                onClose={() => setMemoriesOpen(false)}
            />
        </>
    );
};

const MyAssistantPage: React.FC = () => (
    <IonPage className="bg-grayscale-100">
        <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
            <IonContent
                fullscreen
                className="bg-grayscale-100"
                style={{ '--background': '#EFF0F5' } as React.CSSProperties}
            >
                <MainHeader
                    category={CredentialCategoryEnum.aiPathway}
                    curvedBg={false}
                    hidePlusBtn={true}
                />
                <AiFeatureGate>
                    <MyAssistantPageContent />
                </AiFeatureGate>
            </IonContent>
        </ErrorBoundary>
    </IonPage>
);

export default MyAssistantPage;
