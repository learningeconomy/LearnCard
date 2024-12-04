import { RegExpTransformer } from '@learncard/helpers';
import { createTRPCProxyClient, CreateTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@learncard/network-brain-service';

import { callbackLink } from './callbackLink';

export type LCNClient = CreateTRPCProxyClient<AppRouter>;

export const getClient = async (
    url: string,
    didAuthFunction: (challenge?: string) => Promise<string>
): Promise<LCNClient> => {
    let challenges: string[] = [];

    const challengeRequester = createTRPCProxyClient<AppRouter>({
        transformer: {
            input: RegExpTransformer,
            output: { serialize: o => o, deserialize: o => o },
        },
        links: [
            httpBatchLink({
                url,
                maxURLLength: 2048,
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

    const trpc = createTRPCProxyClient<AppRouter>({
        transformer: {
            input: RegExpTransformer,
            output: { serialize: o => o, deserialize: o => o },
        },
        links: [
            callbackLink(async () => {
                challenges = await getChallenges();
            }),
            httpBatchLink({
                maxURLLength: 2048,
                url,
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
