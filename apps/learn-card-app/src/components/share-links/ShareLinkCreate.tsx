import { ShareCategoryFilter } from './ShareCategoryFilter';
import './ShareLinkCreate.css';
import { ShareSearchEmpty } from './ShareSearchEmpty';
import { ShareCredentialsIllustration } from './ShareCredentialsIllustration';
import { ShareCredentialThumbnail } from './ShareCredentialThumbnail';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    searchOutline,
    arrowBackOutline,
    arrowForwardOutline,
    checkmarkOutline,
    closeOutline,
    copyOutline,
} from 'ionicons/icons';
import type { VC } from '@learncard/types';
import { QRCodeSVG } from 'qrcode.react';
import { Clipboard } from '@capacitor/clipboard';
import { useWallet } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { ShareCredentialMetadata } from './ShareCredentialMetadata';
import { isShareLinkError } from 'learn-card-base/helpers/share-links';
import { environment } from '../../config/environment';
import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';
import * as m from '../../paraglide/messages.js';
import {
    classifySharePublication,
    credentialText,
    DEFAULT_EXPIRY_CHOICE,
    EXPIRY_CHOICES,
    mapWithConcurrency,
    prepareShare,
    resolveExpiryIso,
    shareLinkOrigin,
    buildAppShareLinkUrl,
    shareWallet,
    type CredentialChoice,
    type ExpiryChoice,
    type PreparedShare,
    type ShareWallet,
} from './shareLinkFlow';
import { ShareLinkPreview } from './ShareLinkPreview';

export const primary =
    'px-5 py-3 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500';
export const secondary =
    'px-5 py-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 text-sm font-medium hover:bg-grayscale-10 transition-colors disabled:opacity-40';
const inputClass =
    'w-full px-4 py-3 rounded-xl border border-grayscale-300 text-sm text-grayscale-900 bg-white placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
export const Busy = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-2">
        <span
            aria-hidden
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
        {children}
    </span>
);

/** Bounded read fan-out: never more than four LearnCloud reads at once. */
const READ_CONCURRENCY = 4;

const categoryOf = (choice: CredentialChoice) =>
    choice.category ||
    (choice.credential && getDefaultCategoryForCredential(choice.credential)) ||
    '';

