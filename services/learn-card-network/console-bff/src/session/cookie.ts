import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE_NAME = 'eos_console_session';

function computeSignature(sessionId: string, secret: string): string {
    return createHmac('sha256', secret).update(sessionId).digest('base64url');
}

export function signSessionCookie(sessionId: string, secret: string): string {
    return `${sessionId}.${computeSignature(sessionId, secret)}`;
}

export function readSessionCookie(value: string | undefined, secret: string): string | null {
    if (!value) return null;

    const separator = value.lastIndexOf('.');

    if (separator <= 0) return null;

    const sessionId = value.slice(0, separator);
    const signature = value.slice(separator + 1);
    const expected = computeSignature(sessionId, secret);

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (signatureBuffer.length !== expectedBuffer.length) return null;

    return timingSafeEqual(signatureBuffer, expectedBuffer) ? sessionId : null;
}
