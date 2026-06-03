import { lookup } from 'node:dns/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { dirname } from 'node:path';

import JSZip from 'jszip';
import { shareToRecoveryPhrase, splitPrivateKey } from '@learncard/sss-key-manager';

import type {
    BundleContentType,
    ExportLearnCardBundleOptions,
    JsonValue,
    LearnCardBundleEntryMetadata,
    LearnCardBundleOptions,
    LearnCardBundleResult,
    LearnCardBundleWallet,
} from './types';
import { BUNDLE_README_MD, BUNDLE_SPEC_MD, finalizeManifest, SPEC_VERSION } from './manifest';
import { encodePayload, sha256Hex, stableStringify } from './crypto';

const ZIP_DATE = new Date('2024-01-01T00:00:00.000Z');

const DEFAULT_STATUS_LIST_FETCH_TIMEOUT_MS = 5000;
const DEFAULT_MAX_STATUS_LIST_BYTES = 5 * 1024 * 1024;

const stripIpv6Brackets = (hostname: string): string =>
    hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;

const redactMalformedUrl = (value: string): string => {
    const queryIndex = value.indexOf('?');
    const ampIndex = value.indexOf('&');

    if (queryIndex === -1 && ampIndex === -1) return value;

    const redactionIndex =
        queryIndex === -1
            ? ampIndex
            : ampIndex === -1
            ? queryIndex
            : Math.min(queryIndex, ampIndex);

    return `${value.slice(0, redactionIndex)}?[redacted]`;
};

const redactUrl = (value: string): string => {
    try {
        const url = new URL(value);
        const hostname = stripIpv6Brackets(url.hostname.toLowerCase());
        const shouldRedactHost =
            !hostname.includes('.') ||
            hostname === 'localhost' ||
            hostname.endsWith('.localhost') ||
            Boolean(isIP(hostname) && isPrivateAddress(hostname));
        const host = shouldRedactHost ? '[redacted-host]' : url.host;

        return `${url.protocol}//${host}${url.pathname}${url.search ? '?[redacted]' : ''}`;
    } catch {
        return redactMalformedUrl(value);
    }
};

const urlEndDelimiters = new Set([' ', '\n', '\r', '\t', "'", '"', '<', '>']);

const findNextUrlStart = (value: string, fromIndex: number): number => {
    const httpIndex = value.indexOf('http://', fromIndex);
    const httpsIndex = value.indexOf('https://', fromIndex);

    if (httpIndex === -1) return httpsIndex;
    if (httpsIndex === -1) return httpIndex;

    return Math.min(httpIndex, httpsIndex);
};

const findUrlEnd = (value: string, fromIndex: number): number => {
    let index = fromIndex;

    while (index < value.length && !urlEndDelimiters.has(value[index]!)) index += 1;

    return index;
};

const redactText = (value: string): string => {
    let redacted = '';
    let index = 0;

    while (index < value.length) {
        const urlStart = findNextUrlStart(value, index);

        if (urlStart === -1) {
            redacted += value.slice(index);
            break;
        }

        const urlEnd = findUrlEnd(value, urlStart);

        redacted += value.slice(index, urlStart);
        redacted += redactUrl(value.slice(urlStart, urlEnd));
        index = urlEnd;
    }

    return redacted;
};

const safeMessage = (error: unknown): string =>
    redactText(error instanceof Error ? error.message : String(error));

const isPrivateIPv4 = (address: string): boolean => {
    const parts = address.split('.').map(part => Number(part));

    if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255))
        return true;

    const [a, b] = parts;

    if (a === 0 || a === 10 || a === 127 || a >= 224) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;

    return false;
};

const isPrivateIPv6 = (address: string): boolean => {
    const normalized = address.toLowerCase();

    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (
        normalized.startsWith('fe8') ||
        normalized.startsWith('fe9') ||
        normalized.startsWith('fea') ||
        normalized.startsWith('feb')
    )
        return true;

    const ipv4Mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);

    return ipv4Mapped ? isPrivateIPv4(ipv4Mapped[1]!) : false;
};

const isPrivateAddress = (address: string): boolean => {
    const version = isIP(address);

    if (version === 4) return isPrivateIPv4(address);
    if (version === 6) return isPrivateIPv6(address);

    return true;
};

const assertPublicHttpsUrl = async (uri: string): Promise<URL> => {
    const url = new URL(uri);
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (url.protocol !== 'https:') throw new Error('status-list URL must use https');
    if (!hostname.includes('.') || hostname === 'localhost' || hostname.endsWith('.localhost')) {
        throw new Error('status-list URL host must be public');
    }

    if (isIP(hostname)) {
        if (isPrivateAddress(hostname)) throw new Error('status-list URL host must be public');

        return url;
    }

    const addresses = await lookup(hostname, { all: true, verbatim: true });

    if (addresses.length === 0 || addresses.some(address => isPrivateAddress(address.address))) {
        throw new Error('status-list URL host must resolve to public addresses');
    }

    return url;
};

