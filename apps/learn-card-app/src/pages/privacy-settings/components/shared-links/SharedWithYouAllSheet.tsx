import React, { useEffect, useRef } from 'react';

import * as m from '../../../../paraglide/messages.js';
import { ListShell, MessageRow, SkeletonRows } from './ListCard';
import ReceivedCollectionRow from './ReceivedCollectionRow';
import { SheetChrome } from './SharedLinksAllSheet';
import { useSharedLinksStore } from './sharedLinksStore';

const SharedWithYouAllSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const saved = useSharedLinksStore(state => state.vm?.savedCollections);
    const hadVmRef = useRef(false);

    // Close when the store's vm transitions to null (the section unmounted),
    // mirroring ShareLinkDetailSheet and SharedLinksAllSheet.
    useEffect(() => {
        if (saved) {
            hadVmRef.current = true;
        } else if (hadVmRef.current) {
            onClose();
        }
    }, [saved, onClose]);

    if (!saved) return null;

    return (
        <SheetChrome
            title={m['dataShareCenter.shared.sharedWithYou']()}
            onClose={onClose}
            refreshing={saved.isLoading}
            onRefresh={() => void saved.onRefresh()}
        >
            <ListShell label={m['dataShareCenter.shared.sharedWithYou']()}>
                {saved.isLoading && saved.records.length === 0 ? (
                    <SkeletonRows count={5} />
                ) : saved.error ? (
                    <MessageRow
                        tone="error"
                        action={
                            <button
                                type="button"
                                className="text-sm font-medium text-grayscale-700 underline"
                                onClick={() => void saved.onRefresh()}
                            >
                                {m['shareLinks.retry']()}
                            </button>
                        }
                    >
                        {m['dataShareCenter.shared.savedLoadError']()}
                    </MessageRow>
                ) : saved.records.length === 0 ? (
                    <MessageRow>{m['dataShareCenter.shared.receivedEmpty']()}</MessageRow>
                ) : (
                    saved.records.map(collection => (
                        <ReceivedCollectionRow
                            key={collection.uri}
                            collection={collection}
                            onOpen={saved.onPreview}
                        />
                    ))
                )}
            </ListShell>
        </SheetChrome>
    );
};

export default SharedWithYouAllSheet;
