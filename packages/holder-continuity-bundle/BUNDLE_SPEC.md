# LearnCard Holder Continuity Bundle v1.0.0

A LearnCard holder continuity bundle is a ZIP file with readable metadata and encrypted holder payloads.

## Container

Required readable entries:

-   `manifest.json` — inventory, hashes, warnings, and encryption metadata.
-   `README.md` — human-readable recovery notes.
-   `BUNDLE_SPEC.md` — this format description.

Sensitive entries use JSON encryption envelopes produced by `@learncard/sss-key-manager` `encryptWithPassword`: Argon2id key derivation and AES-GCM authenticated encryption. The ZIP itself is not password encrypted.

## Security model

A holder continuity bundle exports the wallet's full raw private-key seed at `keys/private-key-seed.txt.enc`. This is a deliberate trade-off that prioritizes holder self-custody and a zero-cooperation exit path over the live wallet's threshold model.

LearnCard's live wallet protects the key with 2-of-4 Shamir Secret Sharing (device, auth, recovery, and email shares), where no single share can reconstruct the key. The bundle does **not** preserve that threshold property: the exported seed alone is sufficient to reconstruct the key and DID and take full control of the identity. The bundle password (Argon2id + AES-256-GCM) is therefore the only barrier protecting the seed.

Consequences:

-   Anyone who obtains both the bundle and its password gains complete control of the wallet, bypassing SSS entirely.
-   The `keys/recovery-phrase.txt.enc` entry is derived from the current SSS recovery share. It is provided for reference and is **not** independently sufficient to recover the key on its own; recovery from a bundle uses the exported seed.
-   Treat the bundle like a password-vault backup: store it offline, use a strong unique password, and rotate the wallet if the bundle is exposed.

## Paths

-   `keys/recovery-phrase.txt.enc`
-   `keys/private-key-seed.txt.enc`
-   `keys/jwks.json.enc`
-   `keys/did-document.json`
-   `credentials/<sha256>.json.enc`
-   `presentations/<sha256>.json.enc`
-   `index-records/<sha256>.json.enc`
-   `consent-records/<sha256>.json.enc`
-   `status-cache/<sha256>.json.enc`

Debug exports MAY use plaintext payloads by setting `encrypt: false`; production exports MUST encrypt sensitive payloads.

Status-list snapshot fetching is HTTPS-only and rejects private, loopback, link-local, and single-label hosts. Exporters SHOULD keep the default timeout and response-size caps unless they are running in a trusted local environment.

## Manifest hashing

Each `contents[]` entry contains the SHA-256 hash of the bytes stored at `path`. `payloadSha256` is SHA-256 over a deterministic JSON serialization of `contents[]` with entries sorted by path.

Each credential or presentation entry MAY reference an encrypted `index-record` companion entry via `indexRecordRef`; the readable manifest does not embed the original index record JSON.

## Restore vs import

`restoreLearnCardFromBundle(...)` decrypts `keys/private-key-seed.txt.enc` and passes that seed to `initLearnCard(...)`. It recreates the original wallet identity; it does not upload payloads or recreate index records.

`importLearnCardBundle(...)` decrypts credential and presentation payloads, uploads them to the target wallet's LearnCloud store, and recreates index records from the encrypted `index-record` companions.

Import writes bundle contents into the target wallet. A bundle author who knows the password can include arbitrary credentials, presentations, and index metadata. Use `verifyBeforeImport: true` to verify VC/VP signatures before upload when the target wallet exposes `invoke.verifyCredential` and `invoke.verifyPresentation`.

## Size limits

Readers enforce default compressed-bundle, per-entry, and JSON parse limits to avoid accidentally processing oversized ZIP or JSON payloads. Callers can override these with `maxBundleBytes`, `maxEntryBytes`, and `maxJsonBytes` for trusted local workflows.

## Import expectations

Importers MUST verify the stored bytes against each entry hash before trusting decrypted content. Importers SHOULD verify issuer signatures before upload and preserve issuer-signed credential and presentation payloads exactly.
