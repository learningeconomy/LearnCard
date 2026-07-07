import { createTRPCClient, httpBatchLink } from '@trpc/client';

import type { ConsoleRouter } from '@console-bff/trpc/router';

export const trpc = createTRPCClient<ConsoleRouter>({
    links: [
        httpBatchLink({
            url: '/trpc',
            fetch: (url, options) => fetch(url, { ...options, credentials: 'include' }),
        }),
    ],
});
