import { VPValidator } from '@learncard/types';

import {
    mapWithConcurrency,
    parseSavedShareLinkMetadata,
    type ShareWallet,
} from '../../components/share-links/shareLinkFlow';
import type { SavedCredentialCollection } from './DataSharingCenter.types';

export const loadSavedCredentialCollections = async (
    wallet: ShareWallet
): Promise<SavedCredentialCollection[]> => {
    const received = await wallet.invoke.getReceivedPresentations();
    let readFailures = 0;
    const hydrated = await mapWithConcurrency(received, 4, async item => {
        try {
            const rawPresentation = await wallet.read.get(item.uri);
            const parsed = VPValidator.safeParse(rawPresentation);
            if (!parsed.success) {
                readFailures += 1;
                return null;
            }
            // Validate structurally without replacing the signed document with
            // Zod's parsed copy, which may omit credential extension fields.
            const presentation = rawPresentation as typeof parsed.data;
            const rawCredentials = presentation.verifiableCredential;
            const credentials = Array.isArray(rawCredentials)
                ? rawCredentials
                : rawCredentials
                  ? [rawCredentials]
                  : [];

            // Only a recipient's own send/accept can carry collection labels.
            // Metadata from an unrelated sender is not signed VP content.
            const metadata =
                item.from === item.to ? parseSavedShareLinkMetadata(item.metadata) : undefined;
            const collection = {
                uri: item.uri,
                ...(metadata
                    ? {
                          shareId: metadata.shareId,
                          title: metadata.title,
                          ...(metadata.note ? { note: metadata.note } : {}),
                          sharer: metadata.sharer,
                      }
                    : {}),
                receivedAt: item.received ?? item.sent,
                presentation: { ...presentation, verifiableCredential: credentials },
                credentialCount: credentials.length,
            } satisfies SavedCredentialCollection;

            return {
                collection,
                shareKey: metadata ? `share:${metadata.shareId}` : undefined,
                presentationKey: `presentation:${JSON.stringify(presentation)}`,
            };
        } catch {
            readFailures += 1;
            return null;
        }
    });
    // A signed presentation may be reused by distinct links. Collapse contextual
    // saves by link identity; suppress matching legacy copies, not other links.
    const seen = new Set(hydrated.flatMap(item => (item?.shareKey ? [item.presentationKey] : [])));
    const collections = hydrated
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort(
            (a, b) =>
                new Date(b.collection.receivedAt).getTime() -
                new Date(a.collection.receivedAt).getTime()
        )
        .flatMap(item => {
            const key = item.shareKey ?? item.presentationKey;
            if (seen.has(key)) return [];
            seen.add(key);
            return [item.collection];
        });
    if (received.length > 0 && collections.length === 0 && readFailures > 0) {
        throw new Error('saved-collections');
    }
    return collections;
};
