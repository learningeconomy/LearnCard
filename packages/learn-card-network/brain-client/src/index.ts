import { RegExpTransformer } from '@learncard/helpers';
import { createTRPCClient, TRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@learncard/network-brain-service';

import { callbackLink } from './callbackLink';

export type LCNClient = TRPCClient<AppRouter>;

export type GuardianApprovalGetter = () => string | undefined | Promise<string | undefined>;

export const getClient = async (
    url: string,
    didAuthFunction: (challenge?: string) => Promise<string>,
    guardianApprovalGetter?: GuardianApprovalGetter,
    extraHeaders?: Record<string, string>
): Promise<LCNClient> => {
    let challenges: string[] = [];

    const challengeRequester = createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                methodOverride: 'POST',
                url,
                maxURLLength: 3072,
                headers: { Authorization: `Bearer ${await didAuthFunction()}`, ...extraHeaders },
                transformer: {
                    input: RegExpTransformer,
                    output: { serialize: o => o, deserialize: o => o },
                },
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
                maxURLLength: 3072,
                url,
                headers: async () => {
                    const challenge = await takeChallenge();

                    const guardianApproval = guardianApprovalGetter
                        ? await guardianApprovalGetter()
                        : undefined;

                    return {
                        Authorization: `Bearer ${await didAuthFunction(challenge)}`,
                        ...(guardianApproval ? { 'x-guardian-approval': guardianApproval } : {}),
                        ...extraHeaders,
                    };
                },
                transformer: {
                    input: RegExpTransformer,
                    output: { serialize: o => o, deserialize: o => o },
                },
            }),
        ],
    });

    return trpc;
};

// Create a client that always uses a provided API token and never fetches challenges
export const getApiTokenClient = async (
    url: string,
    apiToken: string,
    guardianApprovalGetter?: GuardianApprovalGetter,
    extraHeaders?: Record<string, string>
): Promise<LCNClient> => {
    const trpc = createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                methodOverride: 'POST',
                url,
                maxURLLength: 3072,
                headers: async () => {
                    const guardianApproval = guardianApprovalGetter
                        ? await guardianApprovalGetter()
                        : undefined;

                    return {
                        Authorization: `Bearer ${apiToken}`,
                        ...(guardianApproval ? { 'x-guardian-approval': guardianApproval } : {}),
                        ...extraHeaders,
                    };
                },
                transformer: {
                    input: RegExpTransformer,
                    output: { serialize: o => o, deserialize: o => o },
                },
            }),
        ],
    });

    return trpc;
};

export default getClient;
