import { createTRPCProxyClient, CreateTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { inferRouterInputs } from '@trpc/server';
import type { UnsignedVC, VC, VP, JWE } from '@learncard/types';
import type { AppRouter } from '@learncard/network-brain-service';

import { callbackLink } from './callbackLink';

type Inputs = inferRouterInputs<AppRouter>;

type Client = CreateTRPCProxyClient<AppRouter>;

type OverriddenClient = Client & {
    storage: Client['storage'] & {
        resolve: {
            query: (args: Inputs['storage']['resolve']) => Promise<VC | UnsignedVC | VP | JWE>;
        };
    };
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
    }) as OverriddenClient;

    const getChallenges = async (
        amount = 95 + Math.round((Math.random() - 0.5) * 5)
    ): Promise<string[]> => {
        return challengeRequester.utilities.getChallenges.query({ amount });
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
    }) as OverriddenClient;

    return trpc;
};

export default getClient;