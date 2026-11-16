import type { VC } from '@learncard/types';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import type { LCR } from 'learn-card-base/types/credential-records';
import type { CredentialCategory } from 'learn-card-base/types/credentials';

/**
 * The wallet category a received transcript is shown under, so its card and viewer match the
 * Passport: the stored index category first, then the same default the Passport derives.
 */
export const getTranscriptCategory = (
    vc: VC,
    record?: Pick<LCR, 'category'> | null
): CredentialCategory =>
    record?.category || getDefaultCategoryForCredential(vc) || 'Learning History';
