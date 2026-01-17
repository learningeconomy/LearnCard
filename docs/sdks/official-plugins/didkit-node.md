---
description: High-performance native Node.js DIDKit plugin using N-API
---

# DIDKit Node (Native)

## Overview

`@learncard/didkit-plugin-node` is a **high-performance native Node.js plugin** that provides the same DID and Verifiable Credential functionality as the standard WASM-based DIDKit plugin, but compiled directly to native code using Rust and N-API.

This plugin is ideal for **server-side applications** where performance is critical, such as credential issuance services, verification endpoints, and batch processing workflows.

{% hint style="info" %}
**When to use this plugin:**

-   ✅ Node.js server applications (Express, Fastify, NestJS, etc.)
-   ✅ Serverless functions (AWS Lambda, Vercel, etc.)
-   ✅ CLI tools and scripts
-   ✅ High-throughput credential processing

**When to use the WASM plugin instead:**

-   Browser applications
-   React Native / mobile apps
-   Environments without native compilation support
    {% endhint %}

## Installation

```bash
pnpm i @learncard/didkit-plugin-node
```

{% hint style="warning" %}
This package includes prebuilt binaries for common platforms (Linux x64, macOS x64/ARM64, Windows x64). If your platform isn't supported, you'll need Rust installed to compile from source during installation.
{% endhint %}

## Usage

### Basic Setup

```typescript
import { initLearnCard } from '@learncard/init';
import { getDidKitPlugin } from '@learncard/didkit-plugin-node';

// Replace the default WASM plugin with the native plugin
const learnCard = await initLearnCard({ seed: 'your-seed-phrase', didkit: 'node' });

// Or use it directly
const didKitPlugin = await getDidKitPlugin();
const learnCard = await (await initLearnCard({ custom: true })).addPlugin(await getDidKitPlugin());
```

### Configuration Options

```typescript
const didKitPlugin = await getDidKitPlugin(
    undefined, // InitInput (optional, for WASM compatibility)
    false // allowRemoteContexts - whether to fetch unknown JSON-LD contexts
);
```

| Parameter             | Type        | Default     | Description                                                             |
| --------------------- | ----------- | ----------- | ----------------------------------------------------------------------- |
| `input`               | `InitInput` | `undefined` | Optional initialization input (for API compatibility with WASM version) |
| `allowRemoteContexts` | `boolean`   | `false`     | Whether to allow fetching unknown JSON-LD contexts over HTTP            |

## Features

### Embedded JSON-LD Contexts

Like the WASM version, the native plugin uses SSI's **50+ embedded JSON-LD contexts**. Both versions avoid HTTP requests for common contexts:

-   W3C Credentials v1/v2
-   W3C Security contexts
-   DID Core contexts
-   Open Badges v2/v3
-   CLR v2
-   LearnCard Boosts contexts
-   And many more...

Unknown contexts can optionally be fetched via HTTP if `allowRemoteContexts` is enabled.

### Async Operations

All operations that may involve network requests (DID resolution, credential issuance/verification) are **truly async** and won't block Node.js's event loop:

```typescript
// These operations run on a separate thread pool
const credential = await learnCard.invoke.issueCredential(unsignedVC, options, keypair);
const result = await learnCard.invoke.verifyCredential(credential);
const didDocument = await learnCard.invoke.resolveDid('did:web:example.com');
```

### DID Web Caching

The plugin includes built-in caching for `did:web` resolution to avoid redundant HTTP requests:

```typescript
// Clear the DID web cache when needed (e.g., in tests)
await learnCard.invoke.clearDidWebCache();
```

## API Reference

The native plugin exposes the same API as the WASM DIDKit plugin:

### Key Generation

```typescript
// Generate Ed25519 keypair from seed bytes
const ed25519Key = learnCard.invoke.generateEd25519KeyFromBytes(seedBytes);

// Generate secp256k1 keypair from seed bytes
const secp256k1Key = learnCard.invoke.generateSecp256k1KeyFromBytes(seedBytes);
```

### DID Operations

```typescript
// Convert key to DID
const did = learnCard.invoke.keyToDid('key', keypair);

// Get verification method for a key
const vm = await learnCard.invoke.keyToVerificationMethod('key', keypair);

// Resolve a DID to its document
const didDoc = await learnCard.invoke.resolveDid(did);

// Full DID resolution with metadata
const resolution = await learnCard.invoke.didResolver(did);
```

### Credential Operations

```typescript
// Issue a credential
const signedVC = await learnCard.invoke.issueCredential(
    unsignedCredential,
    { proofFormat: 'jwt' }, // or 'lds' for JSON-LD signatures
    keypair
);

// Verify a credential
const result = await learnCard.invoke.verifyCredential(signedVC);
// Returns: { checks: [...], warnings: [...], errors: [...] }
```

### Presentation Operations

