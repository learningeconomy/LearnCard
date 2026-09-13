import type { VC } from '@learncard/types';

import type { CredentialLifecycleStatus } from './deriveLifecycleStatus';

export interface UseCredentialStatusOptions {
    uri?: string;
    credential?: VC;
    enabled?: boolean;
}

export interface CredentialStatusResult {
    status: CredentialLifecycleStatus;
    isLoading: boolean;
    isError: boolean;
}
