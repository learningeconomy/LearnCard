"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  assertValidManifest: () => assertValidManifest,
  computePayloadSha256: () => computePayloadSha256,
  createLearnCardBundle: () => createLearnCardBundle,
  exportLearnCardBundle: () => exportLearnCardBundle,
  finalizeManifest: () => finalizeManifest,
  importLearnCardBundle: () => importLearnCardBundle,
  readLearnCardBundle: () => readLearnCardBundle,
  readLearnCardBundleData: () => readLearnCardBundleData,
  readLearnCardBundleSeed: () => readLearnCardBundleSeed,
  readLearnCardBundleSeedData: () => readLearnCardBundleSeedData,
  restoreLearnCardFromBundle: () => restoreLearnCardFromBundle,
  restoreLearnCardFromBundleData: () => restoreLearnCardFromBundleData
});
module.exports = __toCommonJS(index_exports);

// src/exportBundle.ts
var import_promises = require("node:dns/promises");
var import_promises2 = require("node:fs/promises");
var import_node_net = require("node:net");
var import_node_path = require("node:path");
var import_jszip = __toESM(require("jszip"));
var import_sss_key_manager2 = require("@learncard/sss-key-manager");

// src/crypto.ts
var import_node_crypto = require("node:crypto");
var import_sss_key_manager = require("@learncard/sss-key-manager");
var sha256Hex = /* @__PURE__ */ __name((bytes) => (0, import_node_crypto.createHash)("sha256").update(bytes).digest("hex"), "sha256Hex");
var stableStringify = /* @__PURE__ */ __name((value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const object = value;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`).join(",")}}`;
}, "stableStringify");
var encodePayload = /* @__PURE__ */ __name(async (plaintext, options) => {
  if (!options.encrypt) return { stored: plaintext, encrypted: false };
  if (!options.password) throw new Error("A password is required for encrypted LearnCard exports");
  return {
    stored: JSON.stringify(await (0, import_sss_key_manager.encryptWithPassword)(plaintext, options.password), null, 2),
    encrypted: true
  };
}, "encodePayload");
var decodePayload = /* @__PURE__ */ __name(async (stored, options) => {
  if (!options.encrypted) return stored;
  if (!options.password) throw new Error("A password is required to decrypt this LearnCard export");
  const envelope = JSON.parse(stored);
  return (0, import_sss_key_manager.decryptWithPassword)(
    envelope.ciphertext,
    envelope.iv,
    envelope.salt,
    options.password,
    envelope.kdfParams
  );
}, "decodePayload");

