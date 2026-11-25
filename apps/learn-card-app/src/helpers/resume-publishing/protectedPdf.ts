import {
    ShareEnvelopeValidator,
    ShareLinkIdValidator,
    type ShareEnvelope,
    type VC,
} from '@learncard/types';

export const MAX_RESUME_PDF_BYTES = 4 * 1024 * 1024;
export const RESUME_PDF_CHUNK_BYTES = 256 * 1024;
export const PROTECTED_RESUME_PDF_MARKER = 'LearnCard protected resume PDF v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URN_PREFIX = 'urn:learncard:resume-pdf:';
const SHA256_HEX = /^[a-f0-9]{64}$/;

export type ProtectedPdfErrorCode = 'too-large' | 'invalid-pdf' | 'integrity';
/** Static errors deliberately omit attachment metadata and capabilities. */
export class ProtectedPdfError extends Error {
    constructor(public readonly code: ProtectedPdfErrorCode) {
        super('Unable to prepare the resume PDF');
        this.name = 'ProtectedPdfError';
    }
}
export interface ProtectedResumePdf {
    shareId: string;
    contentVersion: number;
    attachmentId: string;
    chunkCount: number;
    byteLength: number;
    key: string;
    hash: string;
}
export interface ProtectedResumeChunkRequest {
    id: string;
    contentVersion: number;
    attachmentId: string;
    chunkIndex: number;
    accessToken?: string;
}
export type ProtectedResumeChunkReader = (
    request: ProtectedResumeChunkRequest
) => Promise<ProtectedResumeChunkRequest & { envelope: ShareEnvelope }>;
export interface PreparedProtectedPdf {
    attachment: { id: string; chunkCount: number };
    descriptor: Record<string, unknown>;
    chunks: ShareEnvelope[];
}
const invalid = (): never => {
    throw new ProtectedPdfError('invalid-pdf');
};
const validatePdf = (bytes: Uint8Array): void => {
    if (bytes.length > MAX_RESUME_PDF_BYTES) throw new ProtectedPdfError('too-large');
    if (
        bytes.length < 8 ||
        String.fromCharCode(...bytes.subarray(0, 8)).match(/^%PDF-[12]\.\d$/) === null
    )
        invalid();
};
const encode = (bytes: Uint8Array): string => {
    const pieces: string[] = [];
    for (let i = 0; i < bytes.length; i += 8192)
        pieces.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
    return btoa(pieces.join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const decode = (input: string): Uint8Array => {
    if (!/^[A-Za-z0-9_-]+$/.test(input) || input.length % 4 === 1) invalid();
    try {
        const bytes = Uint8Array.from(
            atob(
                input.replace(/-/g, '+').replace(/_/g, '/') +
                    '='.repeat((4 - (input.length % 4)) % 4)
            ),
            c => c.charCodeAt(0)
        );
        if (encode(bytes) !== input) invalid();
        return bytes;
    } catch {
        return invalid();
    }
};
const checkHash = async (bytes: Uint8Array, hash: string): Promise<void> => {
    if (!SHA256_HEX.test(hash)) throw new ProtectedPdfError('integrity');
    const actual = Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer)),
        value => value.toString(16).padStart(2, '0')
    ).join('');
    if (actual !== hash) throw new ProtectedPdfError('integrity');
};
const aad = (
    pdf: Pick<
        ProtectedResumePdf,
        'shareId' | 'contentVersion' | 'attachmentId' | 'chunkCount' | 'byteLength'
    >,
    index: number
): Uint8Array<ArrayBuffer> =>
    new TextEncoder().encode(
        JSON.stringify([
            'LearnCard.resume-pdf.v1',
            pdf.shareId,
            pdf.contentVersion,
            pdf.attachmentId,
            index,
            pdf.chunkCount,
            pdf.byteLength,
        ])
    );

