import { readFile } from 'node:fs/promises';

import JSZip from 'jszip';

import type {
    ImportLearnCardBundleOptions,
    ImportLearnCardBundleReport,
    JsonValue,
    LearnCardBundleEntryMetadata,
    LearnCardBundleManifest,
    ReadLearnCardBundleOptions,
    ReadLearnCardBundleResult,
} from './types';
import { assertValidManifest } from './manifest';
import { decodePayload, sha256Hex } from './crypto';

const DEFAULT_MAX_BUNDLE_BYTES = 100 * 1024 * 1024;
const DEFAULT_MAX_ENTRY_BYTES = 25 * 1024 * 1024;
const DEFAULT_MAX_JSON_BYTES = 25 * 1024 * 1024;

const byteLength = (content: string): number => Buffer.byteLength(content, 'utf8');

const assertSize = (label: string, size: number, max: number): void => {
    if (size > max) throw new Error(`${label} exceeds ${max} bytes`);
};

const parseJson = (content: string, label: string, maxBytes: number): JsonValue => {
    assertSize(label, byteLength(content), maxBytes);

    return JSON.parse(content) as JsonValue;
};

const safeMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

const parseObject = (content: string, label: string, maxBytes: number): Record<string, unknown> => {
    const value = parseJson(content, label, maxBytes);

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Expected bundle metadata entry to contain a JSON object');
    }

    return value as Record<string, unknown>;
};

const isImportableCredentialEntry = (entry: LearnCardBundleEntryMetadata): boolean =>
    entry.type === 'credential' || entry.type === 'presentation';

const isFailedVerification = (result: unknown): boolean => {
    if (Array.isArray(result)) {
        return result.some(item => {
            if (!item || typeof item !== 'object') return true;

            const status = 'status' in item ? item.status : undefined;

            return status === 'Failed' || status === 'Error';
        });
    }

    if (!result || typeof result !== 'object') return true;

    const errors = 'errors' in result ? result.errors : undefined;

    return !Array.isArray(errors) || errors.length > 0;
};

const verifyImportableEntry = async (
    entry: LearnCardBundleEntryMetadata,
    content: JsonValue,
    options: ImportLearnCardBundleOptions
): Promise<void> => {
    if (!options.verifyBeforeImport) return;

    if (entry.type === 'credential') {
        if (!options.wallet.invoke.verifyCredential) {
            throw new Error('Target wallet does not expose invoke.verifyCredential');
        }

        const verification = await options.wallet.invoke.verifyCredential(content);

        if (isFailedVerification(verification)) throw new Error('Credential verification failed');

        return;
    }

    if (!options.wallet.invoke.verifyPresentation) {
        throw new Error('Target wallet does not expose invoke.verifyPresentation');
    }

    const verification = await options.wallet.invoke.verifyPresentation(content);

    if (isFailedVerification(verification)) throw new Error('Presentation verification failed');
};

