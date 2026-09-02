import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
    X,
    Loader2,
    Sparkles,
    Search,
    RotateCcw,
    ArrowLeft,
    Check,
    Copy,
    Send,
    Pencil,
} from 'lucide-react';

import {
    useWallet,
    useToast,
    ToastTypeEnum,
    useGetCurrentLCNUser,
    useSigningAuthority,
    useGetPaginatedManagedBoosts,
    getLogger,
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import { sendExistingBoost } from '../../../components/simple-send/simpleSend.helpers';
import { HeroCanvas } from '../components/HeroCanvas';
import { RecipientPicker } from '../components/RecipientPicker';
import { RecipientMode, Recipient, LinkOptions } from '../components/recipientTypes';
import { getTypeByObv3 } from '../components/credentialTypeCatalog';
import type { NormalizedImport } from './normalizeToObv3';
import * as m from '../../../paraglide/messages.js';
import { getLocale } from '../../../paraglide/runtime.js';

const log = getLogger('reuse-existing');

interface BoostRecord {
    uri: string;
    name?: string;
    category?: string;
    created?: string;
}

interface ReuseExistingProps {
    onUse: (result: NormalizedImport) => void;
    handleCloseModal: () => void;
}

type Step = 'list' | 'preview' | 'recipient' | 'success';

const ENUM_VALUES = Object.values(BoostCategoryOptionsEnum);

const resolveCategory = (category?: string): BoostCategoryOptionsEnum => {
    if (!category) return BoostCategoryOptionsEnum.achievement;
    const lower = category.toLowerCase();
    const byValue = ENUM_VALUES.find(value => value.toLowerCase() === lower);
    if (byValue) return byValue as BoostCategoryOptionsEnum;
    const byKey = Object.entries(BoostCategoryOptionsEnum).find(
        ([key]) => key.toLowerCase() === lower
    );
    return (byKey?.[1] as BoostCategoryOptionsEnum) ?? BoostCategoryOptionsEnum.achievement;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

// Newest-first records produce these labels in strictly descending order, so a
// newly fetched page only ever extends the bottom (older) edge of the list.
const relativeTimeBucket = (iso?: string): string => {
    if (!iso) return m['passport.activity.when.earlier']();
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return m['passport.activity.when.earlier']();

    const now = new Date();
    const todayStart = startOfDay(now);
    const dayStart = startOfDay(date);
    const daysAgo = Math.round((todayStart - dayStart) / MS_PER_DAY);

    if (daysAgo <= 0) return m['passport.activity.when.today']();
    if (daysAgo === 1) return m['passport.activity.when.yesterday']();

    // Day-of-week index where Sunday = 0; treat the week as starting Sunday.
    if (daysAgo <= now.getDay()) return m['passport.activity.when.thisWeek']();
    if (daysAgo <= now.getDay() + 7) return m['passport.activity.when.lastWeek']();

    if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        return m['passport.activity.when.thisMonth']();
    }

    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString(getLocale(), { month: 'long' });
    }

    return String(date.getFullYear());
};

const achievementTypeOf = (vc: Record<string, unknown>): string | undefined => {
    const subject = (vc.credentialSubject ?? {}) as { achievement?: { achievementType?: string } };
    return subject.achievement?.achievementType;
};