// src/manifest.ts
var SPEC_VERSION = "1.0.0";
var BUNDLE_SPEC_MD = `# LearnCard Holder Continuity Bundle v1.0.0

A LearnCard holder continuity bundle is a ZIP file with readable metadata and encrypted holder payloads.

## Container

Required readable entries:

- \`manifest.json\` \u2014 inventory, hashes, warnings, and encryption metadata.
- \`README.md\` \u2014 human-readable recovery notes.
- \`BUNDLE_SPEC.md\` \u2014 this format description.

Sensitive entries use JSON encryption envelopes produced by \`@learncard/sss-key-manager\` \`encryptWithPassword\`: Argon2id key derivation and AES-GCM authenticated encryption. The ZIP itself is not password encrypted.

## Security model

This bundle exports the wallet's full raw private-key seed at \`keys/private-key-seed.txt.enc\`. LearnCard's live wallet protects the key with 2-of-4 Shamir Secret Sharing, where no single share can reconstruct it. The bundle does NOT preserve that threshold: the exported seed alone is sufficient to take full control of the identity, and the bundle password is the only barrier protecting it. \`keys/recovery-phrase.txt.enc\` is derived from the current recovery share for reference and is not independently sufficient to recover the key. Treat the bundle like a password-vault backup, use a strong unique password, and rotate the wallet if the bundle is exposed.

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

Status-list snapshot fetching is HTTPS-only and rejects private, loopback, link-local, and single-label hosts. Exporters SHOULD keep the default timeout and response-size caps unless they are running in a trusted local environment.

## Manifest hashing

Each \`contents[]\` entry contains the SHA-256 hash of the bytes stored at \`path\`. \`payloadSha256\` is SHA-256 over a deterministic JSON serialization of \`contents[]\` with entries sorted by path.

Each credential or presentation entry MAY reference an encrypted \`index-record\` companion entry via \`indexRecordRef\`; the readable manifest does not embed the original index record JSON.

## Restore vs import

\`restoreLearnCardFromBundle(...)\` decrypts \`keys/private-key-seed.txt.enc\` and passes that seed to \`initLearnCard(...)\`. It recreates the original wallet identity; it does not upload payloads or recreate index records.

\`importLearnCardBundle(...)\` decrypts credential and presentation payloads, uploads them to the target wallet's LearnCloud store, and recreates index records from the encrypted \`index-record\` companions.

Import writes bundle contents into the target wallet. A bundle author who knows the password can include arbitrary credentials, presentations, and index metadata. Use \`verifyBeforeImport: true\` to verify VC/VP signatures before upload when the target wallet exposes \`invoke.verifyCredential\` and \`invoke.verifyPresentation\`.

## Size limits

Readers enforce default compressed-bundle, per-entry, and JSON parse limits to avoid accidentally processing oversized ZIP or JSON payloads. Callers can override these with \`maxBundleBytes\`, \`maxEntryBytes\`, and \`maxJsonBytes\` for trusted local workflows.

## Import expectations

Importers MUST verify the stored bytes against each entry hash before trusting decrypted content. Importers SHOULD verify issuer signatures before upload and preserve issuer-signed credential and presentation payloads exactly.
`;
var BUNDLE_README_MD = `# LearnCard Holder Continuity Export

This archive contains a point-in-time holder export from a LearnCard wallet.

Keep the password separately. Without it, encrypted credentials, key material, consent records, and status-list snapshots cannot be recovered.

This archive contains your full private-key seed (encrypted). Anyone with both this file and its password can take complete control of your wallet identity, so store it like a password-vault backup and rotate your wallet if it is exposed.

The readable manifest lists every payload and its SHA-256 hash. Third-party wallets can import individual W3C Verifiable Credentials or Verifiable Presentations from the decrypted JSON files even when they do not support the LearnCard ZIP bundle directly.
`;
var sortContents = /* @__PURE__ */ __name((contents) => [...contents].sort((a, b) => a.path.localeCompare(b.path)), "sortContents");
var normalizeContents = /* @__PURE__ */ __name((contents) => JSON.parse(JSON.stringify(sortContents(contents))), "normalizeContents");
var computePayloadSha256 = /* @__PURE__ */ __name((contents) => sha256Hex(stableStringify(normalizeContents(contents))), "computePayloadSha256");
var finalizeManifest = /* @__PURE__ */ __name((manifest) => ({
  ...manifest,
  contents: normalizeContents(manifest.contents),
  payloadSha256: computePayloadSha256(manifest.contents)
}), "finalizeManifest");
var assertValidManifest = /* @__PURE__ */ __name((manifest) => {
  if (manifest.specVersion !== SPEC_VERSION) {
    throw new Error(`Unsupported LearnCard bundle version: ${manifest.specVersion}`);
  }
  const expected = computePayloadSha256(manifest.contents);
  if (manifest.payloadSha256 !== expected)
    throw new Error("LearnCard bundle manifest hash mismatch");
}, "assertValidManifest");