const readResponseText = async (response: Response, maxBytes: number): Promise<string> => {
    const contentLength = Number(response.headers.get('content-length'));

    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        throw new Error(`status-list response exceeds ${maxBytes} bytes`);
    }

    if (!response.body) {
        const text = await response.text();

        if (Buffer.byteLength(text, 'utf8') > maxBytes) {
            throw new Error(`status-list response exceeds ${maxBytes} bytes`);
        }

        return text;
    }

    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let total = 0;

    while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        total += value.byteLength;

        if (total > maxBytes) {
            await reader.cancel();

            throw new Error(`status-list response exceeds ${maxBytes} bytes`);
        }

        chunks.push(Buffer.from(value));
    }

    return Buffer.concat(chunks).toString('utf8');
};

const fetchJsonWithTimeout = async (
    url: URL,
    timeoutMs: number,
    maxBytes: number
): Promise<JsonValue> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        return JSON.parse(await readResponseText(response, maxBytes)) as JsonValue;
    } finally {
        clearTimeout(timeout);
    }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const stringArrayIncludes = (value: unknown, expected: string): boolean =>
    Array.isArray(value) && value.some(item => item === expected);

const json = (value: unknown): string => `${stableStringify(value)}\n`;

const classifyPayload = (payload: JsonValue): BundleContentType => {
    if (!isRecord(payload)) return 'unknown-json';

    if (
        stringArrayIncludes(payload.type, 'VerifiablePresentation') ||
        payload.type === 'VerifiablePresentation'
    ) {
        return 'presentation';
    }

    if (
        stringArrayIncludes(payload.type, 'VerifiableCredential') ||
        payload.type === 'VerifiableCredential'
    ) {
        return 'credential';
    }

    return 'unknown-json';
};

const pathForType = (type: BundleContentType, digest: string, encrypted: boolean): string => {
    const suffix = encrypted ? '.enc' : '';

    if (type === 'presentation') return `presentations/${digest}.json${suffix}`;

    if (type === 'consent-record') return `consent-records/${digest}.json${suffix}`;

    if (type === 'index-record') return `index-records/${digest}.json${suffix}`;
    if (type === 'status-cache') return `status-cache/${digest}.json${suffix}`;

    return `credentials/${digest}.json${suffix}`;
};

const getCredentialId = (payload: JsonValue): string | undefined =>
    isRecord(payload) && typeof payload.id === 'string' ? payload.id : undefined;

const addZipText = (zip: JSZip, path: string, content: string): void => {
    zip.file(path, content, { date: ZIP_DATE });
};

const collectDids = (wallet: LearnCardBundleWallet, warnings: string[]): Record<string, string> => {
    const dids: Record<string, string> = {};

    for (const method of [undefined, 'key', 'pkh:sol', 'tz', 'pkh:tz']) {
        try {
            dids[method ?? 'default'] = wallet.id.did(method);
        } catch (error) {
            warnings.push(
                `Could not derive DID method ${method ?? 'default'}: ${safeMessage(error)}`
            );
        }
    }

    return dids;
};

const collectDidDocument = async (
    wallet: LearnCardBundleWallet,
    primaryDid: string,
    dids: Record<string, string>,
    warnings: string[]
): Promise<JsonValue> => {
    if (!wallet.invoke.resolveDid) return { primaryDid, dids };

    try {
        return { primaryDid, dids, primaryDidDocument: await wallet.invoke.resolveDid(primaryDid) };
    } catch (error) {
        warnings.push(`Could not resolve primary DID document: ${safeMessage(error)}`);

        return { primaryDid, dids };
    }
};

const collectKeyPayloads = async (
    wallet: LearnCardBundleWallet,
    warnings: string[]
): Promise<
    Array<{ path: string; type: BundleContentType; content: string; encrypted: boolean }>
