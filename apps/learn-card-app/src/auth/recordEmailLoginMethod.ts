import { LAST_LOGIN_METHOD_KEY } from '../analytics/storageKeys';

/** Persist only a UI/analytics marker, never an email address, code, or ticket. */
export const recordEmailLoginMethod = (): void => {
    localStorage.setItem(LAST_LOGIN_METHOD_KEY, 'email');
};
