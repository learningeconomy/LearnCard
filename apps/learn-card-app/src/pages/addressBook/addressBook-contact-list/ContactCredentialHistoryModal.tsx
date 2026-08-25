import React from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { alertCircleOutline, closeOutline } from 'ionicons/icons';

import type { LCNProfile } from '@learncard/types';
import { useGetContactRelationship, useModal } from 'learn-card-base';

import ContactCredentialPreview from './ContactCredentialPreview';
import * as m from '../../../paraglide/messages.js';

type ContactCredentialHistoryModalProps = {
    contact: LCNProfile;
};

export const ContactCredentialHistoryModal: React.FC<ContactCredentialHistoryModalProps> = ({
    contact,
}) => {
    const { closeModal } = useModal();
    const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useGetContactRelationship(contact.profileId, { limit: 20 });

    const records = data?.pages.flatMap(page => page.records) ?? [];

    return (
        <div className="flex h-full w-full flex-col bg-grayscale-10 font-poppins">
            <header className="flex items-center justify-between border-b border-grayscale-200 bg-white px-6 py-4">
                <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold text-grayscale-900">
                        {m['contacts.relationship.historyTitle']()}
                    </h2>
                    <p className="truncate text-sm text-grayscale-600">{contact.displayName}</p>
                </div>
                <button
                    type="button"
                    onClick={closeModal}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-grayscale-100 text-grayscale-700 transition-colors hover:bg-grayscale-200"
                    aria-label={m['common.close']()}
                >
                    <IonIcon icon={closeOutline} className="text-2xl" aria-hidden="true" />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-grayscale-600">
                        <IonSpinner name="crescent" />
                        <p className="text-sm">{m['contacts.relationship.loadingHistory']()}</p>
                    </div>
                ) : isError ? (
                    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-2xl text-red-400"
                            aria-hidden="true"
                        />
                        <p className="mt-2 text-sm text-red-700">
                            {m['contacts.relationship.loadError']()}
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-4 rounded-[20px] border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700"
                        >
                            {m['contacts.relationship.tryAgain']()}
                        </button>
                    </div>
                ) : (
                    <div className="mx-auto max-w-xl space-y-3">
                        {records.map(record => (
                            <ContactCredentialPreview
                                key={`${record.direction}-${record.uri}`}
                                record={record}
                                variant="row"
                            />
                        ))}
                        {hasNextPage && (
                            <button
                                type="button"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="flex w-full items-center justify-center rounded-[20px] border border-grayscale-300 bg-white px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:opacity-40"
                            >
                                {isFetchingNextPage
                                    ? m['contacts.relationship.loadingMore']()
                                    : m['contacts.relationship.loadMore']()}
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ContactCredentialHistoryModal;
