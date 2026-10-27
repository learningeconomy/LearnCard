import { markPrivacyFailure, withPrivacyOperation } from './privacy-diagnostics';
import { withAiInsightStage } from '../diagnostics/ai-insight';
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

import { db } from '../db';
import { maskSensitiveText, MAX_GUARDRAIL_TEXT_LENGTH } from './bedrock-guardrails';
import {
    getCurrentAiCredentialUris,
    getCurrentAiPersonalFields,
    getCurrentAiSubject,
} from './privacy';
import { getPrivacyKeyMaterial, getPrivacySubjectRef } from './privacy-keys';

export type IdentifierKind =
    'address' | 'credential' | 'date_of_birth' | 'did' | 'email' | 'name' | 'phone';

export type EncryptedIdentifierMapping = {
    version: 1;
    subjectRef: string;
    valueRef: string;
    token: string;
    kind: IdentifierKind;
    ciphertext: string;
    iv: string;
    authTag: string;
    createdAt: string;
    expiresAt: Date;
};

type Span = { start: number; end: number; kind: IdentifierKind };
type PrivacyKeys = { encryption: Buffer; reference: Buffer };
type MappingDependencies = {
    currentSubject: () => string | undefined;
    subjectReference: (did: string) => string;
    keys: () => PrivacyKeys;
    mask: (text: string, source: 'INPUT' | 'OUTPUT') => Promise<string>;
    personalFields: () => Record<string, string>;
    credentialUris: () => readonly string[];
    retain: (mapping: EncryptedIdentifierMapping, now: Date) => Promise<EncryptedIdentifierMapping>;
    lookup: (
        subjectRef: string,
        tokens: string[],
        now: Date
    ) => Promise<EncryptedIdentifierMapping[]>;
    remove: (subjectRef: string) => Promise<number>;
    now: () => Date;
};

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_PATTERN =
    /\{\{(?:ADDRESS|CREDENTIAL|DATE_OF_BIRTH|DID|EMAIL|NAME|PHONE)_[a-f0-9]{32}\}\}/g;