// src/exportBundle.ts
var ZIP_DATE = /* @__PURE__ */ new Date("2024-01-01T00:00:00.000Z");
var DEFAULT_STATUS_LIST_FETCH_TIMEOUT_MS = 5e3;
var DEFAULT_MAX_STATUS_LIST_BYTES = 5 * 1024 * 1024;
var stripIpv6Brackets = /* @__PURE__ */ __name((hostname) => hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname, "stripIpv6Brackets");
var redactMalformedUrl = /* @__PURE__ */ __name((value) => {
  const queryIndex = value.indexOf("?");
  const ampIndex = value.indexOf("&");
  if (queryIndex === -1 && ampIndex === -1) return value;
  const redactionIndex = queryIndex === -1 ? ampIndex : ampIndex === -1 ? queryIndex : Math.min(queryIndex, ampIndex);
  return `${value.slice(0, redactionIndex)}?[redacted]`;
}, "redactMalformedUrl");
var redactUrl = /* @__PURE__ */ __name((value) => {
  try {
    const url = new URL(value);
    const hostname = stripIpv6Brackets(url.hostname.toLowerCase());
    const shouldRedactHost = !hostname.includes(".") || hostname === "localhost" || hostname.endsWith(".localhost") || Boolean((0, import_node_net.isIP)(hostname) && isPrivateAddress(hostname));
    const host = shouldRedactHost ? "[redacted-host]" : url.host;
    return `${url.protocol}//${host}${url.pathname}${url.search ? "?[redacted]" : ""}`;
  } catch {
    return redactMalformedUrl(value);
  }
}, "redactUrl");
var urlEndDelimiters = /* @__PURE__ */ new Set([" ", "\n", "\r", "	", "'", '"', "<", ">"]);
var findNextUrlStart = /* @__PURE__ */ __name((value, fromIndex) => {
  const httpIndex = value.indexOf("http://", fromIndex);
  const httpsIndex = value.indexOf("https://", fromIndex);
  if (httpIndex === -1) return httpsIndex;
  if (httpsIndex === -1) return httpIndex;
  return Math.min(httpIndex, httpsIndex);
}, "findNextUrlStart");
var findUrlEnd = /* @__PURE__ */ __name((value, fromIndex) => {
  let index = fromIndex;
  while (index < value.length && !urlEndDelimiters.has(value[index])) index += 1;
  return index;
}, "findUrlEnd");
var redactText = /* @__PURE__ */ __name((value) => {
  let redacted = "";
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
}, "redactText");
var safeMessage = /* @__PURE__ */ __name((error) => redactText(error instanceof Error ? error.message : String(error)), "safeMessage");
var isPrivateIPv4 = /* @__PURE__ */ __name((address) => {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255))
    return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}, "isPrivateIPv4");
