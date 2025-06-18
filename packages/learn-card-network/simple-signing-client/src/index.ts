import { createTRPCProxyClient, httpBatchLink, type CreateTRPCProxyClient } from '@trpc/client';
import type { AppRouter } from '@learncard/simple-signing-service';

import { callbackLink } from './callbackLink';

export type Client = CreateTRPCProxyClient<AppRouter>;

export const getClient = async (
    url: string,
    didAuthFunction: (challenge?: string) => Promise<string>
): Promise<Client> => {
    let challenges: string[] = [];

    const challengeRequester = createTRPCProxyClient<AppRouter>({
        links: [
            httpBatchLink({ url, headers: { Authorization: `Bearer ${await didAuthFunction()}` } }),
        ],
    }) as Client;

    const getChallenges = async (
        amount = 95 + Math.round((Math.random() - 0.5) * 5)
    ): Promise<string[]> => {
        return challengeRequester.utilities.getChallenges.query({ amount });
    };

    getChallenges().then(result => (challenges = result));

    const trpc = createTRPCProxyClient<AppRouter>({
        links: [
            callbackLink(async () => {
                challenges = await getChallenges();
            }),
            httpBatchLink({
                url,
                headers: async () => {
                    if (challenges.length === 0) challenges.push(...(await getChallenges()));

                    return { Authorization: `Bearer ${await didAuthFunction(challenges.pop())}` };
                },
            }),
        ],
    }) as Client;

    return trpc;
};

export default getClient;
