import React, { useMemo } from 'react';
import { IonIcon } from '@ionic/react';
import { calendarOutline, closeOutline } from 'ionicons/icons';
import type { SharePayload } from '@learncard/types';

import type { SavedCredentialCollection } from '../../pages/privacy-settings/DataSharingCenter.types';
import * as m from '../../paraglide/messages.js';
import { ShareLinkPreview } from './ShareLinkPreview';

type SavedCollectionPreviewProps = {
    collection: SavedCredentialCollection;
    onDismiss: () => void;
};

export const SavedCollectionPreview = ({ collection, onDismiss }: SavedCollectionPreviewProps) => {
    const payload = useMemo<Pick<SharePayload, 'presentation' | 'selection' | 'endorsements'>>(
        () => ({
            presentation: collection.presentation,
            selection: Array.from({ length: collection.credentialCount }, (_, credentialIndex) => ({
                credentialIndex,
            })),
            endorsements: [],
        }),
        [collection]
    );

    return (
        <div className="flex h-full min-h-0 flex-col bg-grayscale-100 font-poppins">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-grayscale-200 bg-white px-5 py-4 md:px-8">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-grayscale-500">
                        {m['dataShareCenter.shared.savedPreviewEyebrow']()}
                    </p>
                    <h1 className="text-xl font-semibold text-grayscale-900">
                        {m['dataShareCenter.shared.savedPreviewTitle']()}
                    </h1>
                </div>
                <button
                    type="button"
                    aria-label={m['common.close']()}
                    onClick={onDismiss}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-grayscale-300 bg-white text-xl text-grayscale-700 transition-colors hover:bg-grayscale-10"
                >
                    <IonIcon icon={closeOutline} />
                </button>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
                <div className="mx-auto w-full max-w-4xl">
                    <ShareLinkPreview
                        payload={payload}
                        title={m['dataShareCenter.shared.savedCollectionTitle']()}
                        showExpiry={false}
                        summaryExtra={
                            <div className="flex items-center gap-1.5 border-t border-grayscale-100 pt-4 text-xs text-grayscale-500">
                                <IonIcon icon={calendarOutline} />
                                <time dateTime={collection.receivedAt}>
                                    {m['dataShareCenter.shared.savedOn']({
                                        date: new Date(collection.receivedAt).toLocaleDateString(),
                                    })}
                                </time>
                            </div>
                        }
                    />
                </div>
            </main>
        </div>
    );
};

export default SavedCollectionPreview;
