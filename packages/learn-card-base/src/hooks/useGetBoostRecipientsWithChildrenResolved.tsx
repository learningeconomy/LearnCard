import { useQuery } from '@tanstack/react-query';
import { useIsLoggedIn, useWallet } from 'learn-card-base';
import {
    BoostQuery,
    PaginatedBoostRecipientsWithChildrenType,
    BoostRecipientWithChildrenInfo,
    VC,
} from '@learncard/types';

export type BoostRecipientWithChildrenResolved = BoostRecipientWithChildrenInfo & {
    resolvedBoostsByUri: Record<string, VC | undefined>;
    resolvedBoostVCs: VC[];
};

export type PaginatedBoostRecipientsWithChildrenResolved = Omit<
    PaginatedBoostRecipientsWithChildrenType,
    'records'
> & {
    records: BoostRecipientWithChildrenResolved[];
};

export const useGetBoostRecipientsWithChildrenResolved = (
    uri: string | undefined,
    numberOfGenerations: number = 9,
    query?: BoostQuery | undefined,
    enabled = true
) => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();

    return useQuery<PaginatedBoostRecipientsWithChildrenResolved | undefined>({
        queryKey: [
            'useGetBoostRecipientsWithChildrenResolved',
            uri ?? '',
            query ?? {},
            numberOfGenerations,
        ],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = isLoggedIn ? await initWallet() : await initWallet('a'.repeat(64));

                const page = await wallet.invoke.getPaginatedBoostRecipientsWithChildren(
                    uri,
                    undefined,
                    undefined,
                    false,
                    query,
                    undefined,
                    numberOfGenerations
                );

                const allUris = Array.from(
                    new Set(
                        (page?.records ?? []).flatMap(r => (r?.boostUris ?? []).filter(Boolean))
                    )
                ) as string[];

                const entries = await Promise.all(
                    allUris.map(async boostUri => {
                        try {
                            const vc = (await wallet.invoke.resolveFromLCN(boostUri)) as
                                | VC
                                | undefined;
                            return [boostUri, vc] as const;
                        } catch {
                            return [boostUri, undefined] as const;
                        }
                    })
                );
                const byUri = Object.fromEntries(entries) as Record<string, VC | undefined>;

                const enrichedRecords: BoostRecipientWithChildrenResolved[] = (
                    page?.records ?? []
                ).map(r => {
                    const resolvedBoostVCs = (r?.boostUris ?? [])
                        .map(u => byUri[u])
                        .filter(Boolean) as VC[];
                    const resolvedBoostsByUri: Record<string, VC | undefined> = {};
                    for (const u of r?.boostUris ?? []) resolvedBoostsByUri[u] = byUri[u];
                    return {
                        ...r,
                        resolvedBoostsByUri,
                        resolvedBoostVCs,
                    };
                });

                const result: PaginatedBoostRecipientsWithChildrenResolved = {
                    hasMore: page?.hasMore ?? false,
                    cursor: page?.cursor,
                    records: enrichedRecords,
                };

                return result;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(uri),
    });
};
