# @learncard/didkit-plugin-node

## 0.2.4

### Patch Changes

-   Updated dependencies [[`495f2939cb6e4271cab0a88abea5105fb7e4f9b6`](https://github.com/learningeconomy/LearnCard/commit/495f2939cb6e4271cab0a88abea5105fb7e4f9b6), [`08a1c8a07501c2f426d16239c4b0551e518a7ed5`](https://github.com/learningeconomy/LearnCard/commit/08a1c8a07501c2f426d16239c4b0551e518a7ed5)]:
    -   @learncard/types@5.12.2
    -   @learncard/core@9.4.8
    -   @learncard/didkit-plugin@1.7.4

## 0.2.3

### Patch Changes

-   Updated dependencies [[`caf231b53707174ea49f0eb2b65885a36b3e7228`](https://github.com/learningeconomy/LearnCard/commit/caf231b53707174ea49f0eb2b65885a36b3e7228)]:
    -   @learncard/types@5.12.1
    -   @learncard/core@9.4.7
    -   @learncard/didkit-plugin@1.7.3

## 0.2.2

### Patch Changes

-   Updated dependencies [[`32e5cfacf499e9a68700170298040f3d313b38da`](https://github.com/learningeconomy/LearnCard/commit/32e5cfacf499e9a68700170298040f3d313b38da)]:
    -   @learncard/types@5.12.0
    -   @learncard/core@9.4.6
    -   @learncard/didkit-plugin@1.7.2

## 0.2.1

### Patch Changes

-   Updated dependencies [[`d2bbcd71ac1af95da8328c6c0d9d7a84f69675b9`](https://github.com/learningeconomy/LearnCard/commit/d2bbcd71ac1af95da8328c6c0d9d7a84f69675b9)]:
    -   @learncard/types@5.11.4
    -   @learncard/core@9.4.5
    -   @learncard/didkit-plugin@1.7.1

## 0.2.0

### Minor Changes

-   [#936](https://github.com/learningeconomy/LearnCard/pull/936) [`7e30fc7116411ba19a4889cfbf9fc71dd725c309`](https://github.com/learningeconomy/LearnCard/commit/7e30fc7116411ba19a4889cfbf9fc71dd725c309) Thanks [@TaylorBeeston](https://github.com/TaylorBeeston)! - ## New Native DIDKit Plugin (`@learncard/didkit-plugin-node`)

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

### Patch Changes

-   Updated dependencies [[`7e30fc7116411ba19a4889cfbf9fc71dd725c309`](https://github.com/learningeconomy/LearnCard/commit/7e30fc7116411ba19a4889cfbf9fc71dd725c309)]:
    -   @learncard/didkit-plugin@1.7.0
