import type { RevokeBoostRecipientGroupResult } from '@learncard/types';

export type GroupRemovalOutcome = 'complete' | 'partial';

export const getGroupRemovalOutcome = (
    result: RevokeBoostRecipientGroupResult
): GroupRemovalOutcome => (result.failedCredentialUris.length === 0 ? 'complete' : 'partial');

export const isRemovableGroupMemberRole = (role?: string): boolean =>
    role === 'Scout' || role === 'Leader';
