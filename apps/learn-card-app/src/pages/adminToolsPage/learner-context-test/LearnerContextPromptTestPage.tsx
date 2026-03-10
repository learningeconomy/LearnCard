import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';

import { IonSpinner } from '@ionic/react';
import type { VC } from '@learncard/types';
import { useQueryClient } from '@tanstack/react-query';

import {
    CREDENTIAL_CATEGORIES,
    LEARNCARD_AI_URL,
    ModalTypes,
    useGetCredentialCount,
    useModal,
    useToast,
    useWallet,
} from 'learn-card-base';
import type { CredentialCategory } from 'learn-card-base';

import AdminPageStructure from '../AdminPageStructure';
import AdminToolsLearnerContextCredentialSelectorModal from './AdminToolsLearnerContextCredentialSelectorModal';
import { getInfoFromContractKey } from '../../../helpers/contract.helpers';

const LEARNER_CONTEXT_BACKEND_URL_KEY = 'learncard-admin-learner-context-backend-url';

type LearnerContextResponse = {
    prompt: string;
    metadata?: Record<string, unknown>;
    structuredContext?: unknown;
    [key: string]: unknown;
};

const getLearnerContextEndpoint = (baseUrl: string) => {
    const trimmed = baseUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/ai/learner-context/format')
        ? trimmed
        : `${trimmed}/ai/learner-context/format`;
};

const parseJsonObject = (value: string, fieldName: string) => {
    if (!value.trim()) return {};

    const parsed = JSON.parse(value);

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error(`${fieldName} must be a JSON object.`);
    }

    return parsed as Record<string, unknown>;
};

type CategorySelectionRowProps = {
    category: string;
    selectedCount: number;
    onOpen: () => void;
};

