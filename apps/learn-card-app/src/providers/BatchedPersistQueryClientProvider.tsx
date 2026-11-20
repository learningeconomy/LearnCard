import React from 'react';
import { IsRestoringProvider, QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import {
    persistQueryClientRestore,
    persistQueryClientSave,
    type PersistQueryClientOptions,
} from '@tanstack/react-query-persist-client';

const CACHE_EVENTS = new Set(['added', 'removed', 'updated']);

/**
 * TanStack's subscription dehydrates the whole cache on every cache event and only then hands
 * the snapshot to the persister (which already batches writes). A cold start adds hundreds of
 * queries in a few renders, so that is O(queries²) work on the main thread while the first
 * screen renders. Coalesce events first: one dehydrate per `waitMs`, and one more on unsubscribe.
 */
export const subscribeBatched = (options: PersistQueryClientOptions, waitMs: number) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
        timer = undefined;
        void persistQueryClientSave(options);
    };
    const onEvent = (event: { type: string }) => {
        if (timer === undefined && CACHE_EVENTS.has(event.type)) timer = setTimeout(save, waitMs);
    };
    const unsubscribeQueries = options.queryClient.getQueryCache().subscribe(onEvent);
    const unsubscribeMutations = options.queryClient.getMutationCache().subscribe(onEvent);
    return () => {
        unsubscribeQueries();
        unsubscribeMutations();
        if (timer !== undefined) {
            clearTimeout(timer);
            save();
        }
    };
};

type Props = Omit<React.ComponentProps<typeof QueryClientProvider>, 'client'> & {
    client: QueryClient;
    persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>;
    onSuccess?: () => Promise<unknown> | unknown;
    onError?: () => Promise<unknown> | unknown;
    /** Coalescing window for cache events before one dehydrate (the persister batches writes on top). */
    batchMs?: number;
};

/** PersistQueryClientProvider (TanStack 5.102) with {@link subscribeBatched} instead of per-event saves. */
export const BatchedPersistQueryClientProvider: React.FC<Props> = ({
    children,
    persistOptions,
    onSuccess,
    onError,
    batchMs = 500,
    ...props
}) => {
    const [isRestoring, setIsRestoring] = React.useState(true);
    const refs = React.useRef({ persistOptions, onSuccess, onError });
    const didRestore = React.useRef(false);

    React.useEffect(() => {
        refs.current = { persistOptions, onSuccess, onError };
    });

    React.useEffect(() => {
        const options = { ...refs.current.persistOptions, queryClient: props.client };
        if (!didRestore.current) {
            didRestore.current = true;
            persistQueryClientRestore(options)
                .then(() => refs.current.onSuccess?.())
                .catch(() => refs.current.onError?.())
                .finally(() => setIsRestoring(false));
        }
        return isRestoring ? undefined : subscribeBatched(options, batchMs);
    }, [props.client, isRestoring, batchMs]);

    return (
        <QueryClientProvider {...props}>
            <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
        </QueryClientProvider>
    );
};
