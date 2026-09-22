import type { AuthUser } from '@learncard/types';
import type { RecoverySetupType } from '../components/recovery/RecoverySetupModal';

export type ReauthAction = 'account-recovery' | 'recovery-setup';
export interface PendingKeycloakReauth {
    id: string;
    userId: string;
    returnTo: string;
    action: ReauthAction;
    createdAt: number;
    initialMethod?: RecoverySetupType;
}

const STORAGE_KEY = 'learncard:keycloak:reauth';
const MAX_AGE = 10 * 60 * 1000;

export const clearKeycloakReauth = (): void => sessionStorage.removeItem(STORAGE_KEY);

/** Persist navigation intent only. Codes, tickets, tokens and key material never go here. */
export const beginKeycloakReauth = (
    userId: string,
    action: ReauthAction,
    returnTo = getReauthReturnTo(),
    initialMethod?: RecoverySetupType
): PendingKeycloakReauth => {
    if (!userId) throw new Error('Please sign in again.');
    const intent: PendingKeycloakReauth = {
        id: crypto.randomUUID(),
        userId,
        action,
        returnTo,
        createdAt: Date.now(),
        ...(initialMethod ? { initialMethod } : {}),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
    return intent;
};

/** Preserve UI navigation only, never credential-bearing query parameters or fragments. */
export const getReauthReturnTo = (): string => {
    const url = new URL(window.location.href);
    for (const key of [...url.searchParams.keys()]) {
        if (!['tab', 'step', 'view'].includes(key)) url.searchParams.delete(key);
    }
    const hash = /^#[a-zA-Z0-9_-]{1,64}$/.test(url.hash) ? url.hash : '';
    return url.pathname + url.search + hash;
};

export const readKeycloakReauth = (): PendingKeycloakReauth | null => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        const value: unknown = JSON.parse(raw);
        if (
            typeof value === 'object' &&
            value !== null &&
            'id' in value &&
            typeof value.id === 'string' &&
            'userId' in value &&
            typeof value.userId === 'string' &&
            value.userId &&
            'returnTo' in value &&
            typeof value.returnTo === 'string' &&
            value.returnTo.startsWith('/') &&
            !value.returnTo.startsWith('//') &&
            !value.returnTo.includes('\\') &&
            'action' in value &&
            (value.action === 'account-recovery' || value.action === 'recovery-setup') &&
            (!('initialMethod' in value) ||
                (typeof value.initialMethod === 'string' &&
                    ['passkey', 'phrase', 'backup', 'email'].includes(value.initialMethod))) &&
            'createdAt' in value &&
            typeof value.createdAt === 'number' &&
            Date.now() >= value.createdAt &&
            Date.now() - value.createdAt < MAX_AGE
        )
            return value as PendingKeycloakReauth;
    } catch {
        // Malformed or expired intent must never resume an action.
        clearKeycloakReauth();
        return null;
    }
    clearKeycloakReauth();
    return null;
};

/** Called only after the OIDC SDK has validated state, PKCE and the ID token. */
export const validateKeycloakReauth = (user: AuthUser, state: unknown): void => {
    const intent = readKeycloakReauth();
    const stateId =
        typeof state === 'object' && state !== null && 'reauthId' in state
            ? state.reauthId
            : undefined;
    if (!intent && !stateId) return;
    if (!intent || stateId !== intent.id || user.id !== intent.userId) {
        throw new Error('We could not verify this account. Please try again.');
    }
};

/** Recheck after asynchronous work: account switches and expiry cancel the continuation. */
export const assertCurrentKeycloakReauth = (
    intent: PendingKeycloakReauth,
    userId?: string
): void => {
    if (readKeycloakReauth()?.id !== intent.id || userId !== intent.userId) {
        throw new Error('Verification expired. Please try again.');
    }
};
