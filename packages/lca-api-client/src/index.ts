import { createTRPCClient, TRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@learncard/lca-api-service';

import { callbackLink } from './callbackLink';

export type Client = TRPCClient<AppRouter>;

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

    // Pre-warm the pool while the caller continues client/plugin setup. Requests
    // arriving before this settles await the same single-flight refill.
    void refillChallenges().catch(() => undefined);

    const trpc = createTRPCClient<AppRouter>({
        links: [
            callbackLink(async () => {
                challenges = await getChallenges();
            }),
            httpBatchLink({
                url,
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