> => {
    const payloads: Array<{
        path: string;
        type: BundleContentType;
        content: string;
        encrypted: boolean;
    }> = [];

    if (wallet.invoke.getKey) {
        try {
            const seed = wallet.invoke.getKey();
            const shares = await splitPrivateKey(seed);

            payloads.push({
                path: 'keys/private-key-seed.txt',
                type: 'key-private-seed',
                content: `${seed}\n`,
                encrypted: true,
            });

            payloads.push({
                path: 'keys/recovery-phrase.txt',
                type: 'key-recovery-phrase',
                content: `${await shareToRecoveryPhrase(shares.recoveryShare)}\n`,
                encrypted: true,
            });
        } catch (error) {
            warnings.push(`Could not export seed or recovery phrase: ${safeMessage(error)}`);
        }
    } else {
        warnings.push(
            'Wallet does not expose invoke.getKey(); private seed and recovery phrase were not exported'
        );
    }

    if (wallet.id.keypair) {
        const jwks: Record<string, JsonValue> = {};

        for (const algorithm of ['ed25519', 'secp256k1'] as const) {
            try {
                jwks[algorithm] = wallet.id.keypair(algorithm);
            } catch (error) {
                warnings.push(`Could not export ${algorithm} JWK: ${safeMessage(error)}`);
            }
        }

        if (Object.keys(jwks).length > 0) {
            payloads.push({
                path: 'keys/jwks.json',
                type: 'key-jwks',
                content: json(jwks),
                encrypted: true,
            });
        }
    } else {
        warnings.push('Wallet does not expose id.keypair(); JWK key export was skipped');
    }

    return payloads;
};

const extractStatusListUrls = (payload: JsonValue): string[] => {
    if (!isRecord(payload)) return [];

    const statuses = Array.isArray(payload.credentialStatus)
        ? payload.credentialStatus
        : payload.credentialStatus
        ? [payload.credentialStatus]
        : [];

    return statuses.flatMap(status =>
        isRecord(status) && typeof status.statusListCredential === 'string'
            ? [status.statusListCredential]
            : []
    );
};

const collectStatusLists = async (
    payloads: JsonValue[],
    enabled: boolean,
    warnings: string[],
    timeoutMs = DEFAULT_STATUS_LIST_FETCH_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_STATUS_LIST_BYTES
): Promise<Array<{ uri: string; content: JsonValue }>> => {
    if (!enabled) return [];

    const urls = [...new Set(payloads.flatMap(extractStatusListUrls))];
    const results: Array<{ uri: string; content: JsonValue }> = [];

    for (const uri of urls) {
        try {
            const url = await assertPublicHttpsUrl(uri);

            results.push({ uri, content: await fetchJsonWithTimeout(url, timeoutMs, maxBytes) });
        } catch (error) {
            warnings.push(
                `Could not cache status-list credential ${redactUrl(uri)}: ${safeMessage(error)}`
            );
        }
    }

    return results;
};

const collectConsentRecords = async (
    wallet: LearnCardBundleWallet,
    warnings: string[]
): Promise<JsonValue[]> => {
    if (wallet.invoke.getHolderExportMetadata) {
        try {
            const metadata = await wallet.invoke.getHolderExportMetadata();

            if (isRecord(metadata) && Array.isArray(metadata.warnings)) {
                warnings.push(
                    ...metadata.warnings
                        .filter(warning => typeof warning === 'string')
                        .map(warning => redactText(warning))
                );
            }

            return isRecord(metadata) && Array.isArray(metadata.consentRecords)
                ? (metadata.consentRecords as JsonValue[])
                : [];
        } catch (error) {
            warnings.push(`Could not fetch holder export metadata: ${safeMessage(error)}`);
        }
    }

    if (!wallet.invoke.getConsentedContracts) return [];

    try {
        const response = await wallet.invoke.getConsentedContracts();

        if (!isRecord(response) || !Array.isArray(response.records)) return [];

        return response.records as JsonValue[];
    } catch (error) {
        warnings.push(`Could not fetch consented contracts fallback: ${safeMessage(error)}`);

        return [];
    }
};

