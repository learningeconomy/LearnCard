import { isEmailRecipient } from '../../../components/simple-send/simpleSend.helpers';

/**
 * UI-only gating for the "Someone else" flow. Governs the Issue button and the
 * inline hint; it never alters the value passed to `issueAndSendCredential`.
 */
export const isPlausibleRecipient = (raw: string): boolean => {
    const value = raw.trim();
    if (value.length < 2) return false;
    if (isEmailRecipient(value)) return true;
    if (value.startsWith('did:')) return true;
    const username = value.startsWith('@') ? value.slice(1) : value;
    return /^[a-zA-Z0-9_.-]{2,}$/.test(username);
};
