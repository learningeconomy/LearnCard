import { getUriParts } from './uri.helpers';

const network =
    /^lc:network:[a-zA-Z0-9.-]+(?::[0-9]+|%3[aA][0-9]+)?(?:\/[a-zA-Z0-9._~-]+)*\/trpc:credential:[a-zA-Z0-9_-]{1,128}$/;
const cloud = /^lc:cloud:[a-zA-Z0-9.-]+(?::[0-9]+|%3[aA][0-9]+)?:credential:[a-zA-Z0-9_-]{1,128}$/;

/** Validate storage references, not ownership; the decrypted subject is checked separately. */
export const isReferralOutcomeUri = (uri: string): boolean => {
    if (uri.length > 2048 || /\s/.test(uri)) return false;
    if (!network.test(uri) && !cloud.test(uri)) return false;
    try {
        const parts = getUriParts(uri, true);
        return (
            ['network', 'cloud'].includes(parts.method) &&
            parts.type === 'credential' &&
            /^[a-zA-Z0-9_-]{1,128}$/.test(parts.id)
        );
    } catch {
        return false;
    }
};
