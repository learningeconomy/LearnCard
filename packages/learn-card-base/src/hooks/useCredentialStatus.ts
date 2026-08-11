import { useQuery } from '@tanstack/react-query';
import type { VC, VerificationCheck } from '@learncard/types';
import { useWallet } from './useWallet';
import { deriveLifecycleStatus, type CredentialLifecycleStatus } from './deriveLifecycleStatus';
import type { CredentialStatusResult, UseCredentialStatusOptions } from './credentialStatus.types';

export type { CredentialStatusResult, UseCredentialStatusOptions } from './credentialStatus.types';

interface CredentialStatusQueryResult {
    status: CredentialLifecycleStatus;
    isError: boolean;
}

export const useCredentialStatus = ({
    uri,
    credential,
    enabled = true,
}: UseCredentialStatusOptions): CredentialStatusResult => {
    const { initWallet } = useWallet();
    const shouldQuery = enabled && Boolean(uri);

    const query = useQuery({
        queryKey: ['credentialStatus', uri],
        enabled: shouldQuery,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: 'always',
        queryFn: async (): Promise<CredentialStatusQueryResult> => {
            const wallet = await initWallet();

            try {
                const statuses = await wallet?.invoke?.getMyCredentialLifecycleStatuses?.({
                    uris: [uri as string],
                });
                const status = statuses?.[uri as string];
                if (status === 'active' || status === 'revoked' || status === 'suspended') {
                    return { status, isError: false };
                }
            } catch {
                // The verification fallback below remains authoritative for Bitstring entries.
            }

            try {
                const resolved = credential ?? ((await wallet?.read?.get?.(uri as string)) as VC);
                if (!resolved || !wallet?.invoke?.verifyCredential) {
                    return { status: 'active', isError: true };
                }
                const verify = wallet.invoke.verifyCredential as unknown as (
                    candidate: VC,
                    options: Record<string, unknown>,
                    prettify: boolean
                ) => Promise<VerificationCheck>;
                const check = await verify(resolved, {}, false);
                if (check.errors?.length) {
                    return { status: 'active', isError: true };
                }
                return { status: deriveLifecycleStatus(check), isError: false };
            } catch {
                return { status: 'active', isError: true };
            }
        },
    });

    if (!shouldQuery) return { status: 'active', isLoading: false, isError: false };

    return {
        status: query.data?.status ?? 'active',
        isLoading: query.isLoading,
        isError: query.data?.isError ?? query.isError,
    };
};
