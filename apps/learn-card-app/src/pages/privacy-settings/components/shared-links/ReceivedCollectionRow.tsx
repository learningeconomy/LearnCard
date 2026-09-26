import React from 'react';
import { IonIcon } from '@ionic/react';
import { bookmarkOutline, chevronForward } from 'ionicons/icons';

import * as m from '../../../../paraglide/messages.js';
import type { SavedCredentialCollection } from '../../DataSharingCenter.types';
import CredentialStackGlyph from './CredentialStackGlyph';
import { avatarTint, credentialCountLabel, initialsFor } from './sharedLinkFormat';
import './sharedLinks.css';

const SenderAvatar: React.FC<{ collection: SavedCredentialCollection }> = ({ collection }) => {
    const sharer = collection.sharer;
    if (sharer?.avatar)
        return (
            <img
                src={sharer.avatar}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-grayscale-200"
            />
        );
    if (sharer?.displayName)
        return (
            <span
                aria-hidden="true"
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarTint(sharer.displayName)}`}
            >
                {initialsFor(sharer.displayName)}
            </span>
        );
    return (
        <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grayscale-100 text-grayscale-600"
        >
            <IonIcon icon={bookmarkOutline} />
        </span>
    );
};

const ReceivedCollectionRow: React.FC<{
    collection: SavedCredentialCollection;
    index?: number;
    animate?: boolean;
    onOpen: (collection: SavedCredentialCollection) => void;
}> = ({ collection, index = 0, animate = false, onOpen }) => (
    <li
        className={`group transition-colors hover:bg-grayscale-10 ${animate ? 'sl-row-in' : ''}`}
        style={animate ? { animationDelay: `${index * 30}ms` } : undefined}
    >
        <button
            type="button"
            onClick={() => onOpen(collection)}
            className="flex w-full items-center gap-3 py-3 pe-2 ps-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 group-first:rounded-t-[20px] group-last:rounded-b-[20px]"
        >
            <SenderAvatar collection={collection} />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-grayscale-900">
                    {collection.title ?? m['dataShareCenter.shared.savedCollectionTitle']()}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-grayscale-600">
                    {collection.sharer && (
                        <>
                            <span className="truncate">
                                {m['dataShareCenter.shared.receivedFrom']({
                                    name: collection.sharer.displayName,
                                })}
                            </span>
                            <span aria-hidden="true">·</span>
                        </>
                    )}
                    <CredentialStackGlyph count={collection.credentialCount} />
                    <span className="shrink-0">
                        {credentialCountLabel(collection.credentialCount)}
                    </span>
                </span>
            </span>
            <IonIcon
                icon={chevronForward}
                aria-hidden="true"
                className="me-2 shrink-0 text-grayscale-400 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            />
        </button>
    </li>
);

export default ReceivedCollectionRow;