export const createLearnCardBundle = async (
    wallet: LearnCardBundleWallet,
    options: LearnCardBundleOptions = {}
): Promise<LearnCardBundleResult> => {
    const encrypt = options.encrypt ?? true;

    if (encrypt && !options.password)
        throw new Error('A password is required for LearnCard export');

    const warnings: string[] = [];
    const zip = new JSZip();
    const contents: LearnCardBundleEntryMetadata[] = [];
    const primaryDid = wallet.id.did();
    const dids = collectDids(wallet, warnings);
    const didDocument = await collectDidDocument(wallet, primaryDid, dids, warnings);
    const credentialPayloads: JsonValue[] = [];

    const addStoredEntry = async (entry: {
        id: string;
        type: BundleContentType;
        path: string;
        content: string;
        encrypted: boolean;
        mediaType?: string;
        sourceUri?: string;
        credentialId?: string;
        indexRecordRef?: string;
        warnings?: string[];
    }): Promise<void> => {
        const encoded = await encodePayload(entry.content, {
            encrypt: entry.encrypted && encrypt,
            password: options.password,
        });
        const path =
            encoded.encrypted && !entry.path.endsWith('.enc') ? `${entry.path}.enc` : entry.path;

        addZipText(zip, path, encoded.stored);

        contents.push({
            id: entry.id,
            type: entry.type,
            path,
            mediaType: entry.mediaType ?? 'application/json',
            sha256: sha256Hex(encoded.stored),
            encrypted: encoded.encrypted,
            sourceUri: entry.sourceUri,
            credentialId: entry.credentialId,
            indexRecordRef: entry.indexRecordRef,
            warnings: entry.warnings,
        });
    };

    addZipText(zip, 'README.md', BUNDLE_README_MD);
    addZipText(zip, 'BUNDLE_SPEC.md', BUNDLE_SPEC_MD);

    await addStoredEntry({
        id: 'did-document',
        type: 'did-document',
        path: 'keys/did-document.json',
        content: json(didDocument),
        encrypted: false,
    });

    for (const payload of await collectKeyPayloads(wallet, warnings)) {
        await addStoredEntry({ ...payload, id: payload.path, mediaType: 'text/plain' });
    }

    const records = await wallet.index.LearnCloud.get();

    for (const [recordIndex, record] of records.entries()) {
        const entryWarnings: string[] = [];
        const digest = sha256Hex(
            stableStringify({ recordIndex, id: record.id ?? null, uri: record.uri ?? null })
        );

        try {
            const resolved = await wallet.read.get(record.uri);

            if (!resolved) {
                warnings.push(`Could not resolve wallet index URI ${redactUrl(record.uri)}`);
                continue;
            }

            credentialPayloads.push(resolved);
            const type = classifyPayload(resolved);
            const credentialId = getCredentialId(resolved);
            if (type === 'unknown-json') entryWarnings.push('Payload is not a recognized VC or VP');

            const indexRecordId = `urn:sha256:${digest}:index-record`;

            await addStoredEntry({
                id: indexRecordId,
                type: 'index-record',
                path: pathForType('index-record', digest, encrypt),
                content: json(record),
                encrypted: true,
                sourceUri: record.uri,
                credentialId,
            });

            await addStoredEntry({
                id: `urn:sha256:${digest}`,
                type,
                path: pathForType(type, digest, encrypt),
                content: json(resolved),
                encrypted: true,
                sourceUri: record.uri,
                credentialId,
                indexRecordRef: indexRecordId,
                warnings: entryWarnings.length > 0 ? entryWarnings : undefined,
            });
        } catch (error) {
            warnings.push(
                `Could not export wallet index URI ${redactUrl(record.uri)}: ${safeMessage(error)}`
            );
        }
    }

    const consentRecords = await collectConsentRecords(wallet, warnings);

    for (const consentRecord of consentRecords) {
        const digest = sha256Hex(stableStringify(consentRecord));

        await addStoredEntry({
            id: `urn:sha256:${digest}`,
            type: 'consent-record',
            path: pathForType('consent-record', digest, encrypt),
            content: json(consentRecord),
            encrypted: true,
        });
    }

    for (const statusList of await collectStatusLists(
        credentialPayloads,
        options.fetchStatusLists ?? true,
        warnings,
        options.statusListFetchTimeoutMs,
        options.maxStatusListBytes
    )) {
        const digest = sha256Hex(statusList.uri);

        await addStoredEntry({
            id: `urn:sha256:${digest}`,
            type: 'status-cache',
            path: pathForType('status-cache', digest, encrypt),
            content: json(statusList.content),
            encrypted: true,
            sourceUri: statusList.uri,
        });
    }

    const manifest = finalizeManifest({
        specVersion: SPEC_VERSION,
        createdAt: options.createdAt ?? new Date().toISOString(),
        primaryDid,
        walletName: 'LearnCard',
        encryption: encrypt
            ? {
                  mode: 'argon2id-aes-256-gcm',
                  encryptedPayloads: true,
                  envelope: 'sss-key-manager-encryptWithPassword-v1',
                  kdf: 'argon2id',
                  cipher: 'AES-256-GCM',
              }
            : { mode: 'none', encryptedPayloads: false },
        contents,
        warnings,
    });

    addZipText(zip, 'manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);

    return {
        data: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
        manifest,
        warnings,
    };
};

export const exportLearnCardBundle = async (
    wallet: LearnCardBundleWallet,
    options: ExportLearnCardBundleOptions
): Promise<LearnCardBundleResult> => {
    const bundle = await createLearnCardBundle(wallet, options);

    await mkdir(dirname(options.out), { recursive: true });
    await writeFile(options.out, bundle.data);

    return bundle;
};
