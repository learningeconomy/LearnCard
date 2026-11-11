import { createTRPCClient, TRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@learncard/lca-api-service';

import { callbackLink } from './callbackLink';

export type Client = TRPCClient<AppRouter>;

/**
 * Longest GET URL the client will send. Queries carry their input in the URL, and API Gateway
 * answers HTTP 431 once the request line plus headers pass ~10KB (on staging a 9,376-byte URL
 * passed and a 9,425-byte one failed). Without a cap, httpBatchLink happily merges concurrent
 * queries into one URL past that limit, so batches are split to stay under this instead.
 *
 * Note that tRPC rejects a single operation that is longer than this on its own ("Input is too big
 * for a single dispatch") rather than sending it.
 */
export const LCA_API_MAX_URL_LENGTH = 8192;

export const getClient = async (
    url: string,
    didAuthFunction: (challenge?: string) => Promise<string>,
    extraHeaders?: Record<string, string>
): Promise<Client> => {
    let challenges: string[] = [];

    const challengeRequester = createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                url,
                headers: { Authorization: `Bearer ${await didAuthFunction()}`, ...extraHeaders },
            }),
        ],
    }) as Client;

    const getChallenges = async (
        amount = 95 + Math.round((Math.random() - 0.5) * 5)
    ): Promise<string[]> => {
        return challengeRequester.utilities.getChallenges.query({ amount });
    };

    let refillPromise: Promise<void> | undefined;

    const refillChallenges = (): Promise<void> => {
        refillPromise ??= getChallenges()
            .then(result => {
                if (result.length === 0) throw new Error('Challenge refill returned no challenges');

                challenges.push(...result);
            })
            .finally(() => {
                refillPromise = undefined;
            });

        return refillPromise;
    };

    const takeChallenge = async (): Promise<string> => {
        while (true) {
            const challenge = challenges.pop();
            if (challenge !== undefined) return challenge;

            await refillChallenges();
        }
    };

    const trpc = createTRPCClient<AppRouter>({
        links: [
            callbackLink(async () => {
                challenges = await getChallenges();
            }),
            httpBatchLink({
                url,
                maxURLLength: LCA_API_MAX_URL_LENGTH,
                headers: async () => ({
                    Authorization: `Bearer ${await didAuthFunction(await takeChallenge())}`,
                    ...extraHeaders,
                }),
            }),
        ],
    }) as Client;

    return trpc;
};

export default getClient;
