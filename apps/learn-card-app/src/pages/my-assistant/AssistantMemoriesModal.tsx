import React, { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, closeOutline } from 'ionicons/icons';

import {
    approveLearnCardAssistantMemory,
    archiveLearnCardAssistantMemory,
    fetchLearnCardAssistantMemories,
    type LearnCardAssistantMemoryDoc,
    type LearnCardAssistantAuth,
} from './learnCardAssistant.api';

const STATUS_LABELS: Record<LearnCardAssistantMemoryDoc['status'], string> = {
    proposed: 'Proposed',
    active: 'Active',
    archived: 'Archived',
};

const STATUS_ORDER: LearnCardAssistantMemoryDoc['status'][] = ['proposed', 'active', 'archived'];

export const AssistantMemoriesModal: React.FC<{
    open: boolean;
    agentUrl: string;
    auth?: LearnCardAssistantAuth;
    onClose: () => void;
}> = ({ open, agentUrl, auth, onClose }) => {
    const queryClient = useQueryClient();
    const queryKey = ['learncard-assistant-memories', auth?.did, agentUrl];
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey,
        queryFn: () => fetchLearnCardAssistantMemories(agentUrl, auth!),
        enabled: open && Boolean(auth),
    });
    const approveMutation = useMutation({
        mutationFn: (name: string) => approveLearnCardAssistantMemory(agentUrl, auth!, name),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
    const archiveMutation = useMutation({
        mutationFn: (name: string) => archiveLearnCardAssistantMemory(agentUrl, auth!, name),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
    const docsByStatus = useMemo(() => {
        const grouped: Record<
            LearnCardAssistantMemoryDoc['status'],
            LearnCardAssistantMemoryDoc[]
        > = {
            proposed: [],
            active: [],
            archived: [],
        };

        for (const doc of data?.docs ?? []) grouped[doc.status].push(doc);

        return grouped;
    }, [data?.docs]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-grayscale-900/50 flex items-center justify-center p-4 font-poppins">
            <section className="w-full max-w-[720px] max-h-[88vh] overflow-hidden bg-white rounded-[20px] shadow-2xl flex flex-col animate-fade-in-up">
                <div className="p-5 border-b border-grayscale-200 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">Memories</h2>

                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Review what your assistant can remember.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full text-grayscale-500 hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors"
                        aria-label="Close memories"
                    >
                        <IonIcon icon={closeOutline} className="text-xl" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-5">
                    {data?.manifest?.counts && (
                        <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-2xl bg-grayscale-100 p-3 text-center">
                                <p className="text-lg font-semibold text-grayscale-900">
                                    {data.manifest.counts.proposed}
                                </p>
                                <p className="text-xs text-grayscale-500">Proposed</p>
                            </div>
                            <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                                <p className="text-lg font-semibold text-emerald-700">
                                    {data.manifest.counts.active}
                                </p>
                                <p className="text-xs text-emerald-700">Active</p>
                            </div>
                            <div className="rounded-2xl bg-grayscale-100 p-3 text-center">
                                <p className="text-lg font-semibold text-grayscale-900">
                                    {data.manifest.counts.archived}
                                </p>
                                <p className="text-xs text-grayscale-500">Archived</p>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map(index => (
                                <div
                                    key={index}
                                    className="rounded-[20px] border border-grayscale-200 p-4 space-y-3 animate-pulse"
                                >
                                    <div className="h-4 w-28 bg-grayscale-100 rounded-full" />
                                    <div className="h-4 w-3/4 bg-grayscale-100 rounded-full" />
                                    <div className="h-4 w-full bg-grayscale-100 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="space-y-3">
                            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                                <IonIcon
                                    icon={alertCircleOutline}
                                    className="text-red-400 text-lg mt-0.5 shrink-0"
                                />
                                <span className="text-sm text-red-700 leading-relaxed">
                                    Memories are unavailable right now.
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => void refetch()}
                                className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (data?.docs.length ?? 0) === 0 ? (
                        <div className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-5 text-center space-y-1">
                            <p className="text-base font-semibold text-grayscale-900">
                                No memories yet.
                            </p>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Your assistant will ask before saving new memories.
                            </p>
                        </div>
                    ) : (
                        STATUS_ORDER.map(status => {
                            const docs = docsByStatus[status];
                            if (docs.length === 0) return null;

                            return (
                                <section key={status} className="space-y-3">
                                    <h3 className="text-xs font-medium text-grayscale-700 uppercase tracking-wide">
                                        {STATUS_LABELS[status]}
                                    </h3>

                                    {docs.map(doc => (
                                        <article
                                            key={doc.name}
                                            className="rounded-[20px] border border-grayscale-200 p-4 space-y-3"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-grayscale-900">
                                                        {doc.description}
                                                    </p>
                                                    <p className="text-xs text-grayscale-500">
                                                        {doc.kind} · {doc.sourceType}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="text-sm text-grayscale-600 leading-relaxed whitespace-pre-wrap">
                                                {doc.content}
                                            </p>

                                            {status !== 'archived' && (
                                                <div className="flex flex-wrap gap-2">
                                                    {status === 'proposed' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                approveMutation.mutate(doc.name)
                                                            }
                                                            disabled={approveMutation.isPending}
                                                            className="py-2.5 px-3 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            archiveMutation.mutate(doc.name)
                                                        }
                                                        disabled={archiveMutation.isPending}
                                                        className="py-2.5 px-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </section>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
};

export default AssistantMemoriesModal;
