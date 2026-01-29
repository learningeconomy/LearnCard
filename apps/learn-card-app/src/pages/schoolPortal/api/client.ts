/**
 * Simple tRPC client for Ed.link routes (open routes, no auth required).
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { RegExpTransformer } from '@learncard/helpers';
import type { EdlinkConnection } from '@learncard/types';

// Brain service URL - uses Vite-injected LCN_URL, falls back to production
const BRAIN_URL = (typeof LCN_URL !== 'undefined' ? LCN_URL : 'https://brain.learncard.com/trpc').replace('/trpc', '');

// Type for the edlink router (until brain-service is rebuilt with edlink types)
type EdlinkRouter = {
    edlink: {
        createConnection: {
            mutate: (input: EdlinkConnection) => Promise<EdlinkConnection>;
        };
        getConnections: {
            query: () => Promise<EdlinkConnection[]>;
        };
        deleteConnection: {
            mutate: (input: { id: string }) => Promise<boolean>;
        };
    };
};

const baseClient = createTRPCClient<any>({
    links: [
        httpBatchLink({
            url: `${BRAIN_URL}/trpc`,
            transformer: {
                input: RegExpTransformer,
                output: { serialize: (o: unknown) => o, deserialize: (o: unknown) => o },
            },
        }),
    ],
});

export const edlinkApi = baseClient as unknown as EdlinkRouter;

export default edlinkApi;
