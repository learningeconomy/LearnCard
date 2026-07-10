import { createTRPCClient, TRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@learncard/simple-signing-service';

import { callbackLink } from './callbackLink';

export type Client = TRPCClient<AppRouter>;

export const getClient = async (
    url: string,
    didAuthFunction: (challenge?: string) => Promise<string>
): Promise<Client> => {
    let challenges: string[] = [];

    const challengeRequester = createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({ url, headers: { Authorization: `Bearer ${await didAuthFunction()}` } }),
        ],
    }) as Client;

    const getChallenges = async (
        amount = 95 + Math.round((Math.random() - 0.5) * 5)
    ): Promise<string[]> => {
        return challengeRequester.utilities.getChallenges.query({ amount });
    };

    // Challenges are fetched lazily on first use so that constructing a client
    // that is never used doesn't cost a network round-trip
    let refillPromise: Promise<void> | undefined;

    const refillChallenges = (): Promise<void> => {
        refillPromise ??= getChallenges()
            .then(result => {
                challenges.push(...result);
            })
            .finally(() => {
                refillPromise = undefined;
            });

        return refillPromise;
    };

    const trpc = createTRPCClient<AppRouter>({
        links: [
            callbackLink(async () => {
                challenges = await getChallenges();
            }),
            httpBatchLink({
                url,
                headers: async () => {
                    if (challenges.length === 0) await refillChallenges();

                    return { Authorization: `Bearer ${await didAuthFunction(challenges.pop())}` };
                },
            }),
        ],
    }) as Client;

    return trpc;
};

export default getClient;