var isPrivateIPv6 = /* @__PURE__ */ __name((address) => {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb"))
    return true;
  const ipv4Mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return ipv4Mapped ? isPrivateIPv4(ipv4Mapped[1]) : false;
}, "isPrivateIPv6");
var isPrivateAddress = /* @__PURE__ */ __name((address) => {
  const version = (0, import_node_net.isIP)(address);
  if (version === 4) return isPrivateIPv4(address);
  if (version === 6) return isPrivateIPv6(address);
  return true;
}, "isPrivateAddress");
var assertPublicHttpsUrl = /* @__PURE__ */ __name(async (uri) => {
  const url = new URL(uri);
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (url.protocol !== "https:") throw new Error("status-list URL must use https");
  if (!hostname.includes(".") || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("status-list URL host must be public");
  }
  if ((0, import_node_net.isIP)(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("status-list URL host must be public");
    return url;
  }
  const addresses = await (0, import_promises.lookup)(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some((address) => isPrivateAddress(address.address))) {
    throw new Error("status-list URL host must resolve to public addresses");
  }
  return url;
}, "assertPublicHttpsUrl");
var readResponseText = /* @__PURE__ */ __name(async (response, maxBytes) => {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(`status-list response exceeds ${maxBytes} bytes`);
  }
  if (!response.body) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new Error(`status-list response exceeds ${maxBytes} bytes`);
    }
    return text;
  }
  const reader = response.body.getReader();
  const chunks = [];
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
  return Buffer.concat(chunks).toString("utf8");
}, "readResponseText");
var fetchJsonWithTimeout = /* @__PURE__ */ __name(async (url, timeoutMs, maxBytes) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return JSON.parse(await readResponseText(response, maxBytes));
  } finally {
    clearTimeout(timeout);
  }
}, "fetchJsonWithTimeout");
var isRecord = /* @__PURE__ */ __name((value) => Boolean(value) && typeof value === "object" && !Array.isArray(value), "isRecord");
var stringArrayIncludes = /* @__PURE__ */ __name((value, expected) => Array.isArray(value) && value.some((item) => item === expected), "stringArrayIncludes");
var json = /* @__PURE__ */ __name((value) => `${stableStringify(value)}
`, "json");
var classifyPayload = /* @__PURE__ */ __name((payload) => {
  if (!isRecord(payload)) return "unknown-json";
  if (stringArrayIncludes(payload.type, "VerifiablePresentation") || payload.type === "VerifiablePresentation") {
    return "presentation";
  }
  if (stringArrayIncludes(payload.type, "VerifiableCredential") || payload.type === "VerifiableCredential") {
    return "credential";
  }
  return "unknown-json";
}, "classifyPayload");
var pathForType = /* @__PURE__ */ __name((type, digest, encrypted) => {
  const suffix = encrypted ? ".enc" : "";
  if (type === "presentation") return `presentations/${digest}.json${suffix}`;
  if (type === "consent-record") return `consent-records/${digest}.json${suffix}`;
  if (type === "index-record") return `index-records/${digest}.json${suffix}`;
  if (type === "status-cache") return `status-cache/${digest}.json${suffix}`;
  return `credentials/${digest}.json${suffix}`;
}, "pathForType");
var getCredentialId = /* @__PURE__ */ __name((payload) => isRecord(payload) && typeof payload.id === "string" ? payload.id : void 0, "getCredentialId");
var addZipText = /* @__PURE__ */ __name((zip, path, content) => {
  zip.file(path, content, { date: ZIP_DATE });
}, "addZipText");
var collectDids = /* @__PURE__ */ __name((wallet, warnings) => {
  const dids = {};
  for (const method of [void 0, "key", "pkh:sol", "tz", "pkh:tz"]) {
    try {
      dids[method ?? "default"] = wallet.id.did(method);
    } catch (error) {
      warnings.push(
        `Could not derive DID method ${method ?? "default"}: ${safeMessage(error)}`
      );
    }
  }
  return dids;
}, "collectDids");
var collectDidDocument = /* @__PURE__ */ __name(async (wallet, primaryDid, dids, warnings) => {
  if (!wallet.invoke.resolveDid) return { primaryDid, dids };
  try {
    return { primaryDid, dids, primaryDidDocument: await wallet.invoke.resolveDid(primaryDid) };
  } catch (error) {
    warnings.push(`Could not resolve primary DID document: ${safeMessage(error)}`);
    return { primaryDid, dids };
  }
}, "collectDidDocument");
var collectKeyPayloads = /* @__PURE__ */ __name(async (wallet, warnings) => {
  const payloads = [];
  if (wallet.invoke.getKey) {
    try {
      const seed = wallet.invoke.getKey();
      const shares = await (0, import_sss_key_manager2.splitPrivateKey)(seed);
      payloads.push({
        path: "keys/private-key-seed.txt",
        type: "key-private-seed",
        content: `${seed}
`,
        encrypted: true
      });
      payloads.push({
        path: "keys/recovery-phrase.txt",
        type: "key-recovery-phrase",
        content: `${await (0, import_sss_key_manager2.shareToRecoveryPhrase)(shares.recoveryShare)}
`,
        encrypted: true
      });
    } catch (error) {
      warnings.push(`Could not export seed or recovery phrase: ${safeMessage(error)}`);
    }
  } else {
    warnings.push(
      "Wallet does not expose invoke.getKey(); private seed and recovery phrase were not exported"
    );
  }
  if (wallet.id.keypair) {
    const jwks = {};
    for (const algorithm of ["ed25519", "secp256k1"]) {
      try {
        jwks[algorithm] = wallet.id.keypair(algorithm);
      } catch (error) {
        warnings.push(`Could not export ${algorithm} JWK: ${safeMessage(error)}`);
      }
    }
    if (Object.keys(jwks).length > 0) {
      payloads.push({
        path: "keys/jwks.json",
        type: "key-jwks",
        content: json(jwks),
        encrypted: true
      });
    }
  } else {
    warnings.push("Wallet does not expose id.keypair(); JWK key export was skipped");
  }
  return payloads;
}, "collectKeyPayloads");
var extractStatusListUrls = /* @__PURE__ */ __name((payload) => {
  if (!isRecord(payload)) return [];
  const statuses = Array.isArray(payload.credentialStatus) ? payload.credentialStatus : payload.credentialStatus ? [payload.credentialStatus] : [];
  return statuses.flatMap(
    (status) => isRecord(status) && typeof status.statusListCredential === "string" ? [status.statusListCredential] : []
  );
}, "extractStatusListUrls");
var collectStatusLists = /* @__PURE__ */ __name(async (payloads, enabled, warnings, timeoutMs = DEFAULT_STATUS_LIST_FETCH_TIMEOUT_MS, maxBytes = DEFAULT_MAX_STATUS_LIST_BYTES) => {
  if (!enabled) return [];
  const urls = [...new Set(payloads.flatMap(extractStatusListUrls))];
  const results = [];
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
}, "collectStatusLists");
var collectConsentRecords = /* @__PURE__ */ __name(async (wallet, warnings) => {
  if (wallet.invoke.getHolderExportMetadata) {
    try {
      const metadata = await wallet.invoke.getHolderExportMetadata();
      if (isRecord(metadata) && Array.isArray(metadata.warnings)) {
        warnings.push(
          ...metadata.warnings.filter((warning) => typeof warning === "string").map((warning) => redactText(warning))
        );
      }
      return isRecord(metadata) && Array.isArray(metadata.consentRecords) ? metadata.consentRecords : [];
    } catch (error) {
      warnings.push(`Could not fetch holder export metadata: ${safeMessage(error)}`);
    }
  }
  if (!wallet.invoke.getConsentedContracts) return [];
  try {
    const response = await wallet.invoke.getConsentedContracts();
    if (!isRecord(response) || !Array.isArray(response.records)) return [];
    return response.records;
  } catch (error) {
    warnings.push(`Could not fetch consented contracts fallback: ${safeMessage(error)}`);
    return [];
  }
}, "collectConsentRecords");
var createLearnCardBundle = /* @__PURE__ */ __name(async (wallet, options = {}) => {
  const encrypt = options.encrypt ?? true;
  if (encrypt && !options.password)
    throw new Error("A password is required for LearnCard export");
  const warnings = [];
  const zip = new import_jszip.default();
  const contents = [];
  const primaryDid = wallet.id.did();
  const dids = collectDids(wallet, warnings);
  const didDocument = await collectDidDocument(wallet, primaryDid, dids, warnings);
  const credentialPayloads = [];
  const addStoredEntry = /* @__PURE__ */ __name(async (entry) => {
    const encoded = await encodePayload(entry.content, {
      encrypt: entry.encrypted && encrypt,
      password: options.password
    });
    const path = encoded.encrypted && !entry.path.endsWith(".enc") ? `${entry.path}.enc` : entry.path;
    addZipText(zip, path, encoded.stored);
    contents.push({
      id: entry.id,
      type: entry.type,
      path,
      mediaType: entry.mediaType ?? "application/json",
      sha256: sha256Hex(encoded.stored),
      encrypted: encoded.encrypted,
      sourceUri: entry.sourceUri,
      credentialId: entry.credentialId,
      indexRecordRef: entry.indexRecordRef,
      warnings: entry.warnings
    });
  }, "addStoredEntry");
  addZipText(zip, "README.md", BUNDLE_README_MD);
  addZipText(zip, "BUNDLE_SPEC.md", BUNDLE_SPEC_MD);
  await addStoredEntry({
    id: "did-document",
    type: "did-document",
    path: "keys/did-document.json",
    content: json(didDocument),
    encrypted: false
  });
  for (const payload of await collectKeyPayloads(wallet, warnings)) {
    await addStoredEntry({ ...payload, id: payload.path, mediaType: "text/plain" });
  }
  const records = await wallet.index.LearnCloud.get();
  for (const [recordIndex, record] of records.entries()) {
    const entryWarnings = [];
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
      if (type === "unknown-json") entryWarnings.push("Payload is not a recognized VC or VP");
      const indexRecordId = `urn:sha256:${digest}:index-record`;
      await addStoredEntry({
        id: indexRecordId,
        type: "index-record",
        path: pathForType("index-record", digest, encrypt),
        content: json(record),
        encrypted: true,
        sourceUri: record.uri,
        credentialId
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
        warnings: entryWarnings.length > 0 ? entryWarnings : void 0
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
      type: "consent-record",
      path: pathForType("consent-record", digest, encrypt),
      content: json(consentRecord),
      encrypted: true
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
      type: "status-cache",
      path: pathForType("status-cache", digest, encrypt),
      content: json(statusList.content),
      encrypted: true,
      sourceUri: statusList.uri
    });
  }
  const manifest = finalizeManifest({
    specVersion: SPEC_VERSION,
    createdAt: options.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    primaryDid,
    walletName: "LearnCard",
    encryption: encrypt ? {
      mode: "argon2id-aes-256-gcm",
      encryptedPayloads: true,
      envelope: "sss-key-manager-encryptWithPassword-v1",
      kdf: "argon2id",
      cipher: "AES-256-GCM"
    } : { mode: "none", encryptedPayloads: false },
    contents,
    warnings
  });
  addZipText(zip, "manifest.json", `${JSON.stringify(manifest, null, 2)}
`);
  return {
    data: await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
    manifest,
    warnings
  };
}, "createLearnCardBundle");
var exportLearnCardBundle = /* @__PURE__ */ __name(async (wallet, options) => {
  const bundle = await createLearnCardBundle(wallet, options);
  await (0, import_promises2.mkdir)((0, import_node_path.dirname)(options.out), { recursive: true });
  await (0, import_promises2.writeFile)(options.out, bundle.data);
  return bundle;
}, "exportLearnCardBundle");

