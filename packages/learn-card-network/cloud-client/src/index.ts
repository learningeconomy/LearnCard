import { createTRPCClient, CreateTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@learncard/learn-cloud-service';

import { callbackLink } from './callbackLink';

export const getClient = async (
    url: string,
    didAuthFunction: (challenge?: string) => Promise<string>
): Promise<CreateTRPCClient<AppRouter>> => {
    let challenges: string[] = [];

    const challengeRequester = createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                methodOverride: 'POST',
                url,
                maxURLLength: 3072,
                headers: { Authorization: `Bearer ${await didAuthFunction()}` },
            }),
        ],
    });

    const getChallenges = async (
        amount = 95 + Math.round((Math.random() - 0.5) * 5)
    ): Promise<string[]> => {
        return challengeRequester.utilities.getChallenges.query({ amount });
    };

    challenges = await getChallenges();

    const trpc = createTRPCClient<AppRouter>({
        links: [
            callbackLink(async () => {
                challenges = await getChallenges();
            }),
            httpBatchLink({
                methodOverride: 'POST',
                url,
                maxURLLength: 3072,
                headers: async () => {
                    if (challenges.length === 0) challenges.push(...(await getChallenges()));

                    return { Authorization: `Bearer ${await didAuthFunction(challenges.pop())}` };
                },
            }),
        ],
    });

    return trpc;
};

export default getClient;
