import React, { useMemo, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { alertCircleOutline, closeOutline, searchOutline } from 'ionicons/icons';

import type { LCNProfile, VC } from '@learncard/types';
import {
    CredentialCategoryEnum,
    ToastTypeEnum,
    categoryMetadata,
    getDefaultCategoryForCredential,
    getCredentialName,
    useGetCredentialList,
    useGetResolvedCredentials,
    useToast,
    useWallet,
} from 'learn-card-base';
import type { CredentialCategory } from 'learn-card-base/types/credentials';

import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import * as m from '../../../paraglide/messages.js';

type SendContactCredentialsModalProps = {
    contact: LCNProfile;
    onCancel: () => void;
    onComplete: () => void;
};

export const SendContactCredentialsModal: React.FC<SendContactCredentialsModalProps> = ({
    contact,
    onCancel,
    onComplete,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const [search, setSearch] = useState('');
    const [selectedUris, setSelectedUris] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);

    const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
        useGetCredentialList();
    const records = (data?.pages.flatMap(page => page.records ?? []) ?? []).filter(
        (record): record is NonNullable<typeof record> => Boolean(record)
    );
    const resolved = useGetResolvedCredentials(records.map(record => record.uri));

    const credentials = useMemo(
        () =>
            records
                .map((record, index) => {
                    const credential = resolved[index]?.data as VC | undefined;
                    const category = (record.category ??
                        (credential && getDefaultCategoryForCredential(credential)) ??
                        CredentialCategoryEnum.achievement) as CredentialCategory;

                    return { record, credential, category, loading: resolved[index]?.isLoading };
                })
                .filter(item => (item.record.category as string | undefined) !== 'Hidden'),
        [records, resolved]
    );

    const normalizedSearch = search.trim().toLowerCase();
    const visibleCredentials = credentials.filter(item => {
        if (!normalizedSearch) return true;
        if (!item.credential) return false;
        return getCredentialName(item.credential).toLowerCase().includes(normalizedSearch);
    });

    const toggleCredential = (uri: string): void => {
        setSelectedUris(current =>
            current.includes(uri) ? current.filter(value => value !== uri) : [...current, uri]
        );
    };

    const handleSend = async (): Promise<void> => {
        if (selectedUris.length === 0 || isSending) return;

        setIsSending(true);
        const selected = credentials.filter(
            item => item.credential && selectedUris.includes(item.record.uri)
        );

        try {
            const wallet = await initWallet();
            const results = await Promise.allSettled(
                selected.map(item =>
                    wallet.invoke.sendCredential(contact.profileId, item.credential as VC)
                )
            );
            const failedUris = results.flatMap((result, index) => {
                const item = selected[index];
                return result.status === 'rejected' && item ? [item.record.uri] : [];
            });
            const sentCount = results.length - failedUris.length;

            if (sentCount > 0) {
                presentToast(m['contacts.relationship.sendSuccess']({ count: sentCount }), {
                    type: ToastTypeEnum.Success,
                    hasDismissButton: true,
                });
            }

            if (failedUris.length > 0) {
                setSelectedUris(failedUris);
                presentToast(
                    m['contacts.relationship.sendPartialError']({ count: failedUris.length }),
                    {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    }
                );
                return;
            }

            onComplete();
        } catch {
            presentToast(m['contacts.relationship.sendError'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-grayscale-10 font-poppins">
            <header className="border-b border-grayscale-200 bg-white px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold text-grayscale-900">
                            {m['contacts.relationship.sendCredential']()}
                        </h2>
                        <p className="mt-1 truncate text-sm text-grayscale-600">
                            {m['contacts.relationship.sendTo']({ name: contact.displayName })}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSending}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-grayscale-100 text-grayscale-700 transition-colors hover:bg-grayscale-200 disabled:opacity-40"
                        aria-label={m['common.close']()}
                    >
                        <IonIcon icon={closeOutline} className="text-2xl" aria-hidden="true" />
                    </button>
                </div>
                <label className="relative mt-4 block">
                    <span className="sr-only">
                        {m['contacts.relationship.searchCredentials']()}
                    </span>
                    <IonIcon
                        icon={searchOutline}
                        className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-grayscale-500"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        placeholder={m['contacts.relationship.searchCredentials']()}
                        className="w-full rounded-xl border border-grayscale-300 bg-white py-3 pe-4 ps-11 text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </label>
            </header>

            <main className="flex-1 overflow-y-auto p-5">
                {isLoading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-grayscale-600">
                        <IonSpinner name="crescent" />
                        <p className="text-sm">{m['contacts.relationship.loadingCredentials']()}</p>
                    </div>
                ) : credentials.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-3xl text-grayscale-400"
                            aria-hidden="true"
                        />
                        <p className="mt-3 text-sm text-grayscale-600">
                            {m['contacts.relationship.noCredentialsToSend']()}
                        </p>
                    </div>
                ) : (
                    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {visibleCredentials.map(item => {
                            const metadata =
                                categoryMetadata[item.category as CredentialCategoryEnum] ??
                                categoryMetadata[CredentialCategoryEnum.achievement];

                            return (
                                <div key={item.record.uri} className="min-w-0">
                                    <BoostEarnedCard
                                        credential={item.credential}
                                        record={item.record}
                                        defaultImg={metadata.defaultImageSrc}
                                        categoryType={item.category}
                                        verifierState
                                        showChecked
                                        onCheckMarkClick={() => toggleCredential(item.record.uri)}
                                        initialCheckmarkState={selectedUris.includes(
                                            item.record.uri
                                        )}
                                        useWrapper={false}
                                        loading={item.loading}
                                        hideOptionsMenu
                                        compact
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasNextPage && (
                    <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="mx-auto mt-5 flex items-center justify-center rounded-[20px] border border-grayscale-300 bg-white px-5 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:opacity-40"
                    >
                        {isFetchingNextPage
                            ? m['contacts.relationship.loadingMore']()
                            : m['contacts.relationship.loadMore']()}
                    </button>
                )}
            </main>

            <footer className="border-t border-grayscale-200 bg-white p-5">
                <p className="mb-3 text-center text-xs font-medium text-grayscale-700">
                    {m['contacts.relationship.selectedCount']({ count: selectedUris.length })}
                </p>
                <div className="mx-auto flex max-w-xl gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSending}
                        className="flex-1 rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:opacity-40"
                    >
                        {m['common.cancel']()}
                    </button>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={selectedUris.length === 0 || isSending}
                        className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isSending && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                        {isSending
                            ? m['contacts.relationship.sending']()
                            : m['contacts.relationship.sendSelected']()}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default SendContactCredentialsModal;
