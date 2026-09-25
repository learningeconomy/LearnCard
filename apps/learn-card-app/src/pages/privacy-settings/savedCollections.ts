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

            const metadata = parseSavedShareLinkMetadata(item.metadata);
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
    const seen = new Set<string>();
    const collections = hydrated
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort(
            (a, b) =>
                new Date(b.collection.receivedAt).getTime() -
                new Date(a.collection.receivedAt).getTime()
        )
        .flatMap(item => {
            if (
                seen.has(item.presentationKey) ||
                (item.shareKey !== undefined && seen.has(item.shareKey))
            )
                return [];
            seen.add(item.presentationKey);
            if (item.shareKey) seen.add(item.shareKey);
            return [item.collection];
        });
    if (received.length > 0 && collections.length === 0 && readFailures > 0) {
        throw new Error('saved-collections');
    }
    return collections;
};