const directPatterns: { kind: IdentifierKind; pattern: RegExp }[] = [
    {
        kind: 'email',
        pattern: /(?<![\w.+-])[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}(?![\w-])/gi,
    },
    { kind: 'did', pattern: /\bdid:[a-z0-9]+:[^\s"'<>`,}\]]+/gi },
    {
        kind: 'credential',
        pattern:
            /\b(?:lc:[^\s"'<>`,}\]]+|urn:uuid:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}(?![a-f0-9-])|https?:\/\/[^\s"'<>`,}\]]*\/(?:credentials?|assertions?)\/[^\s"'<>`,}\]]+)/gi,
    },
    {
        kind: 'phone',
        pattern:
            /(?<![\w-])(?:\+\d[\d () .-]{6,}\d|(?:\(\d{3}\)[ .-]?|\d{3}[ .-])\d{3}[ .-]\d{4})(?![\w-])/g,
    },
    {
        kind: 'address',
        pattern:
            /\b\d{1,6}\s+(?:[\p{L}\d.'’-]+\s+){1,6}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd|Way|Court|Ct)(?:\.?\s*(?:,?\s*(?:Apt|Apartment|Suite|Unit|#)\s*[\p{L}\d-]+))?\b/giu,
    },
];
const dobPattern =
    /(?:(?<![\p{L}\p{N}_])(?:date\s+of\s+birth|birth\s*date|birthday|dob|(?:was\s+)?born(?:\s+on)?|fecha\s+de\s+nacimiento|naci[oóí](?:\s+el)?|date\s+de\s+naissance|n[ée]e?(?:\s+le)?|geburtsdatum|geboren(?:\s+am)?|data\s+di\s+nascita|nato(?:\s+il)?|data\s+de\s+nascimento|nasceu(?:\s+em)?|дата\s+рождения|родил(?:ся|ась)|تاريخ\s+الميلاد|تاريخ\s+ميلاد|ولد|ولدت|जन्म\s*तिथि|जन्मदिन)(?![\p{L}_])|出生日期|生日|生年月日|生まれ|생년월일|출생일|생일)\s*(?:(?:is|es|est|ist)\s*)?[:=]?\s*([\p{Nd}]{4}[-/年][\p{Nd}]{1,2}[-/月][\p{Nd}]{1,2}日?|[\p{Nd}]{1,2}[-/][\p{Nd}]{1,2}[-/][\p{Nd}]{2,4}|[\p{Nd}]{1,2}\s+[\p{L}\p{M}]+\s+[\p{Nd}]{4}|[\p{L}\p{M}]+\s+[\p{Nd}]{1,2},?\s+[\p{Nd}]{4}|[\p{L}\p{M}]+\s+[\p{Nd}]{4}|[\p{Nd}]{4})/giu;
const phoneContextPattern = /\b(?:phone|mobile|telephone|tel)\s*[:=]\s*(\+?[\d () .-]{7,}\d)/gi;

const fieldKind = (key: string): IdentifierKind | undefined => {
    switch (key.replace(/[_\s-]/g, '').toLowerCase()) {
        case 'fullname':
        case 'firstname':
        case 'lastname':
        case 'givenname':
        case 'familyname':
            return 'name';
        case 'email':
        case 'emailaddress':
            return 'email';
        case 'phone':
        case 'phonenumber':
        case 'mobile':
        case 'telephone':
            return 'phone';
        case 'birthdate':
        case 'dateofbirth':
        case 'dob':
            return 'date_of_birth';
        case 'address':
        case 'streetaddress':
        case 'postaladdress':
        case 'homeaddress':
            return 'address';
        case 'credentialid':
        case 'credentialuri':
        case 'storageid':
        case 'storageuri':
            return 'credential';
        default:
            return undefined;
    }
};

const mappingAad = (mapping: EncryptedIdentifierMapping): Buffer =>
    Buffer.from(
        JSON.stringify([
            mapping.version,
            mapping.subjectRef,
            mapping.valueRef,
            mapping.token,
            mapping.kind,
            mapping.createdAt,
            mapping.expiresAt.toISOString(),
        ])
    );

const encryptMapping = (
    subjectRef: string,
    valueRef: string,
    kind: IdentifierKind,
    value: string,
    key: Buffer,
    now: Date
): EncryptedIdentifierMapping => {
    const iv = randomBytes(12);
    const mapping: EncryptedIdentifierMapping = {
        version: 1,
        subjectRef,
        valueRef,
        token: `{{${kind.toUpperCase()}_${randomBytes(16).toString('hex')}}}`,
        kind,
        ciphertext: '',
        iv: iv.toString('base64'),
        authTag: '',
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + RETENTION_MS),
    };
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(mappingAad(mapping));
    mapping.ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]).toString(
        'base64'
    );
    mapping.authTag = cipher.getAuthTag().toString('base64');
    return mapping;
};

const decryptMapping = (
    mapping: EncryptedIdentifierMapping,
    subjectRef: string,
    key: Buffer,
    now: Date
): string => {
    try {
        const createdAt = Date.parse(mapping.createdAt);
        const expiresAt = mapping.expiresAt.getTime();
        if (
            mapping.version !== 1 ||
            mapping.subjectRef !== subjectRef ||
            !Number.isFinite(createdAt) ||
            !Number.isFinite(expiresAt) ||
            createdAt > now.getTime() ||
            expiresAt <= now.getTime() ||
            expiresAt - createdAt !== RETENTION_MS ||
            !new RegExp(`^${TOKEN_PATTERN.source}$`).test(mapping.token) ||
            !mapping.token.startsWith(`{{${mapping.kind.toUpperCase()}_`)
        )
            throw new Error();
        const iv = Buffer.from(mapping.iv, 'base64');
        const tag = Buffer.from(mapping.authTag, 'base64');
        if (iv.length !== 12 || tag.length !== 16) throw new Error();
        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAAD(mappingAad(mapping));
        decipher.setAuthTag(tag);
        return Buffer.concat([
            decipher.update(Buffer.from(mapping.ciphertext, 'base64')),
            decipher.final(),
        ]).toString('utf8');
    } catch {
        throw new Error('Identifier mapping authentication failed');
    }
};

/** Export retained mappings only within their authenticated owner's privacy context. */
export const decryptIdentifierMapping = (
    mapping: EncryptedIdentifierMapping,
    subjectRef: string
): string => {
    const did = getCurrentAiSubject();
    if (!did || getPrivacySubjectRef(did) !== subjectRef)
        throw new Error('Identifier mapping owner mismatch');
    return decryptMapping(mapping, subjectRef, getPrivacyKeyMaterial().encryption, new Date());
};

const binaryTypes: Record<string, true | undefined> = {
    image: true,
    image_url: true,
    input_image: true,
    audio: true,
    input_audio: true,
    output_audio: true,
    file: true,
    input_file: true,
    video: true,
    input_video: true,
    document: true,
    base64: true,
};
const binaryKeys: Record<string, true | undefined> = {
    image_url: true,
    image_data: true,
    input_audio: true,
    file_data: true,
    file_id: true,
    file_url: true,
    inline_data: true,
    inlineData: true,
    fileData: true,
    audio_url: true,
    video_url: true,
    data_base64: true,
    encrypted_content: true,
    media_type: true,
    mime_type: true,
    mimeType: true,
    audio: true,
    image: true,
    video: true,
    file: true,
};
const structuralKeys: Record<string, true | undefined> = {
    role: true,
    type: true,
    content: true,
    text: true,
    input_text: true,
    output_text: true,
    name: true,
    arguments: true,
    function: true,
    tool_calls: true,
    function_call: true,
    tool_call_id: true,
    call_id: true,
    id: true,
    status: true,
    summary: true,
    refusal: true,
    output: true,
    annotations: true,
    metadata: true,
    encrypted_content: true,
};

// Traverse every string value and dynamic key, including nested tool arguments,
// refusals, summaries and JSON-encoded content. Non-JSON objects cannot reach a provider.
const transformValue = async (
    value: unknown,
    text: (value: string, kind?: IdentifierKind) => Promise<string>,
    input: boolean,
    seen = new Set<object>(),
    kind?: IdentifierKind
): Promise<unknown> => {
    if (typeof value === 'string') {
        if (input && /\bdata:(?:[^,\s]*;base64,|[a-z][a-z0-9.+-]*\/[a-z0-9.+-]+[;,])/i.test(value))
            throw new Error('Binary AI input requires local text extraction');
        if (!kind && /^\s*[[{]/.test(value)) {
            let parsed: unknown;
            try {
                parsed = JSON.parse(value);
            } catch {
                /* Ordinary prose may begin with a bracket. */
            }
            if (parsed !== undefined)
                return JSON.stringify(await transformValue(parsed, text, input, seen));
        }
        return text(value, kind);
    }
    if (value === null || value === undefined || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) {
        // Structured phone/credential identifiers can arrive as JSON numbers.
        return kind ? text(String(value), kind) : value;
    }
    if (typeof value !== 'object') throw new Error('Unsupported non-text AI content');
    if (seen.has(value)) throw new Error('Cyclic AI content is unsupported');
    if (
        !Array.isArray(value) &&
        Object.getPrototypeOf(value) !== Object.prototype &&
        Object.getPrototypeOf(value) !== null
    )
        throw new Error('Binary AI input requires local text extraction');
    seen.add(value);
    try {
        if (Array.isArray(value)) {
            const result: unknown[] = [];
            for (const entry of value)
                result.push(await transformValue(entry, text, input, seen, kind));
            return result;
        }
        const entries = Object.entries(value);
        if (
            input &&
            entries.some(
                ([key, entry]) =>
                    (key === 'type' && typeof entry === 'string' && binaryTypes[entry] === true) ||
                    (binaryKeys[key] === true && entry !== null && entry !== undefined)
            )
        )
            throw new Error('Binary AI input requires local text extraction');
        const isCredential = entries.some(
            ([key, entry]) =>
                key === 'credentialSubject' ||
                (key === 'type' &&
                    (entry === 'VerifiableCredential' ||
                        (Array.isArray(entry) && entry.includes('VerifiableCredential'))))
        );
        const result: Record<string, unknown> = {};
        for (const [key, entry] of entries) {
            const transformedKey =
                structuralKeys[key] === true || fieldKind(key) ? key : await text(key);
            if (Object.hasOwn(result, transformedKey)) throw new Error('AI content key collision');
            Object.defineProperty(result, transformedKey, {
                value: await transformValue(
                    entry,
                    text,
                    input,
                    seen,
                    key === 'id' && isCredential ? 'credential' : (fieldKind(key) ?? kind)
                ),
                enumerable: true,
                configurable: true,
                writable: true,
            });
        }
        return result;
    } finally {
        seen.delete(value);
    }
};

export const createIdentifierMappingService = (dependencies: MappingDependencies) => {
    const context = () => {
        const subject = dependencies.currentSubject();
        if (!subject?.trim()) throw new Error('Authenticated AI subject is required');
        const keys = dependencies.keys();
        if (keys.encryption.length !== 32 || keys.reference.length !== 32)
            throw new Error('Privacy key material is invalid');
        return { subjectRef: dependencies.subjectReference(subject), keys };
    };

    const pseudonymizeProviderInput = async <Value>(
        value: Value,
        source: 'INPUT' | 'OUTPUT' = 'INPUT',
        measure = false
    ): Promise<Value | number> => {
        let operation: Parameters<typeof markPrivacyFailure>[1] = 'preparation';
        try {
            const { subjectRef, keys } = context();
            const retained = new Map<string, string>();
            const known: { value: string; kind: IdentifierKind }[] = dependencies
                .credentialUris()
                .map(value => ({ value, kind: 'credential' }));
            // Only current, consent-bound personal values seed reversible identity.
            // Free-text detections remain generic and are never guessed back into names.
            for (const [field, identifier] of Object.entries(dependencies.personalFields())) {
                const kind = field === 'name' ? 'name' : fieldKind(field);
                if (kind && identifier.trim()) known.push({ value: identifier, kind });
            }
            operation = 'local_filtering';
            // Gather explicit personal fields before traversal so property order cannot
            // change whether the same identity in prose gets a stable token.
            await transformValue(
                value,
                async (text, kind) => {
                    if (kind && text.trim() && !TOKEN_PATTERN.test(text))
                        known.push({ value: text, kind });
                    TOKEN_PATTERN.lastIndex = 0;
                    return text;
                },
                true
            );
            const register = async (kind: IdentifierKind, identifier: string): Promise<string> => {
                const valueRef = createHmac('sha256', keys.reference)
                    .update(JSON.stringify(['identifier-value:v1', subjectRef, kind, identifier]))
                    .digest('hex');
                // Dry-run tokens have the exact retained-token length and JSON escaping.
                // No mapping encryption, persistence or service call occurs in this mode.
                if (measure) return `{{${kind.toUpperCase()}_${valueRef.slice(0, 32)}}}`;
                const cached = retained.get(valueRef);
                if (cached) return cached;
                const now = dependencies.now();
                const candidate = encryptMapping(
                    subjectRef,
                    valueRef,
                    kind,
                    identifier,
                    keys.encryption,
                    now
                );
                let mapping: EncryptedIdentifierMapping;
                try {
                    mapping = await dependencies.retain(candidate, now);
                } catch (error) {
                    throw markPrivacyFailure(
                        new Error('Identifier mapping persistence failed'),
                        'mapping_persistence',
                        error,
                        'mapping_persistence'
                    );
                }
                if (
                    mapping.valueRef !== valueRef ||
                    mapping.kind !== kind ||
                    (await withPrivacyOperation('mapping_authentication', () =>
                        decryptMapping(mapping, subjectRef, keys.encryption, dependencies.now())
                    )) !== identifier
                )
                    throw markPrivacyFailure(
                        new Error('Identifier mapping authentication failed'),
                        'mapping_authentication',
                        undefined,
                        'mapping_authentication'
                    );
                retained.set(valueRef, mapping.token);
                return mapping.token;
            };
            const transformText = async (text: string, hint?: IdentifierKind): Promise<string> => {
                if (!text.trim()) return text;
                const existingTokens = [...text.matchAll(TOKEN_PATTERN)].map(match => ({
                    start: match.index,
                    end: match.index + match[0].length,
                }));
                if (hint && existingTokens.length === 0) return register(hint, text);
                const spans: Span[] = [];
                for (const identifier of known) {
                    let start = text.indexOf(identifier.value);
                    while (start !== -1) {
                        const end = start + identifier.value.length;
                        const before = text.slice(0, start).at(-1) ?? '';
                        const after = text.slice(end, end + 1);
                        if (!/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after))
                            spans.push({ start, end, kind: identifier.kind });
                        start = text.indexOf(identifier.value, end);
                    }
                }
                for (const { kind, pattern } of directPatterns) {
                    for (const match of text.matchAll(pattern)) {
                        const identifier = match[0].replace(/[.!?;]+$/, '');
                        if (kind === 'phone') {
                            const digits = identifier.replace(/\D/g, '').length;
                            if (digits < 7 || digits > 15) continue;
                        }
                        spans.push({
                            start: match.index,
                            end: match.index + identifier.length,
                            kind,
                        });
                    }
                }
                for (const [pattern, kind] of [
                    [dobPattern, 'date_of_birth'],
                    [phoneContextPattern, 'phone'],
                ] as const) {
                    for (const match of text.matchAll(pattern)) {
                        const identifier = match[1];
                        if (!identifier) continue;
                        if (kind === 'phone' && identifier.replace(/\D/g, '').length > 15) continue;
                        const start = match.index + match[0].lastIndexOf(identifier);
                        spans.push({ start, end: start + identifier.length, kind });
                    }
                }
                const ordered = spans
                    .filter(
                        span =>
                            !existingTokens.some(
                                token => span.start < token.end && span.end > token.start
                            )
                    )
                    .sort((a, b) => a.start - b.start || b.end - a.end);
                const merged: Span[] = [];
                for (const span of ordered) {
                    const previous = merged.at(-1);
                    if (previous && span.start < previous.end)
                        previous.end = Math.max(previous.end, span.end);
                    else merged.push({ ...span });
                }
                let result = '';
                let cursor = 0;
                for (const span of merged) {
                    result +=
                        text.slice(cursor, span.start) +
                        (await register(span.kind, text.slice(span.start, span.end)));
                    cursor = span.end;
                }
                return result + text.slice(cursor);
            };
            const deterministic = await transformValue(value, transformText, true);
            const strings = new Map<string, string>();
            const measuredStrings: string[] = [];
            await transformValue(
                deterministic,
                async text => {
                    if (text.trim()) {
                        strings.set(text, text);
                        if (measure) measuredStrings.push(text);
                    }
                    return text;
                },
                false
            );
            // Include every leaf in measurement rather than deduplicating synthetic
            // tokens: this is exact for insight's single message and a safe upper
            // bound for structured inputs whose real retained tokens may differ.
            if (measure) return JSON.stringify(measuredStrings).length;
            if (!strings.size) return deterministic as Value;
            const originals = [...strings.keys()];
            operation = 'payload_serialization';
            const payload = JSON.stringify(originals);
            if (payload.length > MAX_GUARDRAIL_TEXT_LENGTH)
                throw markPrivacyFailure(
                    new Error('Privacy text size limit exceeded'),
                    'payload_limit',
                    undefined,
                    'payload_too_large'
                );
            let masked: unknown;
            try {
                const response = await withPrivacyOperation('service_invocation', () =>
                    dependencies.mask(payload, source)
                );
                masked = await withPrivacyOperation('response_parsing', () => JSON.parse(response));
            } catch (error) {
                throw markPrivacyFailure(
                    new Error('Managed identifier filtering failed'),
                    'service_invocation',
                    error
                );
            }
            if (
                !Array.isArray(masked) ||
                masked.length !== originals.length ||
                !masked.every(text => typeof text === 'string')
            )
                throw markPrivacyFailure(
                    new Error('Managed identifier filtering returned invalid content'),
                    'response_validation',
                    undefined,
                    'invalid_response'
                );
            operation = 'response_application';
            originals.forEach((text, index) => strings.set(text, masked[index]));
            return (await transformValue(
                deterministic,
                async text => strings.get(text) ?? text,
                false
            )) as Value;
        } catch (error) {
            throw markPrivacyFailure(error, operation);
        }
    };

    const restoreProviderOutput = async <Value>(value: Value): Promise<Value> => {
        const { subjectRef, keys } = context();
        const tokens = new Set<string>();
        await transformValue(
            value,
            async text => {
                for (const match of text.matchAll(TOKEN_PATTERN)) tokens.add(match[0]);
                return text;
            },
            false
        );
        if (!tokens.size) return value;
        let mappings: EncryptedIdentifierMapping[];
        try {
            mappings = await dependencies.lookup(subjectRef, [...tokens], dependencies.now());
        } catch {
            throw new Error('Identifier mapping lookup failed');
        }
        const replacements = new Map<string, string>();
        for (const mapping of mappings) {
            // Enforce ownership and logical expiry even if a store/TTL worker is stale.
            if (mapping.subjectRef !== subjectRef || !tokens.has(mapping.token)) continue;
            if (
                !(mapping.expiresAt instanceof Date) ||
                !Number.isFinite(mapping.expiresAt.getTime())
            )
                throw new Error('Identifier mapping authentication failed');
            if (mapping.expiresAt.getTime() <= dependencies.now().getTime()) continue;
            if (replacements.has(mapping.token)) throw new Error('Ambiguous identifier mapping');
            replacements.set(
                mapping.token,
                decryptMapping(mapping, subjectRef, keys.encryption, dependencies.now())
            );
        }
        return (await transformValue(
            value,
            async text => text.replace(TOKEN_PATTERN, token => replacements.get(token) ?? token),
            false
        )) as Value;
    };

    const deleteIdentifierMappingsForSubject = async (did: string): Promise<number> => {
        const subject = dependencies.currentSubject();
        if (!subject?.trim() || subject !== did)
            throw new Error('Authenticated mapping owner is required');
        const { subjectRef } = context();
        try {
            return await dependencies.remove(subjectRef);
        } catch {
            throw new Error('Identifier mapping deletion failed');
        }
    };
    return {
        pseudonymizeProviderInput: <Value>(value: Value, source: 'INPUT' | 'OUTPUT' = 'INPUT') =>
            withAiInsightStage(
                'privacy_filter',
                () => pseudonymizeProviderInput(value, source) as Promise<Value>
            ),
        measureProviderInputSize: <Value>(value: Value): Promise<number> =>
            pseudonymizeProviderInput(value, 'INPUT', true) as Promise<number>,
        restoreProviderOutput: <Value>(value: Value) =>
            withAiInsightStage('privacy_restore', () => restoreProviderOutput(value)),
        deleteIdentifierMappingsForSubject,
    };
};

const service = createIdentifierMappingService({
    currentSubject: getCurrentAiSubject,
    subjectReference: getPrivacySubjectRef,
    keys: getPrivacyKeyMaterial,
    mask: (text, source) => maskSensitiveText(text, source),
    personalFields: getCurrentAiPersonalFields,
    credentialUris: getCurrentAiCredentialUris,
    retain: (mapping, now) => db.retainIdentifierMapping(mapping, now),
    lookup: (subjectRef, tokens, now) => db.getIdentifierMappings(subjectRef, tokens, now),
    remove: subjectRef => db.deleteIdentifierMappings(subjectRef),
    now: () => new Date(),
});

export const {
    measureProviderInputSize,
    pseudonymizeProviderInput,
    restoreProviderOutput,
    deleteIdentifierMappingsForSubject,
} = service;
