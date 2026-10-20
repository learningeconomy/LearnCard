import { TRPCError } from '@trpc/server';

const normalizeName = (name: string): string => name.replace(/[^a-z0-9]/gi, '').toLowerCase();

/** Config is non-secret data. Credential material has no input channel in this increment;
 * use package secretRefs provisioning declarations instead. Also checks mixed-bundle siblings
 * before their config can enter a workload approval hash. */
export const assertNoInlineWorkloadSecrets = (
    config: unknown,
    logicalSecretNames: string[] = []
): void => {
    const reserved = new Set([
        'secrets',
        'secretvalues',
        'secretrefs',
        'password',
        'token',
        'accesstoken',
        'refreshtoken',
        'apikey',
        'apitoken',
        'clientsecret',
        'privatekey',
        'seed',
        ...logicalSecretNames.map(normalizeName),
    ]);
    const pending: unknown[] = [config];
    while (pending.length) {
        const value = pending.pop();
        if (!value || typeof value !== 'object') continue;
        for (const [key, child] of Object.entries(value)) {
            if (reserved.has(normalizeName(key))) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message:
                        'Inline secret configuration is not supported; use logical package secret declarations.',
                });
            }
            pending.push(child);
        }
    }
};
