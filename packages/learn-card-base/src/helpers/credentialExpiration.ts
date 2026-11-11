import type { UnsignedVC, VC } from '@learncard/types';

/** Read the expiration boundary from either credential version, including boost wrappers. */
export const getCredentialExpirationDate = (credential?: VC | UnsignedVC): string | undefined => {
    const inner = credential?.boostCredential ?? credential;
    const value = inner?.expirationDate ?? inner?.validUntil;
    const date = typeof value === 'string' ? value : value?.value;
    return typeof date === 'string' && Number.isFinite(Date.parse(date)) ? date : undefined;
};

export const hasCredentialExpired = (credential?: VC | UnsignedVC, now = Date.now()): boolean => {
    const date = getCredentialExpirationDate(credential);
    return date !== undefined && Date.parse(date) <= now;
};
