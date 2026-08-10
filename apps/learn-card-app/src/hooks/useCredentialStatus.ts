import type { VC } from '@learncard/types';
import {
    useCredentialStatus as useSharedCredentialStatus,
    type CredentialLifecycleStatus,
} from 'learn-card-base';

export type { CredentialLifecycleStatus } from 'learn-card-base';
export { deriveLifecycleStatus } from 'learn-card-base';

export const useCredentialStatus = (
    credential: VC | undefined,
    uri: string | undefined,
    enabled = true
): CredentialLifecycleStatus => useSharedCredentialStatus({ credential, uri, enabled }).status;
