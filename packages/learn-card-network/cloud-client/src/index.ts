import { createTRPCProxyClient, CreateTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { inferRouterInputs } from '@trpc/server';
import type {
    JWE,
    PaginatedEncryptedRecordsType,
    PaginatedEncryptedCredentialRecordsType,
} from '@learncard/types';
import type { AppRouter } from '@learncard/learn-cloud-service';

import { callbackLink } from './callbackLink';

type Inputs = inferRouterInputs<AppRouter>;

type Client = CreateTRPCProxyClient<AppRouter>;

type OverriddenClient = Omit<Client, 'index' | 'customStorage'> & {
    index: Client['index'] & {
        get: {
            query: (
                args: Inputs['index']['get']
            ) => Promise<PaginatedEncryptedCredentialRecordsType | JWE>;
        };
    };
    customStorage: Omit<Client['customStorage'], 'read'> & {
        read: {
            query: (
                args: Inputs['customStorage']['read']
            ) => Promise<PaginatedEncryptedRecordsType>;
        };
    };
};

export type LearnCloudClient = OverriddenClient;

export const getClient = async (
    url: string,
    didAuthFunction: (challenge?: string) => Promise<string>
) => {
    let challenges: string[] = [];

    const challengeRequester = createTRPCProxyClient<AppRouter>({
        links: [
            httpBatchLink({
                url,
                maxURLLength: 3072,
                headers: { Authorization: `Bearer ${await didAuthFunction()}` },
            }),
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
                maxURLLength: 3072,
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
