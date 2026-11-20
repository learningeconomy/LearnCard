import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, closeOutline } from 'ionicons/icons';
import { MAX_REFERRAL_OUTCOMES } from '@learncard/types';
import { useWallet, useModal, switchedProfileStore, walletStore } from 'learn-card-base';
import { loadContractAudience } from 'learn-card-base/hooks/consentAudience';
import { useConsentAudienceReview } from 'learn-card-base/hooks/useConsentAudienceReview';
import { useUploadVcFromText } from '../../hooks/useUploadVcFromText';
import useGuardianGate from '../../hooks/useGuardianGate';
import { ContractAudience } from './ContractAudience';
import * as m from '../../paraglide/messages.js';

const primary =
    'min-h-11 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500';
const secondary =
    'min-h-11 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-emerald-500';

/** Outcomes are explicit referral selections, independent of category sharing and live sync. */
export const ReferralOutcomes: React.FC<{
    contractUri: string;
    onComplete?: () => void;
    beforeSubmit?: () => void;
}> = ({ contractUri, onComplete, beforeSubmit }) => {
    const { initWallet } = useWallet();
    const { closeModal } = useModal();
    const queryClient = useQueryClient();
    const reviewAudience = useConsentAudienceReview();
    const { guardedAction } = useGuardianGate();
    const { uploadReferralOutcome } = useUploadVcFromText();
    const wallet = walletStore.use.wallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const profileDid = switchedDid ?? wallet?.id.did();
    const [file, setFile] = useState<File>();
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState<string>();
    const [error, setError] = useState<string>();
    const [notice, setNotice] = useState<string>();
    const uploaded = useRef<{ uri: string; audience: string; profileDid: string }>();
    const mounted = useRef(false);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const assertActive = () => {
        beforeSubmit?.();
        if (!mounted.current) throw new Error('Outcome screen closed');
        const currentDid =
            switchedProfileStore.get.switchedDid() ?? walletStore.get.wallet()?.id.did();
        if (!profileDid || currentDid !== profileDid) throw new Error('Account changed');
    };
    const readSelection = async () => {
        assertActive();
        const reader = await initWallet();
        if (reader.id.did() !== profileDid) throw new Error('Account changed');
        let page = await reader.invoke.getConsentedContracts();
        let selection = page.records.find(record => record.contract.uri === contractUri);
        while (!selection && page.hasMore && page.cursor) {
            page = await reader.invoke.getConsentedContracts({ cursor: page.cursor });
            selection = page.records.find(record => record.contract.uri === contractUri);
        }
        const audience = await loadContractAudience(reader, contractUri);
        assertActive();
        if (
            !selection ||
            selection.status !== 'live' ||
            audience.contract.status === 'retired' ||
            (selection.expiresAt && Date.parse(selection.expiresAt) <= Date.now()) ||
            (audience.contract.expiresAt && Date.parse(audience.contract.expiresAt) <= Date.now())
        )
            throw new Error('Referral is not active');
        return { reader, selection, audience };
    };
    const referral = useQuery({
        queryKey: ['referralOutcomes', profileDid, contractUri],
        enabled: Boolean(profileDid),
        queryFn: async () => {
            const { selection, audience } = await readSelection();
            return { selection, contract: audience.contract };
        },
        retry: false,
    });
    const refresh = async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: ['referralOutcomes', profileDid, contractUri],
            }),
            queryClient.invalidateQueries({ queryKey: ['useConsentedContracts'] }),
        ]);
        onComplete?.();
    };
    const share = async () => {
        if (!file || busy) return;
        setBusy('upload');
        setError(undefined);
        setNotice(undefined);
        try {
            await guardedAction(async () => {
                const { reader, selection, audience } = await readSelection();
                const fingerprint = JSON.stringify([audience.audienceVersion, audience.recipients]);
                let prepared = uploaded.current;
                if (prepared?.audience !== fingerprint || prepared.profileDid !== profileDid)
                    prepared = undefined;
                if (
                    (selection.terms.outcomes?.length ?? 0) >= MAX_REFERRAL_OUTCOMES &&
                    (!prepared || !selection.terms.outcomes?.includes(prepared.uri))
                ) {
                    setError(m['referralOutcomes.limit']({ count: MAX_REFERRAL_OUTCOMES }));
                    return;
                }
                await reviewAudience(audience.contract);
                assertActive();
                if (!prepared) {
                    const result = await uploadReferralOutcome(
                        file,
                        audience.recipients,
                        profileDid!
                    );
                    if (!result.success || !result.credentialUri) {
                        setError(
                            result.invalidFile
                                ? m['referralOutcomes.fileError']()
                                : m['referralOutcomes.error']()
                        );
                        return;
                    }
                    prepared = {
                        uri: result.credentialUri,
                        audience: fingerprint,
                        profileDid: profileDid!,
                    };
                    uploaded.current = prepared;
                }
                const outcomeUri = prepared.uri;
                // Review/upload can outlive guardian approval; recheck immediately at the write.
                await guardedAction(async () => {
                    assertActive();
                    const changed = await reader.invoke.attachReferralOutcome(
                        selection.uri,
                        outcomeUri,
                        audience.audienceVersion
                    );
                    if (!changed) {
                        const latest = await readSelection();
                        if (!latest.selection.terms.outcomes?.includes(outcomeUri))
                            throw new Error('Outcome was not attached');
                    }
                });
                uploaded.current = undefined;
                setFile(undefined);
                if (input.current) input.current.value = '';
                setNotice(m['referralOutcomes.added']());
                await refresh();
            });
        } catch {
            setError(m['referralOutcomes.error']());
        } finally {
            setBusy(undefined);
        }
    };
    const remove = async (uri: string) => {
        if (busy) return;
        setBusy(uri);
        setError(undefined);
        setNotice(undefined);
        try {
            await guardedAction(async () => {
                const { reader, selection, audience } = await readSelection();
                assertActive();
                const changed = await reader.invoke.detachReferralOutcome(
                    selection.uri,
                    uri,
                    audience.audienceVersion
                );
                if (!changed) {
                    const latest = await readSelection();
                    if (latest.selection.terms.outcomes?.includes(uri))
                        throw new Error('Outcome was not removed');
                }
                setNotice(m['referralOutcomes.removed']());
                await refresh();
            });
        } catch {
            setError(m['referralOutcomes.error']());
        } finally {
            setBusy(undefined);
        }
    };
    return (
        <section
            className="flex h-full min-h-0 flex-col bg-white font-poppins text-grayscale-900"
            aria-busy={Boolean(busy) || referral.isFetching}
        >
            <header className="flex shrink-0 items-center gap-3 border-b border-grayscale-200 px-6 py-4">
                <h2 className="flex-1 text-xl font-semibold">{m['referralOutcomes.title']()}</h2>
                <button
                    type="button"
                    aria-label={m['common.close']()}
                    disabled={Boolean(busy)}
                    onClick={closeModal}
                    className={secondary}
                >
                    <IonIcon icon={closeOutline} aria-hidden="true" />
                </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {referral.isPending ? (
                    <p role="status">{m['referralOutcomes.loading']()}</p>
                ) : referral.data ? (
                    <>
                        <h3 className="text-base font-semibold wrap-break-word">
                            {referral.data.contract.name}
                        </h3>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['referralOutcomes.description']()}
                        </p>
                        <ContractAudience
                            contract={referral.data.contract}
                            testId="outcome-audience"
                            alwaysShowOwner
                        />
                        {(referral.data.contract.readableDeliveryRecipients ?? []).some(
                            recipient => recipient.enabled
                        ) && (
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['consentFlow.readableDeliveryDisclosure']({
                                    organizations: (
                                        referral.data.contract.readableDeliveryRecipients ?? []
                                    )
                                        .filter(recipient => recipient.enabled)
                                        .map(recipient => recipient.displayName)
                                        .join(', '),
                                })}
                            </p>
                        )}
                        <p className="text-xs text-grayscale-600 leading-relaxed">
                            {m['referralOutcomes.privacy']()}
                        </p>
                        <div>
                            <label
                                htmlFor="referral-outcome-file"
                                className="mb-1.5 block text-xs font-medium text-grayscale-700"
                            >
                                {m['referralOutcomes.file']()}
                            </label>
                            <input
                                ref={input}
                                id="referral-outcome-file"
                                type="file"
                                accept=".json,application/json,application/ld+json"
                                disabled={Boolean(busy)}
                                aria-describedby="referral-outcome-hint"
                                onChange={event => {
                                    uploaded.current = undefined;
                                    setFile(event.target.files?.[0]);
                                    setError(undefined);
                                    setNotice(undefined);
                                }}
                                className="w-full rounded-xl border border-grayscale-300 bg-white px-4 py-3 text-sm text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <p
                                id="referral-outcome-hint"
                                className="mt-1.5 text-xs text-grayscale-500"
                            >
                                {m['referralOutcomes.hint']()}
                            </p>
                        </div>
                        <ul className="space-y-3">
                            {(referral.data.selection.terms.outcomes ?? []).map((uri, index) => (
                                <li key={uri} className="flex items-center gap-3 text-sm">
                                    <span className="flex-1">
                                        {m['referralOutcomes.outcome']({ number: index + 1 })}
                                    </span>
                                    <button
                                        type="button"
                                        className={secondary}
                                        disabled={Boolean(busy)}
                                        onClick={() => void remove(uri)}
                                    >
                                        {busy === uri
                                            ? m['referralOutcomes.removing']()
                                            : m['referralOutcomes.remove']({ number: index + 1 })}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {!referral.data.selection.terms.outcomes?.length && (
                            <p className="text-sm text-grayscale-500">
                                {m['referralOutcomes.empty']()}
                            </p>
                        )}
                    </>
                ) : (
                    <p role="alert" className="text-sm text-grayscale-600">
                        {m['referralOutcomes.unavailable']()}
                    </p>
                )}
                {(error || referral.isError) && (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                    >
                        <IonIcon
                            icon={alertCircleOutline}
                            aria-hidden="true"
                            className="shrink-0 text-red-400"
                        />
                        <div>
                            <p>{error ?? m['referralOutcomes.error']()}</p>
                            {referral.isError && (
                                <button
                                    type="button"
                                    className="mt-2 underline"
                                    disabled={referral.isFetching}
                                    onClick={() => void referral.refetch()}
                                >
                                    {referral.isFetching
                                        ? m['referralOutcomes.loading']()
                                        : m['common.tryAgain']()}
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {notice && (
                    <p
                        role="status"
                        className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700"
                    >
                        {notice}
                    </p>
                )}
            </div>
            <footer className="shrink-0 border-t border-grayscale-200 px-6 py-4">
                <button
                    type="button"
                    className={`${primary} w-full`}
                    disabled={!file || !referral.data || Boolean(busy)}
                    onClick={() => void share()}
                >
                    {busy === 'upload' ? (
                        <span className="flex items-center justify-center gap-2">
                            <span
                                aria-hidden="true"
                                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                            />
                            {m['referralOutcomes.sharing']()}
                        </span>
                    ) : (
                        m['referralOutcomes.add']()
                    )}
                </button>
            </footer>
        </section>
    );
};
