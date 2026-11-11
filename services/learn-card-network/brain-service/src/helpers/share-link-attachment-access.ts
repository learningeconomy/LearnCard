import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { getShareLinkRequestHashSecret } from './share-link-lifecycle';
import type { ShareLinkRecord } from '../models/ShareLink';

const TTL_MS = 60 * 1000;
const sign = (text: string): string =>
    createHmac('sha256', getShareLinkRequestHashSecret()).update(text).digest('base64url');
const binding = (record: ShareLinkRecord, namespace: string, sourceIp?: string): string =>
    sign(
        JSON.stringify([
            'attachment-access-v1',
            namespace,
            record.ownerProfileId,
            record.id,
            record.contentVersion,
            record.attachmentId,
            record.attachmentChunkCount,
            record.passcodeHash ?? null,
            sourceIp ?? null,
        ])
    );

/** Opaque keyed binding never exposes the password verifier or internal owner/namespace. */
export const mintShareAttachmentAccessToken = (
    record: ShareLinkRecord,
    namespace: string,
    sourceIp: string | undefined,
    now: Date
): string => {
    const body = Buffer.from(
        JSON.stringify({
            v: 1,
            expiresAt: now.getTime() + TTL_MS,
            nonce: randomUUID(),
            binding: binding(record, namespace, sourceIp),
        })
    ).toString('base64url');
    return `${body}.${sign(`attachment-grant-v1:${body}`)}`;
};

/** A grant only amortizes a successful password check; active/current authorization remains mandatory. */
export const verifyShareAttachmentAccessToken = (
    token: string,
    record: ShareLinkRecord,
    namespace: string,
    sourceIp: string | undefined,
    now: Date
): boolean => {
    try {
        const parts = token.split('.');
        const bodyPart = parts[0];
        const signature = parts[1];
        if (
            parts.length !== 2 ||
            !bodyPart ||
            !signature ||
            signature.length !== 43 ||
            token.length > 2048
        )
            return false;
        const bytes = Buffer.from(bodyPart, 'base64url');
        if (bytes.toString('base64url') !== bodyPart) return false;
        const actual = Buffer.from(signature, 'base64url');
        const expected = Buffer.from(sign(`attachment-grant-v1:${bodyPart}`), 'base64url');
        if (
            actual.length !== expected.length ||
            actual.toString('base64url') !== signature ||
            !timingSafeEqual(actual, expected)
        )
            return false;
        const body: unknown = JSON.parse(bytes.toString('utf8'));
        if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
        const value = body as Record<string, unknown>;
        if (
            value.v !== 1 ||
            typeof value.expiresAt !== 'number' ||
            !Number.isSafeInteger(value.expiresAt) ||
            value.expiresAt <= now.getTime() ||
            value.expiresAt > now.getTime() + TTL_MS ||
            value.binding !== binding(record, namespace, sourceIp)
        )
            return false;
        return true;
    } catch {
        return false;
    }
};
