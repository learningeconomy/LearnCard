import React, { useEffect, useRef, useState } from 'react';

import { ModalTypes, useModal } from 'learn-card-base';

import * as m from '../../paraglide/messages.js';
import FeaturedCredentialPreview, {
    type FeaturedCredentialOwner,
} from './FeaturedCredentialPreview';
import { getFeaturedCredentialDisplay } from './featuredCredentialBubbles.helpers';
import {
    type ResolvedFeaturedCredential,
    useResolvedFeaturedCredentials,
} from './useResolvedFeaturedCredentials';

const BUBBLE_CLASSES =
    'relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-white shadow-box-bottom transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-emerald-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0';

type FeaturedCredentialBubbleProps = {
    item: ResolvedFeaturedCredential;
    onOpen: (item: ResolvedFeaturedCredential) => void;
};

const FeaturedCredentialBubble: React.FC<FeaturedCredentialBubbleProps> = ({ item, onOpen }) => {
    const { title, imageUrl, FallbackIcon } = getFeaturedCredentialDisplay(item.credential);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => setImageFailed(false), [imageUrl]);

    const label = title || m['featuredCredentials.credentialFallback']();
    const showImage = Boolean(imageUrl) && !imageFailed;

    return (
        <button
            type="button"
            onClick={() => onOpen(item)}
            aria-label={m['featuredCredentials.view']({ title: label })}
            title={label}
            className={BUBBLE_CLASSES}
        >
            {showImage ? (
                <img
                    src={imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <span aria-hidden="true" className="flex h-full w-full items-center justify-center">
                    <FallbackIcon className="h-full w-full" />
                </span>
            )}
        </button>
    );
};

type FeaturedCredentialBubblesProps = {
    /** The profile's public `highlightedCredentials`, in the owner's stored order. */
    uris: readonly (string | undefined)[] | undefined;
    /** The profile that features these credentials; shown as their recipient in the detail view. */
    owner?: FeaturedCredentialOwner;
    className?: string;
};

/**
 * Compact row of tappable credential bubbles for an identity card. Renders nothing until at
 * least one featured credential resolves; tapping a bubble opens its detail view.
 */
export const FeaturedCredentialBubbles: React.FC<FeaturedCredentialBubblesProps> = ({
    uris,
    owner,
    className = '',
}) => {
    const { credentials } = useResolvedFeaturedCredentials(uris);
    const { newModal, closeModal } = useModal();
    const previewOpen = useRef(false);

    if (credentials.length === 0) return null;

    const openPreview = (item: ResolvedFeaturedCredential): void => {
        if (previewOpen.current) return;
        previewOpen.current = true;

        const { categoryType } = getFeaturedCredentialDisplay(item.credential);

        newModal(
            <FeaturedCredentialPreview
                credential={item.credential}
                categoryType={categoryType}
                owner={owner}
                onClose={() => {
                    previewOpen.current = false;
                    closeModal();
                }}
            />,
            {
                onClose: () => {
                    previewOpen.current = false;
                },
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    return (
        <ul
            role="list"
            aria-label={m['featuredCredentials.label']()}
            className={`flex items-center px-0.5 pb-1.5 pt-1 ${className}`.trim()}
        >
            {credentials.map(item => (
                <li
                    key={item.uri}
                    className="relative -ms-2 first:ms-0 hover:z-10 focus-within:z-10"
                >
                    <FeaturedCredentialBubble item={item} onOpen={openPreview} />
                </li>
            ))}
        </ul>
    );
};

export default FeaturedCredentialBubbles;