/** Encrypt exact PDF bytes in bounded chunks; the key stays inside the signed encrypted LER. */
export const prepareProtectedPdf = async (
    blob: Blob,
    hash: string,
    binding: { shareId: string; contentVersion: number; attachmentId?: string }
): Promise<PreparedProtectedPdf> => {
    if (blob.size > MAX_RESUME_PDF_BYTES) throw new ProtectedPdfError('too-large');
    if (
        blob.type !== 'application/pdf' ||
        !ShareLinkIdValidator.safeParse(binding.shareId).success ||
        !Number.isSafeInteger(binding.contentVersion) ||
        binding.contentVersion < 1
    )
        invalid();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    validatePdf(bytes);
    await checkHash(bytes, hash);
    const pdf: ProtectedResumePdf = {
        ...binding,
        attachmentId: binding.attachmentId ?? crypto.randomUUID(),
        chunkCount: Math.ceil(bytes.length / RESUME_PDF_CHUNK_BYTES),
        byteLength: bytes.length,
        key: encode(crypto.getRandomValues(new Uint8Array(32))),
        hash,
    };
    if (!UUID.test(pdf.attachmentId)) invalid();
    const key = await crypto.subtle.importKey(
        'raw',
        new Uint8Array(decode(pdf.key)).buffer,
        'AES-GCM',
        false,
        ['encrypt']
    );
    const chunks: ShareEnvelope[] = [];
    for (let index = 0; index < pdf.chunkCount; index++) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv, additionalData: aad(pdf, index) },
            key,
            bytes.slice(index * RESUME_PDF_CHUNK_BYTES, (index + 1) * RESUME_PDF_CHUNK_BYTES)
        );
        chunks.push(
            ShareEnvelopeValidator.parse({
                v: 1,
                alg: 'A256GCM',
                iv: encode(iv),
                ct: encode(new Uint8Array(ct)),
            })
        );
    }
    const { attachmentId, hash: digest, ...metadata } = pdf;
    return {
        attachment: { id: attachmentId, chunkCount: pdf.chunkCount },
        chunks,
        descriptor: {
            url: `${URN_PREFIX}${attachmentId}`,
            mediaType: 'application/pdf',
            descriptions: [PROTECTED_RESUME_PDF_MARKER, `SHA-256: ${digest}`],
            ...metadata,
        },
    };
};
const record = (value: unknown): Record<string, unknown> | undefined =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;
const marked = (attachment: unknown): boolean => {
    const descriptions = record(attachment)?.descriptions;
    return Array.isArray(descriptions) && descriptions.includes(PROTECTED_RESUME_PDF_MARKER);
};
const protectedAttachments = (vc: VC): unknown[] => {
    const subjects = Array.isArray(vc.credentialSubject)
        ? vc.credentialSubject
        : [vc.credentialSubject];
    return subjects.flatMap(subject => {
        const attachments = record(subject)?.attachments;
        return Array.isArray(attachments) ? attachments.filter(marked) : [];
    });
};
/** Malformed marked credentials must never fall back to an external-URL handler. */
export const hasProtectedResumePdf = (vc: VC): boolean => protectedAttachments(vc).length > 0;
export const getProtectedResumePdf = (vc: VC): ProtectedResumePdf | undefined => {
    const matches = protectedAttachments(vc);
    if (matches.length !== 1) return undefined;
    const attachment = record(matches[0]);
    if (
        !attachment ||
        typeof attachment.url !== 'string' ||
        !attachment.url.startsWith(URN_PREFIX) ||
        attachment.mediaType !== 'application/pdf'
    )
        return undefined;
    const attachmentId = attachment.url.slice(URN_PREFIX.length);
    const { shareId, contentVersion, chunkCount, byteLength, key } = attachment;
    const hashes = (attachment.descriptions as unknown[]).filter(
        d => typeof d === 'string' && d.startsWith('SHA-256:')
    );
    if (
        hashes.length !== 1 ||
        typeof hashes[0] !== 'string' ||
        !/^SHA-256: [a-f0-9]{64}$/.test(hashes[0])
    )
        return undefined;
    if (
        !UUID.test(attachmentId) ||
        typeof shareId !== 'string' ||
        !ShareLinkIdValidator.safeParse(shareId).success ||
        typeof contentVersion !== 'number' ||
        !Number.isSafeInteger(contentVersion) ||
        contentVersion < 1 ||
        typeof byteLength !== 'number' ||
        !Number.isSafeInteger(byteLength) ||
        byteLength < 8 ||
        byteLength > MAX_RESUME_PDF_BYTES ||
        typeof chunkCount !== 'number' ||
        chunkCount !== Math.ceil(byteLength / RESUME_PDF_CHUNK_BYTES) ||
        typeof key !== 'string' ||
        key.length !== 43
    )
        return undefined;
    try {
        if (decode(key).length !== 32) return undefined;
    } catch {
        return undefined;
    }
    return {
        shareId,
        contentVersion,
        attachmentId,
        chunkCount,
        byteLength,
        key,
        hash: hashes[0].slice(9),
    };
};
/** Only the managed gateway can resolve a chunk; no URL fetch or provider fallback. */
export const loadProtectedResumePdf = async (
    vc: VC,
    fetchChunk: ProtectedResumeChunkReader
): Promise<Blob> => {
    const pdf = getProtectedResumePdf(vc);
    if (!pdf) return invalid();
    const key = await crypto.subtle.importKey(
        'raw',
        new Uint8Array(decode(pdf.key)).buffer,
        'AES-GCM',
        false,
        ['decrypt']
    );
    const bytes = new Uint8Array(pdf.byteLength);
    let accessToken: string | undefined;
    for (let index = 0; index < pdf.chunkCount; index++) {
        const request = {
            id: pdf.shareId,
            contentVersion: pdf.contentVersion,
            attachmentId: pdf.attachmentId,
            chunkIndex: index,
            ...(accessToken ? { accessToken } : {}),
        };
        const response = await fetchChunk(request);
        if (typeof response.accessToken === 'string') accessToken = response.accessToken;
        if (
            response.id !== request.id ||
            response.contentVersion !== request.contentVersion ||
            response.attachmentId !== request.attachmentId ||
            response.chunkIndex !== index
        )
            invalid();
        const parsed = ShareEnvelopeValidator.safeParse(response.envelope);
        if (!parsed.success) return invalid();
        const envelope = parsed.data;
        const expectedBytes = Math.min(
            RESUME_PDF_CHUNK_BYTES,
            pdf.byteLength - index * RESUME_PDF_CHUNK_BYTES
        );
        const ciphertext = decode(envelope.ct);
        if (ciphertext.length !== expectedBytes + 16) invalid();
        try {
            const chunk = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: new Uint8Array(decode(envelope.iv)).buffer,
                    additionalData: aad(pdf, index),
                },
                key,
                new Uint8Array(ciphertext).buffer
            );
            bytes.set(new Uint8Array(chunk), index * RESUME_PDF_CHUNK_BYTES);
        } catch {
            throw new ProtectedPdfError('integrity');
        }
    }
    validatePdf(bytes);
    await checkHash(bytes, pdf.hash);
    return new Blob([bytes.buffer], { type: 'application/pdf' });
};
/** Reauthorize after retrieval, immediately before handing local bytes to the browser. */
export const downloadProtectedResumePdf = async (
    vc: VC,
    title: string,
    canDownload: (() => Promise<boolean>) | undefined,
    fetchChunk: ProtectedResumeChunkReader
): Promise<void> => {
    const blob = await loadProtectedResumePdf(vc, fetchChunk);
    if (canDownload && !(await canDownload())) invalid();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    let handedToBrowser = false;
    try {
        const safeTitle = Array.from(title)
            .filter(c => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127 && !/[/\\:<>"|?*]/.test(c))
            .join('')
            .trim()
            .replace(/^\.+/, '');
        anchor.download = `${(safeTitle.replace(/\.pdf$/i, '') || 'resume').slice(0, 120)}.pdf`;
        anchor.href = url;
        document.body.appendChild(anchor);
        anchor.click();
        handedToBrowser = true;
    } finally {
        anchor.remove();
        // Let the browser consume the download before releasing its backing bytes.
        if (handedToBrowser) setTimeout(() => URL.revokeObjectURL(url), 30_000);
        else URL.revokeObjectURL(url);
    }
};
