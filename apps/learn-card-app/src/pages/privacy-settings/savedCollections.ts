import { VPValidator } from '@learncard/types';

import {
    parseSavedShareLinkMetadata,
    type ShareWallet,
} from '../../components/share-links/shareLinkFlow';
import type { SavedCredentialCollection } from './DataSharingCenter.types';

const hydrateWithConcurrency = async <T, R>(
    items: T[],
    concurrency: number,
    hydrate: (item: T) => Promise<R>
): Promise<R[]> => {
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    const worker = async (): Promise<void> => {
        while (nextIndex < items.length) {
            const index = nextIndex++;
            results[index] = await hydrate(items[index]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
    return results;
};

export const loadSavedCredentialCollections = async (
    wallet: ShareWallet
): Promise<SavedCredentialCollection[]> => {
    const received = await wallet.invoke.getReceivedPresentations();
    let readFailures = 0;
    const hydrated = await hydrateWithConcurrency(received, 4, async item => {
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
        .filter(
            (
                item
            ): item is {
                collection: SavedCredentialCollection;
                shareKey?: string;
                presentationKey: string;
            } => item !== null
        )
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
