import type { StreamingOptions } from './providers';

const TOKEN_PREFIXES = [
    '{{ADDRESS_',
    '{{CREDENTIAL_',
    '{{DATE_OF_BIRTH_',
    '{{DID_',
    '{{EMAIL_',
    '{{NAME_',
    '{{PHONE_',
];

const isIncompleteToken = (suffix: string): boolean =>
    TOKEN_PREFIXES.some(prefix => {
        if (prefix.startsWith(suffix)) return true;
        if (!suffix.startsWith(prefix)) return false;
        const identifier = suffix.slice(prefix.length);
        return /^[a-f0-9]{0,32}$/.test(identifier) || /^[a-f0-9]{32}\}$/.test(identifier);
    });

/** Buffer only a possible identifier suffix; ordinary text continues streaming. */
export const createRestoredTextStream = (
    restore: (text: string) => Promise<string>,
    { onChunk, accumulateContent = true, signal }: StreamingOptions
) => {
    let pending = '';
    let accumulated = '';

    const push = async (chunk: string): Promise<void> => {
        signal?.throwIfAborted();
        const text = pending + chunk;
        let boundary = text.length;
        const opening = text.lastIndexOf('{{');
        if (opening !== -1 && isIncompleteToken(text.slice(opening))) boundary = opening;
        else if (text.endsWith('{')) boundary -= 1;
        pending = text.slice(boundary);
        if (boundary === 0) return;

        const restored = await restore(text.slice(0, boundary));
        signal?.throwIfAborted();
        // Provider loops await this callback: mapping lookups and consumers cannot
        // race later chunks, and raw provider envelopes never cross this boundary.
        await onChunk?.(restored);
        if (accumulateContent) accumulated += restored;
    };

    return {
        push,
        finish: (): string => {
            signal?.throwIfAborted();
            // A truncated identifier must not be flushed to an authenticated client.
            if (pending) throw new Error('Incomplete provider identifier token');
            return accumulated;
        },
    };
};

/** Partial JSON may synthesize closing quotes; never expose those open strings. */
export const createJsonStringTracker = () => {
    let inString = false;
    let escaped = false;
    return (delta: string): boolean => {
        for (const character of delta) {
            if (escaped) escaped = false;
            else if (inString && character === '\\') escaped = true;
            else if (character === '"') inString = !inString;
        }
        return inString;
    };
};
