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

const parseJson = (content: string): JsonValue => JSON.parse(content) as JsonValue;

const safeMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));
const parseObject = (content: string): Record<string, unknown> => {
    const value = parseJson(content);

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Expected bundle metadata entry to contain a JSON object');
    }

    return value as Record<string, unknown>;
};


const isImportableCredentialEntry = (entry: LearnCardBundleEntryMetadata): boolean =>
    entry.type === 'credential' || entry.type === 'presentation';

export const readLearnCardBundleData = async (
    data: Buffer,
    options: ReadLearnCardBundleOptions = {}
): Promise<ReadLearnCardBundleResult> => {
    const zip = await JSZip.loadAsync(data);
    const manifestFile = zip.file('manifest.json');

    if (!manifestFile) throw new Error('LearnCard bundle is missing manifest.json');

    const manifest = JSON.parse(await manifestFile.async('string')) as LearnCardBundleManifest;

    assertValidManifest(manifest);

    const warnings = [...manifest.warnings];
    const entries: ReadLearnCardBundleResult['entries'] = [];
    const shouldDecrypt = options.decrypt ?? true;

    for (const entry of manifest.contents) {
        const file = zip.file(entry.path);

        if (!file) throw new Error(`LearnCard bundle is missing ${entry.path}`);

        const stored = await file.async('string');
        const actualSha = sha256Hex(stored);

        if (actualSha !== entry.sha256) {
            throw new Error(`SHA-256 mismatch for ${entry.path}`);
        }

        entries.push({
            ...entry,
            content: shouldDecrypt
                ? await decodePayload(stored, { encrypted: entry.encrypted, password: options.password })
                : stored,
        });
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
    const report: ImportLearnCardBundleReport = {
        importedCredentials: 0,
        importedPresentations: 0,
        skipped: 0,
        errors: [],
        warnings: [...bundle.warnings],
    };

    const entriesById = new Map(bundle.entries.map(entry => [entry.id, entry]));

    for (const entry of bundle.entries) {
        if (!isImportableCredentialEntry(entry)) {
            report.skipped += 1;
            continue;
        }

        try {
            const content = parseJson(entry.content);
            const upload =
                options.wallet.store.LearnCloud.uploadEncrypted ?? options.wallet.store.LearnCloud.upload;

            if (!upload) throw new Error('Target wallet does not expose a LearnCloud upload method');

            const uri = await upload(content);
            const referencedIndexRecord = entry.indexRecordRef
                ? entriesById.get(entry.indexRecordRef)
                : undefined;

            if (entry.indexRecordRef && !referencedIndexRecord) {
                throw new Error(`Referenced index record ${entry.indexRecordRef} is missing`);
            }

            const indexRecord = referencedIndexRecord
                ? parseObject(referencedIndexRecord.content)
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