export const ReuseExisting: React.FC<ReuseExistingProps> = ({ onUse, handleCloseModal }) => {
    const history = useHistory();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { getRegisteredSigningAuthority, getRegisteredSigningAuthorities } =
        useSigningAuthority();
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useGetPaginatedManagedBoosts(undefined, { limit: 18 });

    const [step, setStep] = useState<Step>('list');
    const [query, setQuery] = useState('');
    const [loadingUri, setLoadingUri] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [selected, setSelected] = useState<{
        record: BoostRecord;
        vc: Record<string, unknown>;
    } | null>(null);
    const [recipientMode, setRecipientMode] = useState<RecipientMode>('self');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [linkOptions, setLinkOptions] = useState<LinkOptions>({});
    const [isSending, setIsSending] = useState(false);
    const [claimLink, setClaimLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const records = useMemo<BoostRecord[]>(() => {
        const all = (data?.pages ?? []).flatMap(page => (page?.records ?? []) as BoostRecord[]);
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) return all;
        return all.filter(r => (r.name ?? '').toLowerCase().includes(trimmed));
    }, [data, query]);

    const groups = useMemo(() => {
        const ordered: { label: string; items: BoostRecord[] }[] = [];
        for (const record of records) {
            const label = relativeTimeBucket(record.created);
            const last = ordered[ordered.length - 1];
            if (last && last.label === label) last.items.push(record);
            else ordered.push({ label, items: [record] });
        }
        return ordered;
    }, [records]);

    const resetToList = () => {
        setStep('list');
        setSelected(null);
        setRecipientMode('self');
        setRecipients([]);
        setLinkOptions({});
        setClaimLink(null);
        setError(null);
    };

    const handlePick = async (record: BoostRecord) => {
        setLoadingUri(record.uri);
        setError(null);
        try {
            const wallet = await initWallet();
            const fetched = (await wallet.invoke.getBoost(record.uri)) as
                | { boost?: Record<string, unknown> }
                | undefined;
            const vc = fetched?.boost;
            if (!vc) throw new Error('empty');
            setSelected({ record, vc });
            setStep('preview');
        } catch (e) {
            log.warn('reuse-existing.resolve_failed', e, { uri: record.uri });
            setError(m['issueFlow.openFailed']());
        } finally {
            setLoadingUri(null);
        }
    };

    const handleEditInstead = () => {
        if (!selected) return;
        onUse({
            obv3Json: selected.vc,
            provenance: { source: 'reuse', label: selected.record.name ?? 'Reused credential' },
            warnings: [],
        });
    };

    const recipientValid =
        recipientMode === 'self' ||
        recipientMode === 'link' ||
        (recipientMode === 'people' && recipients.length > 0);

    const handleSend = async () => {
        if (!selected || !recipientValid) return;
        setIsSending(true);
        setError(null);
        try {
            const wallet = await initWallet();

            let claimLinkSA: { name?: string; endpoint?: string } | undefined;
            if (recipientMode === 'link') {
                const rsas = await getRegisteredSigningAuthorities(wallet);
                if (rsas && rsas.length > 0) {
                    claimLinkSA = {
                        name: rsas[0]?.relationship?.name,
                        endpoint: rsas[0]?.signingAuthority?.endpoint,
                    };
                } else {
                    const { signingAuthority: sa } = await getRegisteredSigningAuthority(wallet);
                    if (sa) claimLinkSA = { name: sa.name, endpoint: sa.endpoint };
                }
            }

            const result = await sendExistingBoost(wallet, selected.record.uri, {
                mode: recipientMode,
                recipients,
                linkOptions,
                currentLCNUser,
                claimLinkSA,
            });

            setClaimLink(result.claimLink ?? null);
            setStep('success');
            presentToast(m['issueFlow.credSentToast'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (e) {
            log.error('reuse-existing.send_failed', e);
            const message = (e as Error)?.message ?? '';
            setError(
                /network|fetch|connection/i.test(message)
                    ? m['error.network']()
                    : message || m['issueFlow.sendFailed']()
            );
        } finally {
            setIsSending(false);
        }
    };

    const copyLink = async () => {
        if (!claimLink) return;
        try {
            await navigator.clipboard.writeText(claimLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            log.warn('reuse-existing.copy_failed', e);
        }
    };

    const previewType = selected
        ? getTypeByObv3(achievementTypeOf(selected.vc) ?? '')?.baseSimpleType ?? 'badge'
        : null;
    const selectedName =
        selected?.record.name?.trim() ||
        ((selected?.vc?.name as string) ?? '').trim() ||
        m['issueFlow.untitled']();

    const renderRow = (record: BoostRecord, category: BoostCategoryOptionsEnum) => {
        const Icon = boostCategoryMetadata[category]?.IconComponent ?? Sparkles;
        const isLoadingThis = loadingUri === record.uri;
        return (
            <button
                key={record.uri}
                type="button"
                disabled={Boolean(loadingUri)}
                onClick={() => handlePick(record)}
                className="flex items-center gap-3 py-3 px-3 rounded-2xl border border-grayscale-200 bg-white hover:bg-grayscale-10 text-left transition-colors disabled:opacity-50"
            >
                <span className="w-10 h-10 rounded-xl bg-grayscale-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-grayscale-900 truncate">
                    {record.name?.trim() || m['issueFlow.untitled']()}
                </span>
                {isLoadingThis && (
                    <Loader2 className="w-4 h-4 animate-spin text-grayscale-400 shrink-0" />
                )}
            </button>
        );
    };

    const headerTitle =
        step === 'preview'
            ? m['issueFlow.sendThisCred']()
            : step === 'recipient'
            ? m['issueFlow.whosItFor']()
            : step === 'success'
            ? m['passport.activity.status.sent']()
            : m['issueFlow.reuseTitle']();

    const onBack =
        step === 'preview' ? resetToList : step === 'recipient' ? () => setStep('preview') : null;

    return (
        <div className="font-poppins w-full max-w-[560px] mx-auto bg-white rounded-[20px] flex flex-col max-h-[85vh] overflow-hidden animate-fade-in-up">
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-grayscale-100">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="w-8 h-8 -ml-2 rounded-full flex items-center justify-center text-grayscale-500 hover:text-grayscale-900 hover:bg-grayscale-100 transition-colors shrink-0"
                                aria-label={m['common.back']()}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <h2 className="text-xl font-semibold text-grayscale-900 truncate">
                            {headerTitle}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-grayscale-400 hover:text-grayscale-900 hover:bg-grayscale-100 transition-colors shrink-0"
                        aria-label={m['common.close']()}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {step === 'list' && (
                    <>
                        <p className="text-sm text-grayscale-600 mb-4">
                            {m['issueFlow.reuseSubtitle']()}
                        </p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grayscale-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={m['issueFlow.searchCreds']()}
                                className="w-full py-3 pl-10 pr-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                {error && step !== 'list' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
                        <span className="text-sm text-red-700">{error}</span>
                    </div>
                )}

                {step === 'list' && (
                    <>
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
                                        ? m['issueFlow.nothingMatches']({ query })
                                        : m['issueFlow.noneIssued']()}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-5">
                                    {groups.map(({ label, items }) => (
                                        <div key={label}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
                                                    {label}
                                                </h3>
                                                <span className="text-xs text-grayscale-400">
                                                    {items.length}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {items.map(record =>
                                                    renderRow(
                                                        record,
                                                        resolveCategory(record.category)
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {hasNextPage && (
                                    <button
                                        type="button"
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="mt-5 w-full py-2.5 px-3 rounded-full bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isFetchingNextPage && (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        )}
                                        {m['issueFlow.showMore']()}
                                    </button>
                                )}
                            </>
                        )}
                    </>
                )}

                {step === 'preview' && selected && (
                    <div className="space-y-5 animate-fade-in-up">
                        <p className="text-sm text-grayscale-600 -mt-1">
                            {m['issueFlow.previewDesc']()}
                        </p>
                        <HeroCanvas
                            credential={selected.vc}
                            credentialType={previewType}
                            cardTitle={selectedName}
                            hasImage={Boolean(achievementTypeOf(selected.vc))}
                        />
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => setStep('recipient')}
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                {m['issueFlow.chooseRecip']()}
                            </button>
                            <button
                                type="button"
                                onClick={handleEditInstead}
                                className="w-full py-2.5 px-4 rounded-[20px] text-grayscale-600 hover:text-grayscale-900 font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Pencil className="w-4 h-4" />
                                {m['issueFlow.editCopy']()}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'recipient' && selected && (
                    <div className="animate-fade-in-up">
                        <RecipientPicker
                            mode={recipientMode}
                            onModeChange={setRecipientMode}
                            recipients={recipients}
                            onRecipientsChange={setRecipients}
                            linkOptions={linkOptions}
                            onLinkOptionsChange={setLinkOptions}
                            hideHeader
                            inlineResults
                        />
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-6 space-y-5 animate-fade-in-up">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                            <Check className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-grayscale-900">
                                {claimLink ? m['issueFlow.linkReady']() : m['issueFlow.credSent']()}
                            </h3>
                            <p className="text-sm text-grayscale-600">
                                {claimLink
                                    ? m['issueFlow.linkClaimDesc']()
                                    : m['issueFlow.onItsWay']({ name: selectedName })}
                            </p>
                        </div>

                        {claimLink && (
                            <div className="flex items-center gap-2 p-2 pl-3 rounded-xl border border-grayscale-200 bg-grayscale-10 text-left">
                                <span className="flex-1 text-xs text-grayscale-700 truncate">
                                    {claimLink}
                                </span>
                                <button
                                    type="button"
                                    onClick={copyLink}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-grayscale-900 text-white text-xs font-medium hover:opacity-90 transition-opacity shrink-0"
                                >
                                    {copied ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                    )}
                                    {copied
                                        ? m['boostAFriend.page.copied']()
                                        : m['issueFlow.copy']()}
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={resetToList}
                                className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                            >
                                {m['issueFlow.sendAnother']()}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleCloseModal();
                                    history.push('/wallet');
                                }}
                                className="flex-1 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                {m['common.done']()}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {step === 'recipient' && (
                <div className="shrink-0 px-6 py-4 border-t border-grayscale-100 bg-white">
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!recipientValid || isSending}
                        className="w-full py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {m['issueFlow.sending']()}
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                {recipientMode === 'link'
                                    ? m['issueFlow.createLink']()
                                    : recipientMode === 'self'
                                    ? m['issueFlow.sendToSelf']()
                                    : m['issueFlow.sendCred']()}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