export const ShareLinkCreate = ({ onDismiss }: { onDismiss: () => void }) => {
    const { initWallet } = useWallet();
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedOnly, setSelectedOnly] = useState(false);
    const searchInput = useRef<HTMLInputElement>(null);
    const walletRef = useRef(initWallet);
    walletRef.current = initWallet;
    const [choices, setChoices] = useState<CredentialChoice[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    useEffect(() => {
        if (!selected.length) setSelectedOnly(false);
    }, [selected]);
    const [visibleCount, setVisibleCount] = useState(30);
    const [indexReady, setIndexReady] = useState(false);
    const attemptedReads = useRef(new Set<string>());
    const [failedReads, setFailedReads] = useState(new Set<string>());
    const readQueue = useRef(Promise.resolve());
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'choose' | 'details' | 'preview' | 'done'>('choose');
    const [search, setSearch] = useState('');
    const [settledSearch, setSettledSearch] = useState('');
    const searchPending = search.trim() !== settledSearch;
    useEffect(() => {
        const timer = window.setTimeout(() => setSettledSearch(search.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [search]);
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState(false);
    const [tooLarge, setTooLarge] = useState(false);
    const [unsupportedBase, setUnsupportedBase] = useState(false);
    const [pending, setPending] = useState(false);
    const [link, setLink] = useState('');
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [expiryChoice, setExpiryChoice] = useState<ExpiryChoice>(DEFAULT_EXPIRY_CHOICE);
    const [copied, setCopied] = useState(false);
    const [publicationStarted, setPublicationStarted] = useState(false);
    const prepared = useRef<PreparedShare>();
    const operation = useRef<{ id: string; operationId: string }>();
    const busy = useRef(false);
    const alive = useRef(true);

    const load = async () => {
        if (busy.current) return;
        busy.current = true;
        setLoading(true);
        setError(false);
        try {
            const wallet = shareWallet(await walletRef.current());
            const records: CredentialChoice[] = [];
            let pageCursor: string | undefined;
            const seenCursors = new Set<string>();
            do {
                const page = await wallet.index.LearnCloud.getPage(undefined, {
                    cursor: pageCursor,
                    limit: 100,
                });
                if (!alive.current) return;
                if (!page || (page.hasMore && (!page.cursor || seenCursors.has(page.cursor))))
                    throw new Error('page');
                records.push(
                    ...page.records.filter(record => !record.id?.startsWith('__verifiable_data_'))
                );
                if (!page.hasMore) break;
                pageCursor = page.cursor;
                seenCursors.add(pageCursor!);
            } while (alive.current);
            // Legacy records may predate title metadata. Resolve those once for
            // this session so they remain searchable; titled records need no VC read.
            const indexed = await mapWithConcurrency(records, READ_CONCURRENCY, async record => {
                if (record.title?.trim()) return record;
                try {
                    const credential = (await wallet.read.get(record.uri)) as VC | undefined;
                    return { ...record, credential, title: credentialText(credential).name };
                } catch {
                    return record;
                }
            });
            if (!alive.current) return;
            setChoices(previous => {
                const cached = new Map(previous.map(row => [row.uri, row.credential]));
                return [
                    ...new Map(
                        indexed.map(row => [
                            row.uri,
                            { ...row, credential: row.credential ?? cached.get(row.uri) },
                        ])
                    ).values(),
                ];
            });
            setIndexReady(true);
        } catch {
            if (alive.current) setError(true);
        } finally {
            busy.current = false;
            if (alive.current) setLoading(false);
        }
    };
    const retryUnavailable = async () => {
        if (busy.current) return;
        busy.current = true;
        setLoading(true);
        setError(false);
        setTooLarge(false);
        try {
            const wallet = shareWallet(await walletRef.current());
            const missing = filtered.filter(choice => !choice.credential);
            const replacements = await mapWithConcurrency(missing, READ_CONCURRENCY, async row => {
                const credential = await wallet.read.get(row.uri);
                if (!credential) throw new Error('credential');
                return [row.uri, credential as VC] as const;
            });
            if (alive.current) {
                const map = new Map(replacements);
                setChoices(current =>
                    current.map(row => ({
                        ...row,
                        credential: map.get(row.uri) ?? row.credential,
                    }))
                );
            }
        } catch {
            if (alive.current) setError(true);
        } finally {
            busy.current = false;
            if (alive.current) setLoading(false);
        }
    };
    useEffect(() => {
        alive.current = true;
        // The masked surface and sanitized errors protect the draft without
        // changing the signed-in session's telemetry preferences.
        void load();
        return () => {
            alive.current = false;
        };
    }, []);

    /** A draft is only valid until any input that feeds it changes. */
    const invalidateDraft = () => {
        if (!publicationStarted) prepared.current = undefined;
    };
    const guardBase = (): string | undefined => {
        const host = shareLinkOrigin(getAppBaseUrl(), environment.DEV);
        setUnsupportedBase(!host);
        if (!host) setError(true);
        return host;
    };

    const prepareDraft = async () => {
        if (busy.current) return;
        busy.current = true;
        setLoading(true);
        setError(false);
        setTooLarge(false);
        setUnsupportedBase(false);
        try {
            if (!guardBase()) return;
            const wallet = shareWallet(await walletRef.current());
            const pinnedExpiry = resolveExpiryIso(expiryChoice);
            prepared.current = await prepareShare(wallet, selected, title, note, pinnedExpiry);
            if (!alive.current) return;
            setStep('preview');
        } catch (cause) {
            if (alive.current) {
                setError(true);
                setTooLarge(
                    isShareLinkError(cause) &&
                        ['CIPHERTEXT_TOO_LARGE', 'RECOVERY_TOO_LARGE'].includes(cause.code)
                );
            }
        } finally {
            busy.current = false;
            if (alive.current) setLoading(false);
        }
    };

    const succeed = (host: string, expiresAt: string | null) => {
        const value = prepared.current!;
        setLink(buildAppShareLinkUrl(host, value.input.id, value.key, environment.DEV));
        setExpiresAt(expiresAt);
        setStep('done');
    };

    /**
     * One publication attempt. `abandoned` (a pending operation whose reservation
     * no longer exists) replays the original prepared input through create, which
     * `reserveCreate` resumes by the same clientRequestId. A pending result is
     * retried by operation key and is never sent as a fresh create.
     */
    const commit = async (
        wallet: ShareWallet,
        host: string,
        allowReplay: boolean
    ): Promise<void> => {
        const result = operation.current
            ? await wallet.invoke.retryShareLinkOperation(operation.current)
            : await wallet.invoke.createShareLink(prepared.current!.input);
        const outcome = classifySharePublication(result);
        if (outcome.status === 'pending') {
            operation.current = outcome.operation;
            if (alive.current) setPending(true);
            return;
        }
        if (outcome.status === 'abandoned') {
            if (!alive.current) return;
            operation.current = undefined;
            if (!allowReplay) throw new Error('abandoned');
            const replay = await wallet.invoke.createShareLink(prepared.current!.input);
            const replayed = classifySharePublication(replay);
            if (replayed.status === 'pending') {
                operation.current = replayed.operation;
                if (alive.current) setPending(true);
                return;
            }
            if (replayed.status === 'abandoned') throw new Error('abandoned');
            if (replayed.status === 'inactive') throw new Error('inactive');
            if (alive.current) succeed(host, replayed.share.expiresAt);
            return;
        }
        if (outcome.status === 'inactive') throw new Error('inactive');
        if (alive.current) succeed(host, outcome.share.expiresAt);
    };

    const publish = async () => {
        if (busy.current || !prepared.current) return;
        busy.current = true;
        setLoading(true);
        setError(false);
        setTooLarge(false);
        setPending(false);
        try {
            const host = guardBase();
            if (!host) return;
            const wallet = shareWallet(await walletRef.current());
            if (!alive.current) return;
            if (prepared.current.ownerDid !== wallet.id.did()) throw new Error('identity');
            setPublicationStarted(true);
            await commit(wallet, host, true);
        } catch (cause) {
            if (alive.current) {
                setError(true);
                setTooLarge(
                    isShareLinkError(cause) &&
                        ['CIPHERTEXT_TOO_LARGE', 'RECOVERY_TOO_LARGE'].includes(cause.code)
                );
            }
        } finally {
            busy.current = false;
            if (alive.current) {
                setLoading(false);
            }
        }
    };
    const copy = async () => {
        setLoading(true);
        setError(false);
        try {
            await Clipboard.write({ string: link });
            setCopied(true);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };
    const categories = [...new Set(choices.map(categoryOf).filter(Boolean))];
    const selectedCategoryCount = new Set(
        choices
            .filter(choice => selected.includes(choice.uri))
            .map(categoryOf)
            .filter(Boolean)
    ).size;
    const matches = useMemo(
        () =>
            choices.filter(choice =>
                selectedOnly
                    ? selected.includes(choice.uri)
                    : (!categoryFilter || categoryOf(choice) === categoryFilter) &&
                      (choice.title || credentialText(choice.credential).name)
                          .toLocaleLowerCase()
                          .includes(settledSearch.toLocaleLowerCase())
            ),
        [choices, settledSearch, categoryFilter, selectedOnly, selected]
    );
    const filtered = useMemo(
        () => (selectedOnly ? matches : matches.slice(0, visibleCount)),
        [matches, visibleCount, selectedOnly]
    );
    const hasMore = !selectedOnly && matches.length > visibleCount;
    useEffect(() => {
        setVisibleCount(30);
    }, [settledSearch, categoryFilter]);
    useEffect(() => {
        const missing = filtered.filter(
            row => !row.credential && !attemptedReads.current.has(row.uri)
        );
        if (!missing.length || !indexReady) return;
        missing.forEach(row => attemptedReads.current.add(row.uri));
        readQueue.current = readQueue.current.then(async () => {
            if (!alive.current) return;
            try {
                const wallet = shareWallet(await walletRef.current());
                const resolved = await mapWithConcurrency(missing, READ_CONCURRENCY, async row => {
                    try {
                        return [
                            row.uri,
                            (await wallet.read.get(row.uri)) as VC | undefined,
                        ] as const;
                    } catch {
                        return [row.uri, undefined] as const;
                    }
                });
                if (!alive.current) return;
                setFailedReads(
                    current =>
                        new Set([
                            ...current,
                            ...resolved.filter(([, credential]) => !credential).map(([uri]) => uri),
                        ])
                );
                const byUri = new Map(resolved);
                setChoices(current =>
                    current.map(row =>
                        byUri.get(row.uri) ? { ...row, credential: byUri.get(row.uri) } : row
                    )
                );
            } catch {
                if (alive.current) setError(true);
            }
        });
    }, [filtered, indexReady]);
    const fieldsLocked = publicationStarted || loading;
    const effectiveExpiry = prepared.current?.input.expiresAt ?? resolveExpiryIso(expiryChoice);
    return (
        <section
            className="sentry-block ph-no-capture font-poppins bg-white text-grayscale-900 h-full flex flex-col"
            data-html2canvas-ignore
        >
            <header className="px-6 py-5 flex items-center justify-between border-b border-grayscale-100">
                <span className="text-xs font-medium text-grayscale-600">
                    {m['shareLinks.share']()}
                </span>
                <button
                    className="p-2 rounded-[20px] hover:bg-grayscale-100"
                    aria-label={m['shareLinks.close']()}
                    onClick={onDismiss}
                >
                    <IonIcon icon={closeOutline} className="w-6 h-6" />
                </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-8 md:py-12">
                <div className="max-w-2xl mx-auto space-y-6">
                    <ShareCredentialsIllustration complete={step === 'done'} />
                    <div>
                        <p className="text-xs font-medium text-grayscale-500 mb-2">
                            {step === 'done'
                                ? m['shareLinks.ready']()
                                : m['shareLinks.step']({
                                      current:
                                          step === 'choose' ? '1' : step === 'details' ? '2' : '3',
                                  })}
                        </p>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                            {step === 'choose'
                                ? m['shareLinks.choose']()
                                : step === 'details'
                                  ? m['shareLinks.details']()
                                  : step === 'preview'
                                    ? m['shareLinks.previewTitle']()
                                    : m['shareLinks.done']()}
                        </h1>
                        <p className="text-sm text-grayscale-600 leading-relaxed mt-3">
                            {step === 'choose'
                                ? m['shareLinks.chooseHint']()
                                : step === 'details'
                                  ? m['shareLinks.detailsHint']()
                                  : step === 'preview'
                                    ? m['shareLinks.previewHint']()
                                    : m['shareLinks.linkHint']()}
                        </p>
                    </div>
                    {(error || unsupportedBase) && (
                        <p role="alert" className="p-4 rounded-2xl bg-red-50 text-red-700 text-sm">
                            {unsupportedBase
                                ? m['shareLinks.unsupportedBase']()
                                : tooLarge
                                  ? m['shareLinks.tooLarge']()
                                  : m['shareLinks.error']()}
                        </p>
                    )}
                    {step === 'choose' && (
                        <>
                            <div hidden={selectedOnly} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="share-credential-search"
                                        className="block text-xs font-medium text-grayscale-700 mb-2"
                                    >
                                        {m['shareLinks.search']()}
                                    </label>
                                    <div className="group flex items-center gap-3 rounded-xl border border-grayscale-300 bg-grayscale-10 px-3 transition-colors hover:border-grayscale-400 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500">
                                        <IonIcon
                                            aria-hidden="true"
                                            icon={searchOutline}
                                            className="h-5 w-5 shrink-0 text-grayscale-400 transition-colors group-focus-within:text-emerald-600"
                                        />
                                        <input
                                            ref={searchInput}
                                            id="share-credential-search"
                                            className="w-full min-w-0 py-3 bg-transparent text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
                                            placeholder={m['shareLinks.searchPlaceholder']()}
                                            value={search}
                                            onChange={event => setSearch(event.target.value)}
                                            type="search"
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                aria-label={m['shareLinks.clearSearch']()}
                                                onClick={() => {
                                                    setSearch('');
                                                    setSettledSearch('');
                                                    searchInput.current?.focus();
                                                }}
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-grayscale-600 hover:bg-grayscale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                            >
                                                <IonIcon
                                                    aria-hidden="true"
                                                    icon={closeOutline}
                                                    className="h-4 w-4"
                                                />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <ShareCategoryFilter
                                    value={categoryFilter}
                                    onChange={setCategoryFilter}
                                    categories={categories}
                                />
                            </div>
                            <div className="rounded-2xl bg-grayscale-100 p-4 space-y-3">
                                <div className="flex justify-between items-start gap-3 text-xs text-grayscale-600">
                                    <div>
                                        <p className="font-medium text-grayscale-900">
                                            {m['shareLinks.selected']({
                                                count: String(selected.length),
                                            })}
                                        </p>
                                        {selectedCategoryCount > 0 && (
                                            <p className="mt-1">
                                                {selectedCategoryCount === 1
                                                    ? m['shareLinks.oneCategory']()
                                                    : m['shareLinks.categoryCount']({
                                                          count: String(selectedCategoryCount),
                                                      })}
                                            </p>
                                        )}
                                    </div>
                                    <span className="shrink-0">{m['shareLinks.limit']()}</span>
                                </div>
                                {selected.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            aria-pressed={selectedOnly}
                                            onClick={() => setSelectedOnly(current => !current)}
                                            className="rounded-[20px] bg-white px-4 py-2 text-xs font-medium text-grayscale-900 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        >
                                            {selectedOnly
                                                ? m['shareLinks.browseAll']()
                                                : m['shareLinks.viewSelected']()}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                invalidateDraft();
                                                setSelected([]);
                                                setSelectedOnly(false);
                                            }}
                                            className="rounded-[20px] px-3 py-2 text-xs font-medium text-grayscale-600 hover:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        >
                                            {m['shareLinks.deselectAll']()}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p role="status" className="min-h-5 text-xs text-grayscale-500">
                                {searchPending
                                    ? m['shareLinks.searchUpdating']()
                                    : !indexReady
                                      ? m['shareLinks.loading']()
                                      : null}
                            </p>
                            <div
                                aria-busy={searchPending}
                                className={`space-y-3 motion-safe:transition-opacity motion-safe:duration-200 ${searchPending ? 'opacity-60' : 'opacity-100'}`}
                            >
                                {filtered.map(choice => {
                                    const text = credentialText(choice.credential);
                                    const checked = selected.includes(choice.uri);
                                    return (
                                        <label
                                            key={choice.uri}
                                            className={`flex items-center gap-4 p-4 rounded-[20px] border cursor-pointer transition-colors ${checked ? 'border-emerald-600 bg-emerald-50' : 'border-grayscale-200 hover:bg-grayscale-10'}`}
                                        >
                                            <ShareCredentialThumbnail
                                                credential={choice.credential}
                                                category={choice.category}
                                            />
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-sm font-medium break-words">
                                                    {text.name ||
                                                        choice.title ||
                                                        m['shareLinks.credential']()}
                                                </span>
                                                {choice.credential ? (
                                                    <ShareCredentialMetadata
                                                        credential={choice.credential}
                                                        category={choice.category}
                                                    />
                                                ) : (
                                                    <span className="block mt-1 text-xs text-grayscale-600">
                                                        {failedReads.has(choice.uri)
                                                            ? m['shareLinks.loadFailed']()
                                                            : m['shareLinks.loading']()}
                                                    </span>
                                                )}
                                            </span>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 accent-emerald-600 shrink-0"
                                                checked={checked}
                                                disabled={
                                                    !choice.credential ||
                                                    (!checked && selected.length >= 50)
                                                }
                                                onChange={() => {
                                                    invalidateDraft();
                                                    setSelected(current =>
                                                        checked
                                                            ? current.filter(
                                                                  uri => uri !== choice.uri
                                                              )
                                                            : [...current, choice.uri]
                                                    );
                                                }}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                            {!filtered.length && !loading && !searchPending && (
                                <ShareSearchEmpty
                                    searching={Boolean(settledSearch)}
                                    onClear={() => {
                                        setSearch('');
                                        setSettledSearch('');
                                        searchInput.current?.focus();
                                    }}
                                />
                            )}
                            {filtered.some(
                                choice => !choice.credential && failedReads.has(choice.uri)
                            ) && (
                                <button
                                    className={secondary}
                                    disabled={loading}
                                    onClick={() => void retryUnavailable()}
                                >
                                    {loading ? (
                                        <Busy>{m['shareLinks.loading']()}</Busy>
                                    ) : (
                                        m['shareLinks.retryUnavailable']()
                                    )}
                                </button>
                            )}
                            {(hasMore || error) && (
                                <button
                                    className={secondary}
                                    disabled={loading}
                                    onClick={() =>
                                        error ? void load() : setVisibleCount(count => count + 30)
                                    }
                                >
                                    {loading ? (
                                        <Busy>{m['shareLinks.loading']()}</Busy>
                                    ) : (
                                        m['shareLinks.loadMore']()
                                    )}
                                </button>
                            )}
                        </>
                    )}
                    {step === 'details' && (
                        <div className="space-y-5">
                            <p className="p-4 rounded-2xl bg-grayscale-100 text-sm">
                                {m['shareLinks.selected']({ count: String(selected.length) })}
                            </p>
                            <label className="block text-xs font-medium text-grayscale-700">
                                {m['shareLinks.title']()}
                                <input
                                    autoFocus
                                    maxLength={120}
                                    disabled={fieldsLocked}
                                    className={`${inputClass} mt-2`}
                                    placeholder={m['shareLinks.titlePlaceholder']()}
                                    value={title}
                                    onChange={event => {
                                        invalidateDraft();
                                        setTitle(event.target.value);
                                    }}
                                />
                            </label>
                            <label className="block text-xs font-medium text-grayscale-700">
                                {m['shareLinks.note']()}
                                <textarea
                                    maxLength={500}
                                    disabled={fieldsLocked}
                                    rows={3}
                                    className={`${inputClass} mt-2 resize-y`}
                                    placeholder={m['shareLinks.notePlaceholder']()}
                                    value={note}
                                    onChange={event => {
                                        invalidateDraft();
                                        setNote(event.target.value);
                                    }}
                                />
                            </label>
                            <fieldset className="space-y-2">
                                <legend className="text-xs font-medium text-grayscale-700">
                                    {m['shareLinks.expiry']()}
                                </legend>
                                <div className="flex flex-wrap gap-2">
                                    {EXPIRY_CHOICES.map(choice => (
                                        <label
                                            key={choice}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[20px] border text-sm cursor-pointer ${expiryChoice === choice ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-grayscale-300 text-grayscale-700'}`}
                                        >
                                            <input
                                                type="radio"
                                                name="share-link-expiry"
                                                className="accent-emerald-600"
                                                disabled={fieldsLocked}
                                                checked={expiryChoice === choice}
                                                onChange={() => {
                                                    invalidateDraft();
                                                    setExpiryChoice(choice);
                                                }}
                                            />
                                            {choice === '7'
                                                ? m['shareLinks.expiry7']()
                                                : choice === '30'
                                                  ? m['shareLinks.expiry30']()
                                                  : choice === '365'
                                                    ? m['shareLinks.expiry365']()
                                                    : m['shareLinks.expiryNever']()}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-grayscale-600">
                                    {effectiveExpiry
                                        ? m['shareLinks.expires']({
                                              date: new Date(effectiveExpiry).toLocaleDateString(),
                                          })
                                        : m['shareLinks.neverExpires']()}
                                </p>
                            </fieldset>
                            <p className="text-xs text-grayscale-600 leading-relaxed">
                                {m['shareLinks.privacyHint']()}
                            </p>
                        </div>
                    )}
                    {step === 'preview' && prepared.current && (
                        <div className="space-y-5">
                            <ShareLinkPreview
                                heading={m['shareLinks.previewHeading']()}
                                title={prepared.current.input.title}
                                note={prepared.current.input.note}
                                sharerName={prepared.current.payload.sharer.displayName}
                                expiresAt={prepared.current.input.expiresAt ?? null}
                                payload={prepared.current.payload}
                            />
                            <p className="text-xs text-grayscale-600 leading-relaxed">
                                {m['shareLinks.privacyHint']()}
                            </p>
                            {pending && (
                                <p
                                    role="status"
                                    className="p-4 rounded-2xl bg-amber-50 text-amber-800 text-sm"
                                >
                                    {m['shareLinks.pending']()}
                                </p>
                            )}
                        </div>
                    )}
                    {step === 'done' && (
                        <div className="space-y-5">
                            <div className="p-5 rounded-[20px] border border-grayscale-200">
                                <p className="font-medium break-words">{title}</p>
                                <p className="text-xs text-grayscale-500 mt-2">
                                    {m['shareLinks.selected']({ count: String(selected.length) })}
                                </p>
                                {expiresAt ? (
                                    <p className="text-xs text-grayscale-600 mt-3">
                                        {m['shareLinks.expires']({
                                            date: new Date(expiresAt).toLocaleDateString(),
                                        })}
                                    </p>
                                ) : (
                                    <p className="text-xs text-grayscale-600 mt-3">
                                        {m['shareLinks.neverExpires']()}
                                    </p>
                                )}
                            </div>
                            <figure className="flex flex-col items-center gap-3 rounded-[20px] border border-grayscale-200 bg-white p-5">
                                <QRCodeSVG
                                    value={link}
                                    size={224}
                                    level="M"
                                    includeMargin
                                    bgColor="#FFFFFF"
                                    fgColor="#18224E"
                                    role="img"
                                    aria-label={m['shareLinks.qrLabel']()}
                                    className="h-auto max-w-full"
                                />
                                <figcaption className="text-sm text-grayscale-600 text-center">
                                    {m['shareLinks.qrHint']()}
                                </figcaption>
                            </figure>
                            <label className="block text-xs font-medium text-grayscale-700">
                                {m['shareLinks.privateLink']()}
                                <input
                                    className={`${inputClass} mt-2`}
                                    readOnly
                                    value={link}
                                    onFocus={event => event.target.select()}
                                />
                            </label>
                            <button
                                className={primary}
                                disabled={loading}
                                onClick={() => void copy()}
                            >
                                {loading ? (
                                    <Busy>{m['shareLinks.copying']()}</Busy>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <IonIcon icon={copied ? checkmarkOutline : copyOutline} />
                                        {copied ? m['shareLinks.copied']() : m['shareLinks.copy']()}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <footer className="border-t border-grayscale-100 px-6 py-5">
                <div className="max-w-2xl mx-auto flex justify-between gap-3">
                    {step === 'details' ? (
                        <button
                            disabled={loading}
                            className={secondary}
                            onClick={() => {
                                setStep('choose');
                                setError(false);
                                setUnsupportedBase(false);
                            }}
                        >
                            <IonIcon icon={arrowBackOutline} /> {m['shareLinks.back']()}
                        </button>
                    ) : step === 'preview' ? (
                        <button
                            disabled={loading || publicationStarted}
                            className={secondary}
                            onClick={() => {
                                prepared.current = undefined;
                                operation.current = undefined;
                                setPending(false);
                                setStep('details');
                                setError(false);
                            }}
                        >
                            <IonIcon icon={arrowBackOutline} /> {m['shareLinks.edit']()}
                        </button>
                    ) : (
                        <span />
                    )}
                    {step === 'choose' && (
                        <button
                            className={primary}
                            disabled={!selected.length || loading}
                            onClick={() => {
                                setStep('details');
                                setError(false);
                            }}
                        >
                            {m['shareLinks.continue']()} <IonIcon icon={arrowForwardOutline} />
                        </button>
                    )}
                    {step === 'details' && (
                        <button
                            className={primary}
                            disabled={loading || !title.trim()}
                            onClick={() => void prepareDraft()}
                        >
                            {loading ? (
                                <Busy>{m['shareLinks.preparing']()}</Busy>
                            ) : (
                                <>
                                    {m['shareLinks.preview']()}{' '}
                                    <IonIcon icon={arrowForwardOutline} />
                                </>
                            )}
                        </button>
                    )}
                    {step === 'preview' && (
                        <button
                            className={primary}
                            disabled={loading || !prepared.current}
                            onClick={() => void publish()}
                        >
                            {loading ? (
                                <Busy>{m['shareLinks.creating']()}</Busy>
                            ) : pending ? (
                                m['shareLinks.checkAgain']()
                            ) : (
                                m['shareLinks.create']()
                            )}
                        </button>
                    )}
                    {step === 'done' && (
                        <button className={secondary} onClick={onDismiss}>
                            {m['shareLinks.finish']()}
                        </button>
                    )}
                </div>
            </footer>
        </section>
    );
};
export default ShareLinkCreate;
