# @learncard/didkit-plugin-node

Node-native N-API DIDKit plugin for LearnCard. Provides cryptographic operations without WASM overhead, ideal for Lambda and server environments.

## Features

- **Native Performance**: Uses N-API to eliminate WASM cold start overhead
- **Cross-Platform**: Prebuilt binaries for Linux (x64/arm64, glibc/musl) and macOS (x64/arm64)
- **Drop-in Replacement**: Compatible with existing `@learncard/didkit-plugin` API
- **Lambda-Optimized**: Designed specifically for serverless environments

## Installation

```bash
pnpm add @learncard/didkit-plugin-node
```

Prebuilt binaries will be automatically installed for your platform via `optionalDependencies`.

## Usage

### With `initLearnCard`

```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({
  seed: 'your-seed-here',
  didkit: 'node', // Use native plugin instead of WASM
});
```

### Direct Plugin Usage

```typescript
import { getDidKitPlugin } from '@learncard/didkit-plugin-node';

const plugin = await getDidKitPlugin();
// Use plugin methods...
```

## Building from Source

If prebuilt binaries aren't available for your platform:

```bash
cd packages/plugins/didkit-plugin-node
pnpm install
pnpm build
```

### Requirements

- Rust toolchain (stable)
- Node.js 16+
- Platform-specific build tools (gcc, clang, etc.)

## Supported Platforms

- `x86_64-unknown-linux-gnu` (glibc-based Linux, x64)
- `aarch64-unknown-linux-gnu` (glibc-based Linux, ARM64)
- `x86_64-unknown-linux-musl` (musl-based Linux, x64, e.g., Alpine)
- `aarch64-unknown-linux-musl` (musl-based Linux, ARM64)
- `x86_64-apple-darwin` (macOS Intel)
- `aarch64-apple-darwin` (macOS Apple Silicon)

## Implementation Status

### ✅ Implemented
- `generateEd25519KeyFromBytes`
- `keyToDID`

### 🚧 Planned
- `generateSecp256k1KeyFromBytes`
- `keyToVerificationMethod`
- `didToVerificationMethod`
- `issueCredential`
- `verifyCredential`
- `issuePresentation`
- `verifyPresentation`
- `contextLoader`
- `resolveDID`
- `didResolver`
- `createJwe` / `decryptJwe`
- `createDagJwe` / `decryptDagJwe`
- `clearDidWebCache`

## Contributing

See the main [LearnCard repository](https://github.com/learningeconomy/LearnCard) for contribution guidelines.

## License

MIT
