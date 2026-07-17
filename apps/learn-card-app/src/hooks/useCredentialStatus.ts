import { useQuery } from '@tanstack/react-query';
import { useWallet } from 'learn-card-base';
import type { VC, VerificationCheck } from '@learncard/types';

import { deriveLifecycleStatus, CredentialLifecycleStatus } from './deriveLifecycleStatus';

export type { CredentialLifecycleStatus } from './deriveLifecycleStatus';
export { deriveLifecycleStatus } from './deriveLifecycleStatus';

/**
 * Resolve a held credential's lifecycle status (revoked/suspended), cached by URI.
 *
 * Primary source is the authoritative backend status (the CREDENTIAL_SENT/RECEIVED
 * relationship status the issuer view + activity feed use). We prefer it over
 * client-side verifyCredential because the WASM status-list check enforces revocation
 * but does not reliably surface a *set suspension bit*, so a suspended credential would
 * otherwise render as active on the holder's card. Falls back to client verification
 * when the backend can't answer (e.g. self-issued creds with no CREDENTIAL_SENT edge, or
 * the network method being unavailable). Fail-open so an error never renders as revoked.
 */
export const useCredentialStatus = (
    credential: VC | undefined,
    uri: string | undefined,
    enabled = true
): CredentialLifecycleStatus => {
    const { initWallet } = useWallet();

    const { data } = useQuery({
        // Keyed on `uri` only (not the credential object) by design: the URI is the
        // credential's stable status identity, while the `credential` prop can change
        // reference across renders (e.g. display-only `credentialWithEdits` merges) without
        // affecting its revocation/suspension status. Re-verifying on those changes would
        // be wasted work. Lifecycle mutations invalidate ['credentialStatus'] to force a
        // refresh when the status actually changes.
        queryKey: ['credentialStatus', uri],
        enabled: enabled && !!credential && !!uri,
        staleTime: 5 * 60 * 1000,
        queryFn: async (): Promise<CredentialLifecycleStatus> => {
            const wallet = await initWallet();

            // 1) Authoritative backend status (source of truth for revoke/suspend).
            try {
                const getStatuses = (wallet as any)?.invoke?.getMyCredentialLifecycleStatuses as
                    | ((options: {
                          uris: string[];
                      }) => Promise<Record<string, CredentialLifecycleStatus>>)
                    | undefined;
                const statuses = await getStatuses?.({ uris: [uri as string] });
                const backendStatus = statuses?.[uri as string];
                if (
                    backendStatus === 'revoked' ||
                    backendStatus === 'suspended' ||
                    backendStatus === 'active'
                ) {
                    return backendStatus;
                }
            } catch {
                // fall through to client verification
            }

            // 2) Fallback: client-side verification of the credential's status list.
            try {
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