// src/importBundle.ts
var import_promises3 = require("node:fs/promises");
var import_jszip2 = __toESM(require("jszip"));
var DEFAULT_MAX_BUNDLE_BYTES = 100 * 1024 * 1024;
var DEFAULT_MAX_ENTRY_BYTES = 25 * 1024 * 1024;
var DEFAULT_MAX_JSON_BYTES = 25 * 1024 * 1024;
var byteLength = /* @__PURE__ */ __name((content) => Buffer.byteLength(content, "utf8"), "byteLength");
var assertSize = /* @__PURE__ */ __name((label, size, max) => {
  if (size > max) throw new Error(`${label} exceeds ${max} bytes`);
}, "assertSize");
var parseJson = /* @__PURE__ */ __name((content, label, maxBytes) => {
  assertSize(label, byteLength(content), maxBytes);
  return JSON.parse(content);
}, "parseJson");
var safeMessage2 = /* @__PURE__ */ __name((error) => error instanceof Error ? error.message : String(error), "safeMessage");
var parseObject = /* @__PURE__ */ __name((content, label, maxBytes) => {
  const value = parseJson(content, label, maxBytes);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected bundle metadata entry to contain a JSON object");
  }
  return value;
}, "parseObject");
var isImportableCredentialEntry = /* @__PURE__ */ __name((entry) => entry.type === "credential" || entry.type === "presentation", "isImportableCredentialEntry");
var isFailedVerification = /* @__PURE__ */ __name((result) => {
  if (Array.isArray(result)) {
    return result.some((item) => {
      if (!item || typeof item !== "object") return true;
      const status = "status" in item ? item.status : void 0;
      return status === "Failed" || status === "Error";
    });
  }
  if (!result || typeof result !== "object") return true;
  const errors = "errors" in result ? result.errors : void 0;
  return !Array.isArray(errors) || errors.length > 0;
}, "isFailedVerification");
var verifyImportableEntry = /* @__PURE__ */ __name(async (entry, content, options) => {
  if (!options.verifyBeforeImport) return;
  if (entry.type === "credential") {
    if (!options.wallet.invoke.verifyCredential) {
      throw new Error("Target wallet does not expose invoke.verifyCredential");
    }
    const verification2 = await options.wallet.invoke.verifyCredential(content);
    if (isFailedVerification(verification2)) throw new Error("Credential verification failed");
    return;
  }
  if (!options.wallet.invoke.verifyPresentation) {
    throw new Error("Target wallet does not expose invoke.verifyPresentation");
  }
  const verification = await options.wallet.invoke.verifyPresentation(content);
  if (isFailedVerification(verification)) throw new Error("Presentation verification failed");
}, "verifyImportableEntry");
var readLearnCardBundleData = /* @__PURE__ */ __name(async (data, options = {}) => {
  const maxBundleBytes = options.maxBundleBytes ?? DEFAULT_MAX_BUNDLE_BYTES;
  const maxEntryBytes = options.maxEntryBytes ?? DEFAULT_MAX_ENTRY_BYTES;
  const maxJsonBytes = options.maxJsonBytes ?? DEFAULT_MAX_JSON_BYTES;
  assertSize("LearnCard bundle", data.byteLength, maxBundleBytes);
  const zip = await import_jszip2.default.loadAsync(data);
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) throw new Error("LearnCard bundle is missing manifest.json");
  const manifestContent = await manifestFile.async("string");
  assertSize("manifest.json", byteLength(manifestContent), maxJsonBytes);
  const manifest = JSON.parse(manifestContent);
  assertValidManifest(manifest);
  const warnings = [...manifest.warnings];
  const entries = [];
  const shouldDecrypt = options.decrypt ?? true;
  let totalEntryBytes = 0;
  for (const entry of manifest.contents) {
    const file = zip.file(entry.path);
    if (!file) throw new Error(`LearnCard bundle is missing ${entry.path}`);
    const stored = await file.async("string");
    const storedBytes = byteLength(stored);
    assertSize(entry.path, storedBytes, maxEntryBytes);
    totalEntryBytes += storedBytes;
    assertSize("LearnCard bundle entries", totalEntryBytes, maxBundleBytes);
    const actualSha = sha256Hex(stored);
    if (actualSha !== entry.sha256) {
      throw new Error(`SHA-256 mismatch for ${entry.path}`);
    }
    const content = shouldDecrypt ? await decodePayload(stored, {
      encrypted: entry.encrypted,
      password: options.password
    }) : stored;
    assertSize(`${entry.path} content`, byteLength(content), maxEntryBytes);
    entries.push({ ...entry, content });
  }
  return { manifest, entries, warnings };
}, "readLearnCardBundleData");
var readLearnCardBundle = /* @__PURE__ */ __name(async (path, options = {}) => readLearnCardBundleData(await (0, import_promises3.readFile)(path), options), "readLearnCardBundle");
var importLearnCardBundle = /* @__PURE__ */ __name(async (path, options) => {
  const bundle = await readLearnCardBundle(path, options);
  const maxJsonBytes = options.maxJsonBytes ?? DEFAULT_MAX_JSON_BYTES;
  const report = {
    importedCredentials: 0,
    importedPresentations: 0,
    skipped: 0,
    skippedByType: {},
    errors: [],
    warnings: [...bundle.warnings]
  };
  if (!options.verifyBeforeImport) {
    report.warnings.push(
      "Bundle credential signatures were not verified before import; only import bundles from sources you trust."
    );
  }
  const entriesById = new Map(bundle.entries.map((entry) => [entry.id, entry]));
  for (const entry of bundle.entries) {
    if (!isImportableCredentialEntry(entry)) {
      report.skipped += 1;
      report.skippedByType[entry.type] = (report.skippedByType[entry.type] ?? 0) + 1;
      continue;
    }
    try {
      const content = parseJson(entry.content, entry.path, maxJsonBytes);
      await verifyImportableEntry(entry, content, options);
      const upload = options.wallet.store.LearnCloud.uploadEncrypted ?? options.wallet.store.LearnCloud.upload;
      if (!upload)
        throw new Error("Target wallet does not expose a LearnCloud upload method");
      const uri = await upload(content);
      const referencedIndexRecord = entry.indexRecordRef ? entriesById.get(entry.indexRecordRef) : void 0;
      if (entry.indexRecordRef && !referencedIndexRecord) {
        throw new Error(`Referenced index record ${entry.indexRecordRef} is missing`);
      }
      const indexRecord = referencedIndexRecord ? parseObject(
        referencedIndexRecord.content,
        referencedIndexRecord.path,
        maxJsonBytes
      ) : { id: entry.id, uri };
      const recordId = typeof indexRecord.id === "string" ? indexRecord.id : entry.id;
      await options.wallet.index.LearnCloud.add({
        ...indexRecord,
        id: recordId,
        uri,
        sourceExport: {
          manifestCreatedAt: bundle.manifest.createdAt,
          sourceUri: entry.sourceUri,
          sourcePath: entry.path,
          credentialId: entry.credentialId
        }
      });
      if (entry.type === "presentation") report.importedPresentations += 1;
      else report.importedCredentials += 1;
    } catch (error) {
      report.errors.push({ path: entry.path, message: safeMessage2(error) });
    }
  }
  return report;
}, "importLearnCardBundle");

