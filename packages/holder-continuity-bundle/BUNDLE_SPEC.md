# LearnCard Holder Continuity Bundle v1.0.0

A LearnCard holder continuity bundle is a standard ZIP file with readable metadata and encrypted holder payloads.

## Container

Required readable entries:

- `manifest.json` — inventory, hashes, warnings, and encryption metadata.
- `README.md` — human-readable recovery notes.
- `BUNDLE_SPEC.md` — this format description.

Sensitive entries use JSON encryption envelopes produced by `@learncard/sss-key-manager` `encryptWithPassword`: Argon2id key derivation and AES-GCM authenticated encryption. The ZIP itself is not password encrypted.

## Paths

- `keys/recovery-phrase.txt.enc`
- `keys/private-key-seed.txt.enc`
- `keys/jwks.json.enc`
- `keys/did-document.json`
- `credentials/<sha256>.json.enc`
- `presentations/<sha256>.json.enc`
- `index-records/<sha256>.json.enc`
- `consent-records/<sha256>.json.enc`
- `status-cache/<sha256>.json.enc`

Debug exports may use plaintext payloads by setting `encrypt: false`; production exports must encrypt sensitive payloads.

## Manifest hashing

Each `contents[]` entry contains the SHA-256 hash of the bytes stored at `path`. `payloadSha256` is SHA-256 over a deterministic JSON serialization of `contents[]` with entries sorted by path.
Each credential or presentation entry may reference an encrypted `index-record` companion entry via `indexRecordRef`; the readable manifest does not embed the original index record JSON.


## Import expectations

Importers must verify the stored bytes against each entry hash before trusting decrypted content. Importers should preserve issuer-signed credential and presentation payloads exactly.
