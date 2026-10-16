import { VCValidator } from '@learncard/types';
import { z } from 'zod';
import type { ConsumerWallet } from './consumer-apps';
import { categoryForClaim } from './claims';
import { validateCollectionCursor } from './collection-pagination';
import { extractCredentialsFromText } from '../../../apps/learn-card-app/src/hooks/extractCredentialsFromText';

export const documentKinds = ['resume', 'certificate', 'transcript', 'diploma'] as const;
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
export const MAX_CREDENTIAL_BYTES = 1024 * 1024;
const fileInput = z
    .object({
        kind: z.enum([...documentKinds, 'rawVC']),
        name: z
            .string()
            .min(1)
            .max(180)
            .refine(
                v =>
                    ![...v].some(char => char.codePointAt(0)! < 32 || char === '/' || char === '\\')
            ),
        base64: z
            .string()
            .min(4)
            .max(Math.ceil(MAX_DOCUMENT_BYTES / 3) * 4),
    })
    .strict();
type Kind = z.infer<typeof fileInput>['kind'];
type RecordValue = Record<string, unknown>;
export class IntakeFailure extends Error {
    constructor(
        readonly kind:
            'signIn' | 'file' | 'size' | 'empty' | 'changed' | 'connection' | 'busy' | 'unavailable'
    ) {
        super(`intake:${kind}`);
    }
}
export const intakeErrorCode = (error: unknown) =>
    error instanceof IntakeFailure ? error.message : 'intake:connection';
const object = (v: unknown): RecordValue =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as RecordValue) : {};
const text = (v: unknown) => (typeof v === 'string' ? v : '');
const fileSize = (size: number) =>
    size < 1024
        ? `${size} B`
        : size < 1024 * 1024
          ? `${(size / 1024).toFixed(1)} KB`
          : `${(size / (1024 * 1024)).toFixed(1)} MB`;
const canonical = (v: unknown): string =>
    JSON.stringify(
        v && typeof v === 'object'
            ? Array.isArray(v)
                ? v.map(item => JSON.parse(canonical(item)))
                : Object.fromEntries(
                      Object.keys(v)
                          .sort()
                          .map(key => [key, JSON.parse(canonical((v as RecordValue)[key]))])
                  )
            : v
    );
const digest = async (v: string) =>
    [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)))]
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
const checkDepth = (value: string) => {
    let depth = 0,
        quoted = false,
        escaped = false;
    for (const char of value) {
        if (escaped) {
            escaped = false;
            continue;
        }
        if (quoted && char === '\\') {
            escaped = true;
            continue;
        }
        if (char === '"') {
            quoted = !quoted;
            continue;
        }
        if (quoted) continue;
        if (char === '{' || char === '[') {
            if (++depth > 64) throw new IntakeFailure('file');
        } else if (char === '}' || char === ']') {
            if (--depth < 0) throw new IntakeFailure('file');
        }
    }
};

