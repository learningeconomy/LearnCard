import {
    getEndorsementTargetId,
    resolveSharedCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import {
    LCNProfile,
    type CredentialSharePreview,
    type PublishCredentialSharePreview,
} from '@learncard/types';
import { QueryClient, InfiniteData } from '@tanstack/react-query';

/** Preserve encoded URI components when the recipient parses the share query once. */
export const buildCredentialShareUrl = (
    host: string,
    route: string,
    params: { uri: string; seed: string; pin: string }
): string => {
    const url = new URL(`https://${host}/${route}`);
    url.search = new URLSearchParams(params).toString();
    return url.toString();
};

export const getSharedCredentialIndexQueries = (
    sharedCredentialUri: string,
    credentialId?: string
): Record<string, string>[] => {
    const legacyQuery = { sharedCredentialUri };

    return credentialId
        ? [
              { sharedCredentialKey: JSON.stringify([sharedCredentialUri, credentialId]) },
              legacyQuery,
          ]
        : [legacyQuery];
};

type SharedCredentialIndexReference = {
    credentialId?: string;
    publicPreviewId?: string;
    uri: string;
    randomSeed: string;
    pin: string;
};

export const sharedCredentialIndexMatchesCredential = async (
    record: SharedCredentialIndexReference,
    credentialId?: string
): Promise<boolean> => {
    if (!credentialId) return true;
    if (record.credentialId) return record.credentialId === credentialId;

    const sharedCredential = await resolveSharedCredential(
        new URLSearchParams({
            uri: record.uri,
            seed: record.randomSeed,
            pin: record.pin,
        }).toString()
    );

    return sharedCredential
        ? (await getEndorsementTargetId(sharedCredential)) === credentialId
        : false;
};

/** Prefer an already published matching presentation for ordinary re-shares. */
export const findMatchingSharedCredentialIndex = async <
    RecordType extends SharedCredentialIndexReference,
>(
    records: RecordType[],
    credentialId?: string,
    verifyCredential = false
): Promise<RecordType | undefined> => {
    let fallback: RecordType | undefined;
    for (const record of records) {
        if (
            !verifyCredential ||
            (await sharedCredentialIndexMatchesCredential(record, credentialId))
        ) {
            if (record.publicPreviewId) return record;
            fallback ??= record;
        }
    }

    return fallback;
};

/** Refresh the same presentation, recreate a missing preview, and roll back failed new references. */
export const publishSharePreview = async (
    link: string,
    metadata: CredentialSharePreview | undefined,
    publicPreviewId: string | undefined,
    publish: (input: PublishCredentialSharePreview) => Promise<string>,
    saveReference: (id: string) => Promise<number>,
    remove: (id: string) => Promise<boolean>
): Promise<string> => {
    if (!metadata) return link;
    const url = new URL(link);
    const shareUri = url.searchParams.get('uri');
    if (!shareUri) throw new Error('Share link is missing presentation URI');
    let previewId: string;
    try {
        previewId = await publish({
            ...metadata,
            shareUri,
            ...(publicPreviewId ? { id: publicPreviewId } : {}),
        });
    } catch (error) {
        const code = (error as { data?: { code?: unknown } } | null | undefined)?.data?.code;
        if (!publicPreviewId || code !== 'NOT_FOUND') throw error;
        previewId = await publish({ ...metadata, shareUri });
    }
    if (previewId !== publicPreviewId) {
        try {
            const updated = await saveReference(previewId);
            if (!updated) throw new Error('Unable to save public preview reference');
        } catch (error) {
            try {
                await remove(previewId);
            } catch (cleanupError) {
                throw new AggregateError(
                    [error, cleanupError],
                    'Unable to save public preview reference and clean up the new preview',
                    { cause: cleanupError }
                );
            }
            throw error;
        }
    }
    url.searchParams.set('preview', previewId);
    return url.toString();
};

// Helper to insert an object and update the react infinite query cache
export const insertItem = <GenericObject extends Record<string, any>>(
    queryClient: QueryClient,
    queryKey: string[],
    newItem: GenericObject
) => {
    queryClient.setQueryData<
        InfiniteData<
            { records: GenericObject[]; hasMore: boolean; cursor?: string },
            string | undefined
        >
    >(queryKey, old => {
        // No usable list yet (missing, empty, or a malformed persisted entry): start a fresh one.
        if (!Array.isArray(old?.pages) || !old.pages[0] || !Array.isArray(old.pageParams)) {
            return { pageParams: [undefined], pages: [{ records: [newItem], hasMore: false }] };
        }

        // Prepend to the first page only. Every page keeps its server cursor and hasMore, and
        // pages stay aligned with pageParams, so hasNextPage is unchanged until the refetch.
        const [firstPage, ...rest] = old.pages;
        return {
            ...old,
            pages: [{ ...firstPage, records: [newItem, ...firstPage.records] }, ...rest],
        };
    });
};

// Function to update admin list
export const updateAdminList = (
    queryClient: QueryClient,
    boostUri: string,
    newAdmin: LCNProfile
) => {
    queryClient.setQueryData(
        ['getAdmins', boostUri],
        (old: { hasMore: boolean; records: LCNProfile[] } | undefined) => {
            if (!old) {
                return {
                    hasMore: false,
                    records: [newAdmin],
                };
            }

            return {
                ...old,
                records: [...old.records, newAdmin],
            };
        }
    );
};