const CategorySelectionRow: FC<CategorySelectionRowProps> = ({
    category,
    selectedCount,
    onOpen,
}) => {
    const { data: count } = useGetCredentialCount(category as CredentialCategory);
    const { IconComponent, iconSrc, title, iconClassName, iconCircleClass } =
        getInfoFromContractKey(category);

    if (!count) return null;

    return (
        <button
            type="button"
            onClick={onOpen}
            className="w-full flex items-center gap-[12px] rounded-[16px] bg-white px-[14px] py-[14px] shadow-box-bottom text-left hover:bg-grayscale-50 transition-colors"
        >
            <div
                className={`flex items-center justify-center h-[42px] w-[42px] rounded-full shrink-0 ${iconCircleClass}`}
            >
                {iconSrc ? (
                    <img src={iconSrc} alt="" className="h-[28px] w-[28px] text-white" />
                ) : (
                    <IconComponent className={`h-[28px] w-[28px] ${iconClassName}`} />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-[600] font-notoSans text-grayscale-900 line-clamp-1">
                    {title}
                </h3>
                <p className="text-[14px] text-grayscale-600 font-notoSans">
                    {selectedCount > 0
                        ? `${selectedCount} selected of ${count}`
                        : `${count} available`}
                </p>
            </div>

            <span className="text-[14px] font-[600] font-notoSans text-emerald-700 shrink-0">
                {selectedCount > 0 ? 'Edit' : 'Choose'}
            </span>
        </button>
    );
};

const LearnerContextPromptTestPage: FC = () => {
    const { initWallet } = useWallet();
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });
    const { presentToast } = useToast();
    const queryClient = useQueryClient();

    const [backendUrl, setBackendUrl] = useState(LEARNCARD_AI_URL);
    const [instructions, setInstructions] = useState('');
    const [detailLevel, setDetailLevel] = useState<'compact' | 'expanded'>('compact');
    const [personalDataJson, setPersonalDataJson] = useState('');
    const [additionalContextJson, setAdditionalContextJson] = useState('');
    const [selectedByCategory, setSelectedByCategory] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [response, setResponse] = useState<LearnerContextResponse | null>(null);
    const [responseError, setResponseError] = useState<string | null>(null);

    useEffect(() => {
        const savedBackendUrl = localStorage.getItem(LEARNER_CONTEXT_BACKEND_URL_KEY);
        if (savedBackendUrl) setBackendUrl(savedBackendUrl);
    }, []);

    const categories = useMemo(() => Array.from(new Set(CREDENTIAL_CATEGORIES)), []);
    const selectedUris = useMemo(
        () => Object.values(selectedByCategory).flat(),
        [selectedByCategory]
    );
    const selectedCount = selectedUris.length;
    const selectedCategoryCount = Object.values(selectedByCategory).filter(
        categoryUris => categoryUris.length > 0
    ).length;

    const updateCategorySelection = (category: string, uris: string[]) => {
        setSelectedByCategory(current => {
            if (uris.length === 0) {
                const { [category]: _removed, ...rest } = current;
                return rest;
            }

            return { ...current, [category]: uris };
        });
    };

    const handleOpenCategory = (category: string) => {
        newModal(
            <AdminToolsLearnerContextCredentialSelectorModal
                category={category}
                selectedUris={selectedByCategory[category] ?? []}
                onSave={uris => updateCategorySelection(category, uris)}
            />,
            {},
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handleSelectAllCategories = async () => {
        presentToast('Loading all credentials from all categories...');
        try {
            const wallet = await initWallet();
            const allCredentialsByCategory: Record<string, string[]> = {};

            for (const category of categories) {
                const infiniteData = await queryClient.fetchInfiniteQuery({
                    queryKey: ['useGetCredentialList', '', category],
                    queryFn: async ({ pageParam }) => {
                        const data = await wallet.index.LearnCloud.getPage?.(
                            { category: category as CredentialCategory },
                            { cursor: pageParam, limit: 50 }
                        );
                        return data ?? { records: [], hasMore: false };
                    },
                    initialPageParam: undefined as undefined | string,
                    getNextPageParam: (lastPage: { hasMore?: boolean; cursor?: string }) =>
                        lastPage?.hasMore ? lastPage?.cursor : undefined,
                });

                const allRecords = infiniteData.pages.flatMap(
                    (page: { records?: { uri: string }[] }) => page.records ?? []
                );
                const uris = allRecords.map((record: { uri: string }) => record.uri);

                if (uris.length > 0) {
                    allCredentialsByCategory[category] = uris;
                }
            }

            setSelectedByCategory(allCredentialsByCategory);
            const totalSelected = Object.values(allCredentialsByCategory).flat().length;
            presentToast(
                `Selected ${totalSelected} credentials across ${
                    Object.keys(allCredentialsByCategory).length
                } categories.`
            );
        } catch (error) {
            console.error('Failed to load credentials:', error);
            presentToast(
                `Failed to load credentials: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    };

    const handleClearAllCategories = () => {
        setSelectedByCategory({});
        presentToast('Cleared all selections.');
    };

    const handleSubmit = async () => {
        if (!backendUrl.trim()) {
            presentToast('Please enter a backend URL.');
            return;
        }

        if (selectedCount === 0) {
            presentToast('Select at least one credential to send.');
            return;
        }

        setIsSubmitting(true);
        setResponse(null);
        setResponseError(null);

        try {
            const personalData = parseJsonObject(personalDataJson, 'Personal data');
            const additionalContext = parseJsonObject(additionalContextJson, 'Additional context');
            const wallet = await initWallet();
            const credentials = (
                await Promise.all(selectedUris.map(uri => wallet.read.get(uri)))
            ).filter(Boolean) as VC[];

            const endpoint = getLearnerContextEndpoint(backendUrl);

            localStorage.setItem(LEARNER_CONTEXT_BACKEND_URL_KEY, backendUrl);

            const result = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credentials,
                    personalData,
                    additionalContext,
                    instructions: instructions.trim() || undefined,
                    detailLevel,
                    includeStructuredContext: true,
                    maxCredentials: credentials.length,
                }),
            });

            const data = (await result.json().catch(() => null)) as
                | LearnerContextResponse
                | { error?: string }
                | null;

            if (!result.ok) {
                const errorMessage =
                    data &&
                    'error' in data &&
                    typeof data.error === 'string' &&
                    data.error.trim().length > 0
                        ? data.error
                        : 'Request failed';
                throw new Error(errorMessage);
            }

            setResponse(data as LearnerContextResponse);
            presentToast('Learner context response received.');
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Failed to generate learner context.';
            setResponse(null);
            setResponseError(message);
            presentToast(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminPageStructure title="Learner Context Test UX">
            <section className="w-full max-w-[1080px] flex flex-col gap-[20px]">
                <div className="bg-white rounded-[20px] shadow-box-bottom p-[20px] flex flex-col gap-[14px]">
                    <div>
                        <h2 className="text-[22px] font-[600] font-notoSans text-grayscale-900">
                            Backend Request
                        </h2>
                        <p className="text-[14px] text-grayscale-600 font-notoSans mt-[4px]">
                            Pick a backend URL, choose wallet credentials, and send a full learner
                            context formatting request.
                        </p>
                    </div>

                    <label className="flex flex-col gap-[8px]">
                        <span className="text-[14px] font-[600] font-notoSans text-grayscale-800">
                            LearnCard Backend URL
                        </span>
                        <input
                            value={backendUrl}
                            onChange={event => setBackendUrl(event.target.value)}
                            placeholder={LEARNCARD_AI_URL}
                            className="rounded-[14px] border border-grayscale-200 bg-grayscale-50 px-[14px] py-[12px] text-[15px] font-notoSans text-grayscale-900 outline-none focus:border-emerald-600"
                        />
                    </label>

                    <div className="grid gap-[14px] lg:grid-cols-2">
                        <label className="flex flex-col gap-[8px]">
                            <span className="text-[14px] font-[600] font-notoSans text-grayscale-800">
                                Prompt Instructions
                            </span>
                            <textarea
                                value={instructions}
                                onChange={event => setInstructions(event.target.value)}
                                placeholder="Optional extra guidance for the formatter"
                                rows={4}
                                className="rounded-[14px] border border-grayscale-200 bg-grayscale-50 px-[14px] py-[12px] text-[15px] font-notoSans text-grayscale-900 outline-none focus:border-emerald-600 resize-y"
                            />
                        </label>

                        <div className="flex flex-col gap-[12px]">
                            <span className="text-[14px] font-[600] font-notoSans text-grayscale-800">
                                Detail Level
                            </span>
                            <div className="flex gap-[10px]">
                                {(['compact', 'expanded'] as const).map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setDetailLevel(option)}
                                        className={`rounded-full px-[16px] py-[10px] text-[14px] font-[600] font-notoSans border transition-colors ${
                                            detailLevel === option
                                                ? 'bg-emerald-700 border-emerald-700 text-white'
                                                : 'bg-white border-grayscale-200 text-grayscale-700'
                                        }`}
                                    >
                                        {option === 'compact' ? 'Compact' : 'Expanded'}
                                    </button>
                                ))}
                            </div>

                            <div className="rounded-[14px] bg-grayscale-50 border border-grayscale-200 p-[14px]">
                                <p className="text-[14px] text-grayscale-700 font-notoSans">
                                    Selected credentials: <strong>{selectedCount}</strong> across{' '}
                                    <strong>{selectedCategoryCount}</strong> categories.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-[14px] lg:grid-cols-2">
                        <label className="flex flex-col gap-[8px]">
                            <span className="text-[14px] font-[600] font-notoSans text-grayscale-800">
                                Personal Data JSON
                            </span>
                            <textarea
                                value={personalDataJson}
                                onChange={event => setPersonalDataJson(event.target.value)}
                                placeholder={'{"name":"Taylor"}'}
                                rows={5}
                                className="rounded-[14px] border border-grayscale-200 bg-grayscale-50 px-[14px] py-[12px] text-[14px] font-mono text-grayscale-900 outline-none focus:border-emerald-600 resize-y"
                            />
                        </label>

                        <label className="flex flex-col gap-[8px]">
                            <span className="text-[14px] font-[600] font-notoSans text-grayscale-800">
                                Additional Context JSON
                            </span>
                            <textarea
                                value={additionalContextJson}
                                onChange={event => setAdditionalContextJson(event.target.value)}
                                placeholder={'{"goal":"Test tutor context formatting"}'}
                                rows={5}
                                className="rounded-[14px] border border-grayscale-200 bg-grayscale-50 px-[14px] py-[12px] text-[14px] font-mono text-grayscale-900 outline-none focus:border-emerald-600 resize-y"
                            />
                        </label>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] shadow-box-bottom p-[20px] flex flex-col gap-[16px]">
                    <div className="flex flex-col gap-[4px]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[22px] font-[600] font-notoSans text-grayscale-900">
                                Choose Credentials
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAllCategories}
                                    className="rounded-full bg-emerald-700 text-white px-4 py-2 text-sm font-[600] font-notoSans"
                                >
                                    Select All Categories
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearAllCategories}
                                    disabled={selectedCount === 0}
                                    className="rounded-full border border-grayscale-200 bg-white px-4 py-2 text-sm font-[600] font-notoSans disabled:opacity-50"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                        <p className="text-[14px] text-grayscale-600 font-notoSans">
                            This mirrors the ConsentFlow credential-picking experience, but nothing
                            is shared or persisted. It only builds a one-off request payload.
                        </p>
                    </div>

                    <div className="grid gap-[12px] md:grid-cols-2 xl:grid-cols-3">
                        {categories.map(category => (
                            <CategorySelectionRow
                                key={category}
                                category={category}
                                selectedCount={selectedByCategory[category]?.length ?? 0}
                                onOpen={() => handleOpenCategory(category)}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="min-w-[220px] rounded-full bg-emerald-700 text-white px-[24px] py-[14px] text-[16px] font-[600] font-notoSans disabled:opacity-50 flex items-center justify-center gap-[10px]"
                    >
                        {isSubmitting && (
                            <IonSpinner name="crescent" className="w-[18px] h-[18px]" />
                        )}
                        {isSubmitting ? 'Generating Context...' : 'Send Test Request'}
                    </button>
                </div>

                {(response || responseError) && (
                    <div className="bg-white rounded-[20px] shadow-box-bottom p-[20px] flex flex-col gap-[16px]">
                        <div>
                            <h2 className="text-[22px] font-[600] font-notoSans text-grayscale-900">
                                Backend Response
                            </h2>
                            <p className="text-[14px] text-grayscale-600 font-notoSans mt-[4px]">
                                Full response from the learner context formatting endpoint.
                            </p>
                        </div>

                        {responseError && (
                            <div className="rounded-[16px] border border-red-200 bg-red-50 px-[16px] py-[14px] text-red-700 text-[14px] font-notoSans">
                                {responseError}
                            </div>
                        )}

                        {response?.prompt && (
                            <div className="rounded-[16px] border border-grayscale-200 bg-grayscale-50 px-[16px] py-[14px]">
                                <h3 className="text-[16px] font-[600] font-notoSans text-grayscale-900 mb-[8px]">
                                    Prompt
                                </h3>
                                <pre className="whitespace-pre-wrap break-words text-[14px] leading-[1.6] font-notoSans text-grayscale-800">
                                    {response.prompt}
                                </pre>
                            </div>
                        )}

                        {response && (
                            <div
                                className="rounded-[16px] border border-grayscale-200 px-[16px] py-[14px] overflow-x-auto"
                                style={{ backgroundColor: '#0f172a' }}
                            >
                                <pre
                                    className="text-[13px] leading-[1.6] font-mono whitespace-pre-wrap break-words"
                                    style={{ color: '#f8fafc' }}
                                >
                                    {JSON.stringify(response, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </AdminPageStructure>
    );
};

export default LearnerContextPromptTestPage;
