import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    arrowBackOutline,
    arrowForwardOutline,
    checkmarkOutline,
    closeOutline,
    copyOutline,
    documentTextOutline,
    lockClosedOutline,
} from 'ionicons/icons';
import type { VC } from '@learncard/types';
import { QRCodeSVG } from 'qrcode.react';
import { Clipboard } from '@capacitor/clipboard';
import { useWallet } from 'learn-card-base';
import { buildShareLinkUrl, isShareLinkError } from 'learn-card-base/helpers/share-links';
import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';
import * as m from '../../paraglide/messages.js';
import {
    credentialText,
    prepareShare,
    shareWallet,
    type CredentialChoice,
    type PreparedShare,
} from './shareLinkFlow';
import { enterSharePrivacy } from './sharePrivacy';

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

export const ShareLinkCreate = ({ onDismiss }: { onDismiss: () => void }) => {
    const { initWallet } = useWallet();
    const walletRef = useRef(initWallet);
    walletRef.current = initWallet;
    const [choices, setChoices] = useState<CredentialChoice[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [cursor, setCursor] = useState<string>();
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'choose' | 'details' | 'done'>('choose');
    const [search, setSearch] = useState('');
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState(false);
    const [tooLarge, setTooLarge] = useState(false);
    const [pending, setPending] = useState(false);
    const [link, setLink] = useState('');
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const prepared = useRef<PreparedShare>();
    const operation = useRef<{ id: string; operationId: string }>();
    const busy = useRef(false);
    const alive = useRef(true);

    const load = async (pageCursor?: string) => {
        if (busy.current) return;
        busy.current = true;
        setLoading(true);
        setError(false);
        try {
            const wallet = shareWallet(await walletRef.current());
            const page = await wallet.index.LearnCloud.getPage(undefined, {
                cursor: pageCursor,
                limit: 30,
            });
            if (!page || (page.hasMore && (!page.cursor || page.cursor === pageCursor)))
                throw new Error('page');
            const rows: CredentialChoice[] = [];
            for (const record of page.records) {
                // Internal preference records are not learner credentials.
                if (record.id?.startsWith('__verifiable_data_')) continue;
                try {
                    rows.push({
                        uri: record.uri,
                        credential: (await wallet.read.get(record.uri)) as VC | undefined,
                    });
                } catch {
                    rows.push({ uri: record.uri });
                }
            }
            if (!alive.current) return;
            setChoices(previous => [
                ...new Map([...previous, ...rows].map(row => [row.uri, row])).values(),
            ]);
            setCursor(page.cursor);
            setHasMore(page.hasMore);
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
            const replacements = new Map<string, VC>();
            for (const row of choices.filter(choice => !choice.credential)) {
                const credential = await wallet.read.get(row.uri);
                if (!credential) throw new Error('credential');
                replacements.set(row.uri, credential as VC);
            }
            if (alive.current)
                setChoices(current =>
                    current.map(row => ({
                        ...row,
                        credential: replacements.get(row.uri) ?? row.credential,
                    }))
                );
        } catch {
            if (alive.current) setError(true);
        } finally {
            busy.current = false;
            if (alive.current) setLoading(false);
        }
    };
    useEffect(() => {
        alive.current = true;
        enterSharePrivacy();
        void load();
        return () => {
            alive.current = false;
        };
    }, []);

    const create = async () => {
        if (busy.current) return;
        busy.current = true;
        setLoading(true);
        setError(false);
        setTooLarge(false);
        try {
            const wallet = shareWallet(await walletRef.current());
            if (!prepared.current)
                prepared.current = await prepareShare(wallet, selected, title, note);
            const currentWallet = shareWallet(await walletRef.current());
            if (prepared.current.ownerDid !== currentWallet.id.did()) throw new Error('identity');
            const result = operation.current
                ? await currentWallet.invoke.retryShareLinkOperation(operation.current)
                : await currentWallet.invoke.createShareLink(prepared.current.input);
            if (!alive.current) return;
            if (result.status === 'pending') {
                operation.current = { id: result.id, operationId: result.operationId };
                setPending(true);
                return;
            }
            if (result.share.status !== 'active') throw new Error('inactive');
            const host = new URL(getAppBaseUrl()).host;
            setLink(buildShareLinkUrl(host, prepared.current.input.id, prepared.current.key));
            setExpiresAt(result.share.expiresAt);
            setStep('done');
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
    const filtered = choices.filter(choice =>
        credentialText(choice.credential)
            .name.toLocaleLowerCase()
            .includes(search.toLocaleLowerCase())
    );
    const locked = Boolean(prepared.current);
    return (
        <section
            className="sentry-block ph-no-capture font-poppins bg-white text-grayscale-900 h-full flex flex-col"
            data-html2canvas-ignore
        >
            <header className="px-6 py-5 flex items-center justify-between border-b border-grayscale-100">
                <span className="text-xs font-medium text-grayscale-600">
                    {m['shareLinks.privateLink']()}
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
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <IonIcon
                            className="w-6 h-6"
                            icon={step === 'done' ? checkmarkOutline : lockClosedOutline}
                        />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-grayscale-500 mb-2">
                            {step === 'done'
                                ? m['shareLinks.ready']()
                                : m['shareLinks.step']({ current: step === 'choose' ? '1' : '2' })}
                        </p>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                            {step === 'choose'
                                ? m['shareLinks.choose']()
                                : step === 'details'
                                  ? m['shareLinks.details']()
                                  : m['shareLinks.done']()}
                        </h1>
                        <p className="text-sm text-grayscale-600 leading-relaxed mt-3">
                            {step === 'choose'
                                ? m['shareLinks.chooseHint']()
                                : step === 'details'
                                  ? m['shareLinks.detailsHint']()
                                  : m['shareLinks.linkHint']()}
                        </p>
                    </div>
                    {error && (
                        <p role="alert" className="p-4 rounded-2xl bg-red-50 text-red-700 text-sm">
                            {tooLarge ? m['shareLinks.tooLarge']() : m['shareLinks.error']()}
                        </p>
                    )}
                    {step === 'choose' && (
                        <>
                            <label className="block text-xs font-medium text-grayscale-700">
                                {m['shareLinks.search']()}
                                <input
                                    className={`${inputClass} mt-2`}
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                    type="search"
                                />
                            </label>
                            <div className="flex justify-between text-xs text-grayscale-600">
                                <span>
                                    {m['shareLinks.selected']({ count: String(selected.length) })}
                                </span>
                                <span>{m['shareLinks.limit']()}</span>
                            </div>
                            <div className="space-y-3">
                                {filtered.map(choice => {
                                    const text = credentialText(choice.credential);
                                    const checked = selected.includes(choice.uri);
                                    return (
                                        <label
                                            key={choice.uri}
                                            className={`flex items-start gap-4 p-4 rounded-[20px] border cursor-pointer transition-colors ${checked ? 'border-emerald-600 bg-emerald-50' : 'border-grayscale-200 hover:bg-grayscale-10'}`}
                                        >
                                            <span className="rounded-xl bg-grayscale-100 p-3 text-grayscale-600">
                                                <IonIcon
                                                    icon={documentTextOutline}
                                                    className="w-5 h-5"
                                                />
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-sm font-medium break-words">
                                                    {text.name || m['shareLinks.credential']()}
                                                </span>
                                                <span className="block mt-1 text-xs text-grayscale-600 break-words">
                                                    {choice.credential
                                                        ? text.issuer
                                                        : m['shareLinks.loadFailed']()}
                                                </span>
                                            </span>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 mt-2 accent-emerald-600 shrink-0"
                                                checked={checked}
                                                disabled={
                                                    !choice.credential ||
                                                    (!checked && selected.length >= 50)
                                                }
                                                onChange={() =>
                                                    setSelected(current =>
                                                        checked
                                                            ? current.filter(
                                                                  uri => uri !== choice.uri
                                                              )
                                                            : [...current, choice.uri]
                                                    )
                                                }
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                            {!filtered.length && !loading && (
                                <p className="p-6 text-center text-sm text-grayscale-500">
                                    {m['shareLinks.empty']()}
                                </p>
                            )}
                            {choices.some(choice => !choice.credential) && (
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
                                    onClick={() => void load(cursor)}
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
                                    disabled={locked || loading}
                                    className={`${inputClass} mt-2`}
                                    value={title}
                                    onChange={event => setTitle(event.target.value)}
                                />
                            </label>
                            <label className="block text-xs font-medium text-grayscale-700">
                                {m['shareLinks.note']()}
                                <textarea
                                    maxLength={500}
                                    disabled={locked || loading}
                                    rows={3}
                                    className={`${inputClass} mt-2 resize-y`}
                                    value={note}
                                    onChange={event => setNote(event.target.value)}
                                />
                            </label>
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
                                {expiresAt && (
                                    <p className="text-xs text-grayscale-600 mt-3">
                                        {m['shareLinks.expires']({
                                            date: new Date(expiresAt).toLocaleDateString(),
                                        })}
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
                    {step === 'details' && !locked ? (
                        <button
                            disabled={loading}
                            className={secondary}
                            onClick={() => {
                                setStep('choose');
                                setError(false);
                            }}
                        >
                            <IonIcon icon={arrowBackOutline} /> {m['shareLinks.back']()}
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
                            onClick={() => void create()}
                        >
                            {loading ? (
                                <Busy>{m['shareLinks.creating']()}</Busy>
                            ) : locked ? (
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
