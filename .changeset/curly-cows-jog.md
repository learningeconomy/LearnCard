---
'@learncard/simple-signing-service': minor
'@learncard/learn-cloud-service': minor
'@learncard/network-brain-service': minor
'@learncard/didkit-plugin-node': minor
'@learncard/init': minor
'@learncard/didkit-plugin': minor
'@learncard/vc-plugin': minor
---

## New Native DIDKit Plugin (`@learncard/didkit-plugin-node`)

Adds a high-performance native Node.js DIDKit plugin using Rust and N-API, providing **~18x faster cold starts** compared to the WASM version.

### Key Features

-   **Native Performance**: Eliminates WASM compilation overhead on cold starts (~1100ms → ~60ms)
-   **Cross-Platform Binaries**: Prebuilt for Linux (x64/arm64, glibc/musl), macOS (x64/arm64), and Windows (x64)
-   **Drop-in Replacement**: API-compatible with `@learncard/didkit-plugin`
-   **JWE Support**: Full JWE and DAG-JWE encryption/decryption
-   **Async Operations**: All crypto operations run on separate thread pool, non-blocking

### Usage

```typescript
import { initLearnCard } from '@learncard/init';

// Use native plugin instead of WASM
const learnCard = await initLearnCard({
    seed: 'your-seed',
    didkit: 'node', // <-- new option
});
```

### When to Use

-   ✅ Serverless functions (AWS Lambda, Vercel)
-   ✅ Node.js servers (Express, Fastify, NestJS)
-   ✅ CLI tools and scripts
-   ✅ High-throughput credential processing

### Service Updates

All LearnCard Network services (brain-service, learn-cloud-service, simple-signing-service) now use the native plugin in Docker/Lambda environments for improved cold start performance.