/** File payloads remain in this account's host until explicit confirmation or disposal. */
export const createIntakeCommands = (currentWallet: () => ConsumerWallet | undefined) => {
    type Candidate = {
        id: string;
        raw: RecordValue;
        title: string;
        issuer: string;
        category: string;
        signature: string;
        eligible: boolean;
    };
    let review:
        | {
              id: string;
              wallet: ConsumerWallet;
              kind: Kind;
              name: string;
              data: string;
              mime: string;
              size: number;
              fingerprint: string;
              candidates: Candidate[];
              replacesResume: boolean;
          }
        | undefined;
    let busy = false;
    const wallet = () => {
        const value = currentWallet();
        if (!value) throw new IntakeFailure('signIn');
        return value;
    };
    const check = (value: ConsumerWallet) => {
        if (currentWallet() !== value) throw new IntakeFailure('signIn');
    };
    const records = async (lc: ConsumerWallet, query: RecordValue) => {
        if (!lc.index.LearnCloud.getPage) throw new IntakeFailure('unavailable');
        const result: RecordValue[] = [],
            seen = new Set<string>(),
            identifiers = new Set<string>();
        let cursor: string | undefined;
        for (let pageNumber = 0; pageNumber < 100; pageNumber++) {
            const page = await lc.index.LearnCloud.getPage(query, {
                limit: 100,
                cursor,
                sort: 'newestFirst',
            });
            check(lc);
            validateCollectionCursor(page.hasMore, page.cursor, seen);
            for (const record of page.records) {
                if (!identifiers.has(record.id)) {
                    identifiers.add(record.id);
                    result.push(record as RecordValue);
                }
            }
            if (!page.hasMore) return result;
            cursor = page.cursor;
            seen.add(cursor!);
        }
        throw new IntakeFailure('unavailable');
    };
    const oneAtATime = async <T>(action: () => Promise<T>): Promise<T> => {
        if (busy) throw new IntakeFailure('busy');
        busy = true;
        try {
            return await action();
        } finally {
            busy = false;
        }
    };
    return {
        intakeStatus: async () => {
            const lc = wallet();
            const counts: Record<string, number> = {};
            const documents: RecordValue[] = [];
            for (const kind of documentKinds) {
                const items = await records(lc, { category: kind });
                counts[kind] = items.length;
                for (const item of items.slice(0, 20))
                    documents.push({
                        id: text(item.id),
                        uri: text(item.uri),
                        kind,
                        name: text(item.fileName),
                        size: text(item.fileSize),
                    });
            }
            counts.rawVC = (await records(lc, { uploadType: 'rawVC' })).length;
            return { counts, documents, limited: documentKinds.some(kind => counts[kind] > 20) };
        },
        intakePrepare: (input: unknown) =>
            oneAtATime(async () => {
                const lc = wallet();
                review = undefined;
                const value = fileInput.safeParse(input);
                if (!value.success) throw new IntakeFailure('file');
                const { kind, name, base64 } = value.data;
                let bytes: string;
                try {
                    bytes = atob(base64);
                    if (btoa(bytes) !== base64) throw new Error();
                } catch {
                    throw new IntakeFailure('file');
                }
                if (
                    !bytes.length ||
                    bytes.length > (kind === 'rawVC' ? MAX_CREDENTIAL_BYTES : MAX_DOCUMENT_BYTES)
                )
                    throw new IntakeFailure('size');
                const extension = name.split('.').pop()?.toLowerCase();
                const types: Record<string, string> = {
                    pdf: 'application/pdf',
                    txt: 'text/plain',
                    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    png: 'image/png',
                    jpg: 'image/jpeg',
                    jpeg: 'image/jpeg',
                    webp: 'image/webp',
                    json: 'application/json',
                };
                const mime = types[extension ?? ''];
                if (!mime || (kind === 'rawVC' ? extension !== 'json' : extension === 'json'))
                    throw new IntakeFailure('file');
                if (
                    (extension === 'pdf' && !bytes.startsWith('%PDF-')) ||
                    (extension === 'png' && !bytes.startsWith('\x89PNG\r\n\x1a\n')) ||
                    (['jpg', 'jpeg'].includes(extension!) && !bytes.startsWith('\xff\xd8\xff')) ||
                    (extension === 'webp' &&
                        !(bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP')) ||
                    (extension === 'docx' && !bytes.startsWith('PK\x03\x04')) ||
                    (extension === 'txt' && bytes.includes('\x00'))
                )
                    throw new IntakeFailure('file');
                const fingerprint = await digest(kind + ':' + base64);
                check(lc);
                let rejected = 0;
                const candidates: Candidate[] = [];
                if (kind === 'rawVC') {
                    let content: string;
                    try {
                        content = new TextDecoder('utf-8', { fatal: true }).decode(
                            Uint8Array.from(bytes, c => c.charCodeAt(0))
                        );
                    } catch {
                        throw new IntakeFailure('file');
                    }
                    checkDepth(content);
                    let root: unknown;
                    try {
                        root = JSON.parse(content);
                    } catch {
                        throw new IntakeFailure('file');
                    }
                    const rootTypes = object(root).type;
                    // A signed container's own payload must not be replaced by an
                    // unrelated nested verifiableCredential field.
                    const parsed =
                        Array.isArray(rootTypes) && rootTypes.includes('VerifiableCredential')
                            ? [object(root)]
                            : extractCredentialsFromText(content).credentials;
                    if (!parsed.length || parsed.length > 50) throw new IntakeFailure('empty');
                    for (const raw of parsed) {
                        if (
                            !VCValidator.safeParse(raw).success ||
                            categoryForClaim(raw) === 'Family' ||
                            (raw.type as string[]).includes('RawArtifactCredential')
                        ) {
                            rejected++;
                            continue;
                        }
                        const id = '__native_intake_vc_' + (await digest(canonical(raw))) + '__';
                        check(lc);
                        if (candidates.some(item => item.id === id)) continue;
                        let signature = 'unavailable';
                        try {
                            const result = await lc.invoke.verifyCredential(raw, {
                                checks: ['proof'],
                            });
                            signature = result.errors.length ? 'failed' : 'checked';
                        } catch {
                            /* Keep original source; an unavailable check is never a trust claim. */
                        }
                        check(lc);
                        const subject = object(
                                Array.isArray(raw.credentialSubject)
                                    ? raw.credentialSubject[0]
                                    : raw.credentialSubject
                            ),
                            achievement = object(subject.achievement);
                        const issuer = object(raw.issuer);
                        candidates.push({
                            id,
                            raw,
                            title: (text(raw.name) || text(achievement.name) || name).slice(0, 300),
                            issuer: (
                                text(issuer.name) ||
                                text(raw.issuer) ||
                                text(issuer.id)
                            ).slice(0, 400),
                            category: categoryForClaim(raw),
                            signature,
                            eligible: signature !== 'failed',
                        });
                    }
                    if (!candidates.length) throw new IntakeFailure('empty');
                }
                const replacesResume =
                    kind === 'resume' && (await records(lc, { category: 'resume' })).length > 0;
                review = {
                    id: crypto.randomUUID(),
                    wallet: lc,
                    kind,
                    name,
                    data: base64,
                    mime,
                    size: bytes.length,
                    fingerprint,
                    candidates,
                    replacesResume,
                };
                return {
                    id: review.id,
                    kind,
                    name,
                    size: bytes.length,
                    replacesResume,
                    rejected,
                    candidates: candidates.map(({ raw: _, ...item }) => item),
                };
            }),
        intakeCommit: (input: unknown) =>
            oneAtATime(async () => {
                const lc = wallet();
                const value = z
                    .object({
                        id: z.string().uuid(),
                        selected: z.array(z.string().max(100)).max(50),
                    })
                    .strict()
                    .safeParse(input);
                if (
                    !value.success ||
                    !review ||
                    review.wallet !== lc ||
                    value.data.id !== review.id
                )
                    throw new IntakeFailure('changed');
                const pending = review;
                const selected = [...new Set(value.data.selected)];
                if (
                    pending.kind === 'rawVC' &&
                    (!selected.length ||
                        selected.some(
                            id => !pending.candidates.some(item => item.id === id && item.eligible)
                        ))
                )
                    throw new IntakeFailure('changed');
                let added = 0,
                    existing = 0,
                    failed = 0;
                if (pending.kind !== 'rawVC') {
                    const sameKind = await records(lc, { category: pending.kind });
                    if (sameKind.some(item => item.nativeIntakeHash === pending.fingerprint))
                        return { added: 0, existing: 1, failed: 0 };
                    if (pending.kind === 'resume' && sameKind.length && !pending.replacesResume)
                        throw new IntakeFailure('changed');
                    const id = '__native_intake_doc_' + pending.fingerprint + '__';
                    const unsigned = {
                        '@context': [
                            'https://www.w3.org/2018/credentials/v1',
                            {
                                id: '@id',
                                type: '@type',
                                lcn: 'https://docs.learncard.com/definitions#',
                                xsd: 'https://www.w3.org/2001/XMLSchema#',
                                RawArtifactCredential: { '@id': 'lcn:rawArtifactCredential' },
                                rawArtifact: {
                                    '@id': 'lcn:rawArtifact',
                                    '@context': Object.fromEntries(
                                        ['data', 'type', 'fileName', 'fileSize', 'fileType'].map(
                                            field => [
                                                field,
                                                {
                                                    '@id': `lcn:rawArtifact${field[0].toUpperCase()}${field.slice(1)}`,
                                                    '@type': 'xsd:string',
                                                },
                                            ]
                                        )
                                    ),
                                },
                            },
                        ],
                        id: 'urn:uuid:' + crypto.randomUUID(),
                        type: ['VerifiableCredential', 'RawArtifactCredential'],
                        issuer: lc.id.did(),
                        issuanceDate: new Date().toISOString(),
                        credentialSubject: { id: lc.id.did() },
                        rawArtifact: {
                            type: pending.kind,
                            fileName: pending.name,
                            fileSize: fileSize(pending.size),
                            fileType: pending.name.split('.').pop()!.toUpperCase(),
                            data: `data:${pending.mime};base64,${pending.data}`,
                        },
                    };
                    const signed = await lc.invoke.issueCredential(unsigned);
                    check(lc);
                    const uri = await lc.store.LearnCloud.uploadEncrypted?.(signed);
                    check(lc);
                    if (!uri) throw new IntakeFailure('connection');
                    const metadata = {
                        uri,
                        category: pending.kind,
                        nativeIntakeHash: pending.fingerprint,
                        fileName: pending.name,
                        fileSize: String(pending.size),
                        fileType: pending.mime,
                        uploadType: pending.kind,
                    };
                    // Web keeps one current résumé. Refuse a replacement that was not in the reviewed state.
                    if (pending.kind === 'resume' && sameKind.length) {
                        await lc.index.LearnCloud.update(text(sameKind[0].id), metadata);
                    } else await lc.index.LearnCloud.add({ id, ...metadata });
                    check(lc);
                    added = 1;
                } else
                    for (const id of selected) {
                        const item = pending.candidates.find(candidate => candidate.id === id)!;
                        try {
                            if ((await records(lc, { id })).length) {
                                existing++;
                                continue;
                            }
                            const uri = await lc.store.LearnCloud.uploadEncrypted?.(
                                item.raw as never
                            );
                            check(lc);
                            if (!uri) throw new IntakeFailure('connection');
                            await lc.index.LearnCloud.add({
                                id,
                                uri,
                                category: item.category,
                                fileName: pending.name,
                                fileSize: String(pending.size),
                                fileType: 'JSON',
                                uploadType: 'rawVC',
                            });
                            check(lc);
                            added++;
                        } catch {
                            check(lc);
                            failed++;
                        }
                    }
                return { added, existing, failed };
            }),
        intakeDocument: async (input: unknown) => {
            const lc = wallet();
            const id = z
                .object({ id: z.string().min(1).max(500) })
                .strict()
                .safeParse(input);
            if (!id.success) throw new IntakeFailure('file');
            const indexed = (await records(lc, { id: id.data.id }))[0];
            if (!indexed || !documentKinds.includes(indexed.category as never))
                throw new IntakeFailure('changed');
            const raw = object(await lc.read.get(text(indexed.uri)));
            check(lc);
            const artifact = object(raw.rawArtifact),
                data = text(artifact.data),
                name = [...text(artifact.fileName)]
                    .map(char =>
                        char.codePointAt(0)! < 32 || char === '/' || char === '\\' ? '_' : char
                    )
                    .join('')
                    .slice(0, 180);
            if (
                !name ||
                !/^data:(application\/pdf|text\/plain|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|image\/(png|jpeg|webp));base64,[A-Za-z0-9+/]+=*$/u.test(
                    data
                ) ||
                data.length > 6 * 1024 * 1024
            )
                throw new IntakeFailure('file');
            return { name, base64: data.slice(data.indexOf(',') + 1) };
        },
        intakeDiscard: async (input: unknown) => {
            const lc = wallet();
            const value = z.object({ id: z.string().uuid() }).strict().safeParse(input);
            if (value.success && review?.wallet === lc && review.id === value.data.id)
                review = undefined;
            return { discarded: true };
        },
    };
};
