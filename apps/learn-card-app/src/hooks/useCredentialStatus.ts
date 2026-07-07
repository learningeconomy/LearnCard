import { useQuery } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import type { VC, VerificationCheck } from '@learncard/types';

import { deriveLifecycleStatus, CredentialLifecycleStatus } from './deriveLifecycleStatus';

export type { CredentialLifecycleStatus } from './deriveLifecycleStatus';
export { deriveLifecycleStatus } from './deriveLifecycleStatus';

/**
 * Lazily verify a held credential's status (revoked/suspended), cached by URI.
 * Runs when the card mounts; fail-open so a check error never renders as revoked.
 */
export const useCredentialStatus = (
    credential: VC | undefined,
    uri: string | undefined,
    enabled = true
): CredentialLifecycleStatus => {
    const { initWallet } = useWallet();

    const { data } = useQuery({
        queryKey: ['credentialStatus', uri],
        enabled: enabled && !!credential && !!uri,
        staleTime: 5 * 60 * 1000,
        queryFn: async (): Promise<CredentialLifecycleStatus> => {
            try {
                const wallet = await initWallet();
                // prettify=false returns the raw VerificationCheck (with structured
                // `status` entries). The exposed invoke type narrows the 3rd arg to
                // `true`, so cast to reach the raw-result overload.
                const verify = wallet?.invoke?.verifyCredential as
                    | ((
                          c: VC,
                          options: Record<string, unknown>,
                          prettify: boolean
                      ) => Promise<VerificationCheck>)
                    | undefined;
                const check = await verify?.(credential as VC, {}, false);
                return deriveLifecycleStatus(check);
            } catch {
                return 'active'; // fail-open
            }
        },
    });

    return data ?? 'active';
};