export const readLearnCardBundleData = async (
    data: Buffer,
    options: ReadLearnCardBundleOptions = {}
): Promise<ReadLearnCardBundleResult> => {
    const maxBundleBytes = options.maxBundleBytes ?? DEFAULT_MAX_BUNDLE_BYTES;
    const maxEntryBytes = options.maxEntryBytes ?? DEFAULT_MAX_ENTRY_BYTES;
    const maxJsonBytes = options.maxJsonBytes ?? DEFAULT_MAX_JSON_BYTES;

    assertSize('LearnCard bundle', data.byteLength, maxBundleBytes);

    const zip = await JSZip.loadAsync(data);
    const manifestFile = zip.file('manifest.json');

    if (!manifestFile) throw new Error('LearnCard bundle is missing manifest.json');

    const manifestContent = await manifestFile.async('string');

    assertSize('manifest.json', byteLength(manifestContent), maxJsonBytes);

    const manifest = JSON.parse(manifestContent) as LearnCardBundleManifest;

    assertValidManifest(manifest);

    const warnings = [...manifest.warnings];
    const entries: ReadLearnCardBundleResult['entries'] = [];
    const shouldDecrypt = options.decrypt ?? true;
    let totalEntryBytes = 0;

    for (const entry of manifest.contents) {
        const file = zip.file(entry.path);

        if (!file) throw new Error(`LearnCard bundle is missing ${entry.path}`);

        const stored = await file.async('string');
        const storedBytes = byteLength(stored);

        assertSize(entry.path, storedBytes, maxEntryBytes);

        totalEntryBytes += storedBytes;
        assertSize('LearnCard bundle entries', totalEntryBytes, maxBundleBytes);

        const actualSha = sha256Hex(stored);

        if (actualSha !== entry.sha256) {
            throw new Error(`SHA-256 mismatch for ${entry.path}`);
        }

        const content = shouldDecrypt
            ? await decodePayload(stored, {
                  encrypted: entry.encrypted,
                  password: options.password,
              })
            : stored;

        assertSize(`${entry.path} content`, byteLength(content), maxEntryBytes);

        entries.push({ ...entry, content });
    }

    return { manifest, entries, warnings };
};

export const readLearnCardBundle = async (
    path: string,
    options: ReadLearnCardBundleOptions = {}
): Promise<ReadLearnCardBundleResult> => readLearnCardBundleData(await readFile(path), options);

export const importLearnCardBundle = async (
    path: string,
    options: ImportLearnCardBundleOptions
): Promise<ImportLearnCardBundleReport> => {
    const bundle = await readLearnCardBundle(path, options);
    const maxJsonBytes = options.maxJsonBytes ?? DEFAULT_MAX_JSON_BYTES;
    const report: ImportLearnCardBundleReport = {
        importedCredentials: 0,
        importedPresentations: 0,
        skipped: 0,
        skippedByType: {},
        errors: [],
        warnings: [...bundle.warnings],
    };

    if (!options.verifyBeforeImport) {
        report.warnings.push(
            'Bundle credential signatures were not verified before import; only import bundles from sources you trust.'
        );
    }

    const entriesById = new Map(bundle.entries.map(entry => [entry.id, entry]));

    for (const entry of bundle.entries) {
        if (!isImportableCredentialEntry(entry)) {
            report.skipped += 1;
            report.skippedByType[entry.type] = (report.skippedByType[entry.type] ?? 0) + 1;
            continue;
        }

        try {
            const content = parseJson(entry.content, entry.path, maxJsonBytes);

            await verifyImportableEntry(entry, content, options);

            const upload =
                options.wallet.store.LearnCloud.uploadEncrypted ??
                options.wallet.store.LearnCloud.upload;

            if (!upload)
                throw new Error('Target wallet does not expose a LearnCloud upload method');

            const uri = await upload(content);
            const referencedIndexRecord = entry.indexRecordRef
                ? entriesById.get(entry.indexRecordRef)
                : undefined;

            if (entry.indexRecordRef && !referencedIndexRecord) {
                throw new Error(`Referenced index record ${entry.indexRecordRef} is missing`);
            }

            const indexRecord = referencedIndexRecord
                ? parseObject(
                      referencedIndexRecord.content,
                      referencedIndexRecord.path,
                      maxJsonBytes
                  )
                : { id: entry.id, uri };
            const recordId = typeof indexRecord.id === 'string' ? indexRecord.id : entry.id;

            await options.wallet.index.LearnCloud.add({
                ...indexRecord,
                id: recordId,
                uri,
                sourceExport: {
                    manifestCreatedAt: bundle.manifest.createdAt,
                    sourceUri: entry.sourceUri,
                    sourcePath: entry.path,
                    credentialId: entry.credentialId,
                },
            });

            if (entry.type === 'presentation') report.importedPresentations += 1;
            else report.importedCredentials += 1;
        } catch (error) {
            report.errors.push({ path: entry.path, message: safeMessage(error) });
        }
    }

    return report;
};
