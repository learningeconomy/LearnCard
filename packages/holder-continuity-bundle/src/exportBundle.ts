import { mkdir, writeFile } from 'node:fs/promises';
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const stringArrayIncludes = (value: unknown, expected: string): boolean =>
    Array.isArray(value) && value.some(item => item === expected);

const json = (value: unknown): string => `${stableStringify(value)}\n`;

const safeMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

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
    if ('protected' in payload && 'iv' in payload && 'ciphertext' in payload) return 'unknown-json';

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
            warnings.push(`Could not derive DID method ${method ?? 'default'}: ${safeMessage(error)}`);
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
): Promise<Array<{ path: string; type: BundleContentType; content: string; encrypted: boolean }>> => {
    const payloads: Array<{ path: string; type: BundleContentType; content: string; encrypted: boolean }> = [];

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
        warnings.push('Wallet does not expose invoke.getKey(); private seed and recovery phrase were not exported');
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
    warnings: string[]
): Promise<Array<{ uri: string; content: JsonValue }>> => {
    if (!enabled) return [];

    const urls = [...new Set(payloads.flatMap(extractStatusListUrls))];
    const results: Array<{ uri: string; content: JsonValue }> = [];

    for (const uri of urls) {
        try {
            const response = await fetch(uri);

            if (!response.ok) {
                warnings.push(`Could not cache status-list credential ${uri}: HTTP ${response.status}`);
                continue;
            }

            results.push({ uri, content: (await response.json()) as JsonValue });
        } catch (error) {
            warnings.push(`Could not cache status-list credential ${uri}: ${safeMessage(error)}`);
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

    if (encrypt && !options.password) throw new Error('A password is required for LearnCard export');

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
        const path = encoded.encrypted && !entry.path.endsWith('.enc') ? `${entry.path}.enc` : entry.path;

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
    const seenUris = new Set<string>();

    for (const record of records) {
        if (seenUris.has(record.uri)) continue;

        seenUris.add(record.uri);

        const entryWarnings: string[] = [];
        const digest = sha256Hex(record.uri || record.id);

        try {
            const resolved = await wallet.read.get(record.uri);

            if (!resolved) {
                warnings.push(`Could not resolve wallet index URI ${record.uri}`);
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
            warnings.push(`Could not export wallet index URI ${record.uri}: ${safeMessage(error)}`);
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
        warnings
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