// src/restoreBundle.ts
var import_init = require("@learncard/init");
var getSeedEntry = /* @__PURE__ */ __name((bundle) => {
  const seedEntry = bundle.entries.find((entry) => entry.type === "key-private-seed");
  if (!seedEntry) {
    throw new Error(
      "LearnCard bundle does not contain key-private-seed and cannot be restored"
    );
  }
  const seed = seedEntry.content.trim();
  if (!/^[0-9a-f]{64}$/i.test(seed)) {
    throw new Error(
      "LearnCard bundle key-private-seed must be exactly 64 hexadecimal characters"
    );
  }
  return seed;
}, "getSeedEntry");
var readLearnCardBundleSeedData = /* @__PURE__ */ __name(async (data, options = {}) => getSeedEntry(await readLearnCardBundleData(data, options)), "readLearnCardBundleSeedData");
var readLearnCardBundleSeed = /* @__PURE__ */ __name(async (path, options = {}) => getSeedEntry(await readLearnCardBundle(path, options)), "readLearnCardBundleSeed");
var restoreLearnCardFromBundleData = /* @__PURE__ */ __name(async (data, options) => {
  const seed = await readLearnCardBundleSeedData(data, options);
  return (0, import_init.initLearnCard)({ ...options.init, seed });
}, "restoreLearnCardFromBundleData");
var restoreLearnCardFromBundle = /* @__PURE__ */ __name(async (path, options) => {
  const seed = await readLearnCardBundleSeed(path, options);
  return (0, import_init.initLearnCard)({ ...options.init, seed });
}, "restoreLearnCardFromBundle");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assertValidManifest,
  computePayloadSha256,
  createLearnCardBundle,
  exportLearnCardBundle,
  finalizeManifest,
  importLearnCardBundle,
  readLearnCardBundle,
  readLearnCardBundleData,
  readLearnCardBundleSeed,
  readLearnCardBundleSeedData,
  restoreLearnCardFromBundle,
  restoreLearnCardFromBundleData
});
//# sourceMappingURL=holder-continuity.cjs.development.js.map
