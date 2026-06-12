import React, { useMemo, useState } from 'react';
import { X, Loader2, Sparkles, Search, RotateCcw } from 'lucide-react';

import { useWallet, useGetPaginatedManagedBoosts, getLogger } from 'learn-card-base';

import type { NormalizedImport } from './normalizeToObv3';

const log = getLogger('reuse-existing');

interface BoostRecord {
    uri: string;
    name?: string;
    category?: string;
    boost?: { credentialSubject?: { achievement?: { image?: string; achievementType?: string } } };
}

interface ReuseExistingProps {
    onUse: (result: NormalizedImport) => void;
    handleCloseModal: () => void;
}

const recordImage = (record: BoostRecord): string | undefined =>
    record.boost?.credentialSubject?.achievement?.image;

export const ReuseExisting: React.FC<ReuseExistingProps> = ({ onUse, handleCloseModal }) => {
    const { initWallet } = useWallet();
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useGetPaginatedManagedBoosts(undefined, { limit: 18 });
    const [query, setQuery] = useState('');
    const [loadingUri, setLoadingUri] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const records = useMemo<BoostRecord[]>(() => {
        const all = (data?.pages ?? []).flatMap(page => (page?.records ?? []) as BoostRecord[]);
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) return all;
        return all.filter(r => (r.name ?? '').toLowerCase().includes(trimmed));
    }, [data, query]);

    const handlePick = async (record: BoostRecord) => {
        setLoadingUri(record.uri);
        setError(null);
        try {
            const wallet = await initWallet();
            const vc = (await wallet.read.get(record.uri)) as Record<string, unknown> | undefined;
            if (!vc) throw new Error('empty');
            onUse({
                obv3Json: vc,
                provenance: { source: 'reuse', label: record.name ?? 'Reused credential' },
                warnings: [],
            });
            handleCloseModal();
        } catch (e) {
            log.warn('reuse-existing.resolve_failed', e, { uri: record.uri });
            setError("We couldn't open that one. Please try another.");
        } finally {
            setLoadingUri(null);
        }
    };

    return (
        <div className="font-poppins w-full max-w-[560px] mx-auto bg-white rounded-[20px] flex flex-col max-h-[85vh] overflow-hidden animate-fade-in-up">
            <div className="px-6 pt-6 pb-4 border-b border-grayscale-100">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        Reuse one you've made
                    </h2>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-grayscale-400 hover:text-grayscale-900 hover:bg-grayscale-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-sm text-grayscale-600 mb-4">
                    Start from a credential you've issued before — everything stays editable.
                </p>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grayscale-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search your credentials…"
                        className="w-full py-3 pl-10 pr-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    />
                </div>
            </div>

            <div className="overflow-y-auto px-6 py-5">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
                        <span className="text-sm text-red-700">{error}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-grayscale-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center py-12">
                        <RotateCcw className="w-8 h-8 text-grayscale-300 mx-auto mb-3" />
                        <p className="text-sm text-grayscale-500">
                            {query
                                ? `Nothing matches “${query}”.`
                                : "You haven't issued any credentials yet."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {records.map(record => {
                                const image = recordImage(record);
                                const isLoadingThis = loadingUri === record.uri;
                                return (
                                    <button
                                        key={record.uri}
                                        type="button"
                                        disabled={Boolean(loadingUri)}
                                        onClick={() => handlePick(record)}
                                        className="flex items-center gap-3 py-3 px-3 rounded-2xl border border-grayscale-200 bg-white hover:bg-grayscale-10 text-left transition-colors disabled:opacity-50"
                                    >
                                        {image ? (
                                            <img
                                                src={image}
                                                alt=""
                                                className="w-10 h-10 rounded-xl object-cover bg-grayscale-100 shrink-0"
                                            />
                                        ) : (
                                            <span className="w-10 h-10 rounded-xl bg-grayscale-100 flex items-center justify-center shrink-0">
                                                <Sparkles className="w-4 h-4 text-grayscale-400" />
                                            </span>
                                        )}
                                        <span className="min-w-0 flex-1 text-sm font-medium text-grayscale-900 truncate">
                                            {record.name || 'Untitled credential'}
                                        </span>
                                        {isLoadingThis && (
                                            <Loader2 className="w-4 h-4 animate-spin text-grayscale-400 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {hasNextPage && (
                            <button
                                type="button"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="mt-4 w-full py-2.5 px-3 rounded-full bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin" />}
                                Show more
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
