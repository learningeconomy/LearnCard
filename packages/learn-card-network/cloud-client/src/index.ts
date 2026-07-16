import { createTRPCClient, TRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@learncard/learn-cloud-service';

import { callbackLink } from './callbackLink';

type Client = TRPCClient<AppRouter>;

export type LearnCloudClient = Client;

export const getClient = async (
    url: string,
    didAuthFunction: (challenge?: string) => Promise<string>
): Promise<Client> => {
    let challenges: string[] = [];

    const challengeRequester = createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                methodOverride: 'POST',
                url,
                maxURLLength: 3072,
                maxItems: 50,
                headers: { Authorization: `Bearer ${await didAuthFunction()}` },
            }),
        ],
    });

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
                methodOverride: 'POST',
                url,
                maxItems: 50,
                maxURLLength: 3072,
                headers: async () => ({
                    Authorization: `Bearer ${await didAuthFunction(await takeChallenge())}`,
                }),
            }),
        ],
    });

    return trpc;
};

// Create a client that always uses a provided API token and never fetches challenges
export const getApiTokenClient = async (url: string, apiToken: string): Promise<Client> => {
    const trpc = createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                methodOverride: 'POST',
                url,
                maxURLLength: 3072,
                headers: { Authorization: `Bearer ${apiToken}` },
            }),
        ],
    });

    return trpc;
};

export default getClient;
