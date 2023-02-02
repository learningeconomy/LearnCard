import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { inferRouterInputs } from '@trpc/server';
import type { UnsignedVC, VC, VP } from '@learncard/types';
import type { AppRouter } from '@learncard/network-brain-service';

import { callbackLink } from './callbackLink';

type Inputs = inferRouterInputs<AppRouter>;

type Overrides = {
    getCredential: { query: (args: Inputs['getCredential']) => Promise<VC | UnsignedVC | VP> };
};

export const getClient = async (
    url: string,
    didAuthFunction: (challenge?: string) => Promise<string>
) => {
    let challenges: string[] = [];

    const challengeRequester = createTRPCProxyClient<AppRouter>({
        links: [
            httpBatchLink({ url, headers: { Authorization: `Bearer ${await didAuthFunction()}` } }),
        ],
    });

    let test = {} as VC;

    await challengeRequester.storeCredential.mutate({ credential: test });

    const getChallenges = async (
        amount = 95 + Math.round((Math.random() - 0.5) * 5)
    ): Promise<string[]> => {
        return challengeRequester.getChallenges.query({ amount });
    };

    challenges = await getChallenges();

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
    }) as Overrides & typeof challengeRequester;

    return trpc;
};

export default getClient;
