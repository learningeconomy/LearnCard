import type { VC } from '@learncard/types';
import { useCredentialStatus as useSharedCredentialStatus } from 'learn-card-base/hooks/useCredentialStatus';
import type { CredentialLifecycleStatus } from 'learn-card-base/hooks/deriveLifecycleStatus';

export type { CredentialLifecycleStatus } from 'learn-card-base/hooks/deriveLifecycleStatus';
export { deriveLifecycleStatus } from 'learn-card-base/hooks/deriveLifecycleStatus';

export const useCredentialStatus = (
    credential: VC | undefined,
    uri: string | undefined,
    enabled = true
): CredentialLifecycleStatus => useSharedCredentialStatus({ credential, uri, enabled }).status;
