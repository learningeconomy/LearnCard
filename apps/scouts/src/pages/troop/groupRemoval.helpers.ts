import type { RevokeBoostRecipientGroupResult } from '@learncard/types';

export const hasGroupRemovalFailures = (result: RevokeBoostRecipientGroupResult): boolean =>
    result.failedCredentialUris.length > 0;

export const isRemovableGroupMemberRole = (role?: string): boolean =>
    role === 'Scout' || role === 'Leader';