```typescript
// Issue a presentation
const signedVP = await learnCard.invoke.issuePresentation(
    unsignedPresentation,
    { proofFormat: 'jwt', challenge: 'abc123' },
    keypair
);

// Verify a presentation
const result = await learnCard.invoke.verifyPresentation(signedVP);
```

### JWE Encryption

```typescript
// Create encrypted JWE
const jwe = await learnCard.invoke.createJwe(cleartext, recipientDids);

// Decrypt JWE
const decrypted = await learnCard.invoke.decryptJwe(jwe, privateKeys);

// DAG-JWE for structured data
const dagJwe = await learnCard.invoke.createDagJwe(jsonValue, recipientDids);
const decryptedValue = await learnCard.invoke.decryptDagJwe(dagJwe, privateKeys);
```

## Performance Comparison

### Cold Start (The Main Benefit!)

The biggest advantage of native over WASM is **cold start time** - critical for serverless functions, CLI tools, and worker threads:

| Mode   | Cold Start | Speedup          |
| ------ | ---------- | ---------------- |
| WASM   | ~1109ms    | baseline         |
| Native | ~62ms      | **17.9x faster** |

WASM requires fetching and compiling the binary on every fresh Node process, while native loads instantly. You save **~1047ms per cold start**.

### Warm Operations

Once initialized, native is still faster for most operations:

| Operation          | WASM (ms) | Native (ms) | Speedup          |
| ------------------ | --------- | ----------- | ---------------- |
| issueCredential()  | 2.97      | 1.77        | **1.67x faster** |
| verifyCredential() | 1.97      | 1.68        | **1.18x faster** |
| createJwe()        | 0.34      | 0.10        | **3.29x faster** |
| decryptJwe()       | 0.10      | 0.05        | **2.15x faster** |
| createDagJwe()     | 0.23      | 0.11        | **2.16x faster** |
| decryptDagJwe()    | 0.08      | 0.05        | **1.53x faster** |

{% hint style="info" %}
**When to use native:** Server environments where cold start matters (serverless, CLI tools, worker threads).

Run benchmarks yourself: `cd tests/benchmarking && pnpm benchmark`
{% endhint %}

## Supported Platforms

Prebuilt binaries are included for:

| Platform | Architecture          | Status      |
| -------- | --------------------- | ----------- |
| Linux    | x64 (glibc)           | ✅ Included |
| Linux    | x64 (musl)            | ✅ Included |
| Linux    | ARM64                 | ✅ Included |
| macOS    | x64 (Intel)           | ✅ Included |
| macOS    | ARM64 (Apple Silicon) | ✅ Included |
| Windows  | x64                   | ✅ Included |

For other platforms, the package will attempt to compile from source during installation (requires Rust toolchain).

## Troubleshooting

### Binary Not Found

If you see an error like "No .node binary found":

```bash
# Rebuild the native module
cd node_modules/@learncard/didkit-plugin-node
pnpm build
```

### Compilation Errors

If compilation fails, ensure you have the Rust toolchain installed:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Then reinstall the package
pnpm install
```

### Memory Issues in Serverless

For serverless environments with limited memory, the native plugin is more memory-efficient than WASM. However, if you encounter issues:

```typescript
// Explicitly clear caches between invocations
await learnCard.invoke.clearDidWebCache();
```

## Migration from WASM Plugin

The native plugin is a **drop-in replacement** for the WASM plugin. Simply change the import:

```typescript
// Before (WASM)
import { getDidKitPlugin } from '@learncard/didkit-plugin';

// After (Native)
import { getDidKitPlugin } from '@learncard/didkit-plugin-node';
```

All method signatures and return types are identical.

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    Node.js Application                   │
├─────────────────────────────────────────────────────────┤
│                  TypeScript Plugin Layer                 │
│         (Promise wrappers, JSON serialization)           │
├─────────────────────────────────────────────────────────┤
│                     N-API Bridge                         │
│              (napi-rs async/sync bindings)               │
├─────────────────────────────────────────────────────────┤
│                    Rust Native Code                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │   DIDKit    │ │     SSI     │ │   Embedded Contexts ││
│  │  (signing)  │ │ (resolvers) │ │   (50+ JSON-LD)     ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
├─────────────────────────────────────────────────────────┤
│                   Tokio Runtime                          │
│        (async HTTP, thread pool for CPU work)            │
└─────────────────────────────────────────────────────────┘
```

## Related Documentation

-   [DIDKit (WASM)](didkit.md) - The browser-compatible WASM version
-   [Plugin System](../../core-concepts/architecture-and-principles/plugins.md) - How plugins work
-   [Verifiable Credentials](../../core-concepts/credentials-and-data/verifiable-credentials-vcs.md) - VC concepts
-   [DIDs](../../core-concepts/identities-and-keys/decentralized-identifiers-dids.md) - DID concepts
