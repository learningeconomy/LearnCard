import { VPValidator } from '@learncard/types';

import type { ShareWallet } from '../../components/share-links/shareLinkFlow';
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

            return {
                uri: item.uri,
                receivedAt: item.received ?? item.sent,
                presentation: { ...presentation, verifiableCredential: credentials },
                credentialCount: credentials.length,
            } satisfies SavedCredentialCollection;
        } catch {
            readFailures += 1;
            return null;
        }
    });
    const collections = hydrated
        .filter((item): item is SavedCredentialCollection => item !== null)
        .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
    if (received.length > 0 && collections.length === 0 && readFailures > 0) {
        throw new Error('saved-collections');
    }
    return collections;
};
