import type { LearnCardBundleEntryMetadata, LearnCardBundleManifest } from './types';
import { stableStringify, sha256Hex } from './crypto';

export const SPEC_VERSION = '1.0.0' as const;

export const BUNDLE_SPEC_MD = `# LearnCard Holder Continuity Bundle v1.0.0

A LearnCard holder continuity bundle is a ZIP file with readable metadata and encrypted holder payloads.

## Container

Required readable entries:

- \`manifest.json\` — inventory, hashes, warnings, and encryption metadata.
- \`README.md\` — human-readable recovery notes.
- \`BUNDLE_SPEC.md\` — this format description.

Sensitive entries use JSON encryption envelopes produced by \`@learncard/sss-key-manager\` \`encryptWithPassword\`: Argon2id key derivation and AES-GCM authenticated encryption. The ZIP itself is not password encrypted.

## Paths

- \`keys/recovery-phrase.txt.enc\`
- \`keys/private-key-seed.txt.enc\`
- \`keys/jwks.json.enc\`
- \`keys/did-document.json\`
- \`credentials/<sha256>.json.enc\`
- \`presentations/<sha256>.json.enc\`
- \`index-records/<sha256>.json.enc\`
- \`consent-records/<sha256>.json.enc\`
- \`status-cache/<sha256>.json.enc\`

Debug exports MAY use plaintext payloads by setting \`encrypt: false\`; production exports MUST encrypt sensitive payloads.

## Manifest hashing

Each \`contents[]\` entry contains the SHA-256 hash of the bytes stored at \`path\`. \`payloadSha256\` is SHA-256 over a deterministic JSON serialization of \`contents[]\` with entries sorted by path.

Each credential or presentation entry MAY reference an encrypted \`index-record\` companion entry via \`indexRecordRef\`; the readable manifest does not embed the original index record JSON.

## Restore vs import

\`restoreLearnCardFromBundle(...)\` decrypts \`keys/private-key-seed.txt.enc\` and passes that seed to \`initLearnCard(...)\`. It recreates the original wallet identity; it does not upload payloads or recreate index records.

\`importLearnCardBundle(...)\` decrypts credential and presentation payloads, uploads them to the target wallet's LearnCloud store, and recreates index records from the encrypted \`index-record\` companions.

## Import expectations

Importers MUST verify the stored bytes against each entry hash before trusting decrypted content. Importers SHOULD preserve issuer-signed credential and presentation payloads exactly.
`;

export const BUNDLE_README_MD = `# LearnCard Holder Continuity Export

This archive contains a point-in-time holder export from a LearnCard wallet.

Keep the password separately. Without it, encrypted credentials, key material, consent records, and status-list snapshots cannot be recovered.

The readable manifest lists every payload and its SHA-256 hash. Third-party wallets can import individual W3C Verifiable Credentials or Verifiable Presentations from the decrypted JSON files even when they do not support the LearnCard ZIP bundle directly.
`;

export const sortContents = (
    contents: LearnCardBundleEntryMetadata[]
): LearnCardBundleEntryMetadata[] => [...contents].sort((a, b) => a.path.localeCompare(b.path));

const normalizeContents = (contents: LearnCardBundleEntryMetadata[]): LearnCardBundleEntryMetadata[] =>
    JSON.parse(JSON.stringify(sortContents(contents))) as LearnCardBundleEntryMetadata[];

export const computePayloadSha256 = (contents: LearnCardBundleEntryMetadata[]): string =>
    sha256Hex(stableStringify(normalizeContents(contents)));

export const finalizeManifest = (
    manifest: Omit<LearnCardBundleManifest, 'payloadSha256'>
): LearnCardBundleManifest => ({
    ...manifest,
    contents: normalizeContents(manifest.contents),
    payloadSha256: computePayloadSha256(manifest.contents),
});

export const assertValidManifest = (manifest: LearnCardBundleManifest): void => {
    if (manifest.specVersion !== SPEC_VERSION) {
        throw new Error(`Unsupported LearnCard bundle version: ${manifest.specVersion}`);
    }

    const expected = computePayloadSha256(manifest.contents);

    if (manifest.payloadSha256 !== expected) throw new Error('LearnCard bundle manifest hash mismatch');
};
