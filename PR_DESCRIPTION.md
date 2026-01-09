# Overview

#### 🎟 Relevant Jira Issues

<!--- Example: Fixes: WE-53, Related to: WE-308 -->

Related to: Performance optimization initiative

#### 📚 What is the context and goal of this PR?

This PR introduces a new **native Node.js DIDKit plugin** (`@learncard/didkit-plugin-node`) that provides ~18x faster cold starts compared to the WASM version. The native plugin uses Rust compiled via N-API, eliminating the WASM compilation overhead that occurs on every cold start in serverless environments.

Key motivations:

-   AWS Lambda cold starts were slow (~1100ms just for WASM init)
-   CLI tools and worker threads suffered from repeated WASM compilation
-   High-throughput credential processing needed better performance

#### 🥴 TL; RL:

**New native DIDKit plugin with 18x faster cold starts.** All LearnCard Network services (brain-service, learn-cloud-service, simple-signing-service) now use the native plugin in Lambda/Docker environments. The deploy workflow has been updated to build the native binary and include it in deployments.

#### 💡 Feature Breakdown (screenshots & videos encouraged!)

**1. New Native Plugin (`@learncard/didkit-plugin-node`)**

-   Rust + N-API implementation of DIDKit functionality
-   Drop-in replacement API for `@learncard/didkit-plugin`
-   Prebuilt binaries for Linux (x64/arm64, glibc/musl), macOS (x64/arm64), Windows (x64)
-   Full JWE and DAG-JWE encryption/decryption support
-   Async operations on thread pool (non-blocking)

**2. LearnCard Init Integration**

-   New `didkit: 'node'` option in `initLearnCard()` to use native plugin
-   Automatic fallback detection

**3. Service Updates**

-   All services updated to use native plugin via Docker/Lambda
-   Dockerfiles updated with Rust toolchain and submodule support
-   serverless.yml files optimized for minimal Lambda package sizes

**4. CI/CD Updates**

-   New `build-native-plugin` job in deploy.yml
-   Native binary built once and shared across deploy jobs via artifacts
-   CI detection to skip redundant napi builds when binary exists

**Performance Results:**
| Mode | Cold Start | Speedup |
|--------|------------|---------|
| WASM | ~1109ms | baseline |
| Native | ~62ms | **17.9x faster** |

#### 🛠 Important tradeoffs made:

1. **Selective package patterns** - Changed from including entire `@learncard/didkit-plugin-node/**` to only essential files (`*.node`, `package.json`, `dist/**`) to avoid bloating Lambda packages with Rust build artifacts.

2. **Separate prebuild workflow kept** - The `didkit-plugin-node-prebuilds.yml` workflow is kept for npm publishing (external consumers), while deploy.yml builds its own binary for Lambda deployments.

#### 🔍 Types of Changes

<!--- What types of changes does your code introduce? Put an `x` in all the boxes that apply: -->

-   [ ] Bug fix (non-breaking change which fixes an issue)
-   [x] New feature (non-breaking change which adds functionality)
-   [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
-   [ ] Chore (refactor, documentation update, etc)

#### 💳 Does This Create Any New Technical Debt? ( If yes, please describe and [add JIRA TODOs](https://welibrary.atlassian.net/jira/software/projects/WE/boards/2) )

-   [x] No
-   [ ] Yes

# Testing

#### 🔬 How Can Someone QA This?

1. **Local testing:**

    ```bash
    cd tests/benchmarking
    pnpm install
    pnpm benchmark
    ```

    Should show native vs WASM comparison with native being significantly faster on cold start.

2. **Service testing:**

    ```bash
    cd services/learn-card-network/brain-service
    pnpm exec serverless package
    ls -lh .serverless/*.zip  # Should be ~24MB, not 600MB+
    ```

3. **CI testing:**
    - Trigger a deploy workflow
    - Verify `build-native-plugin` job completes
    - Verify deploy jobs download and use the artifact
    - Verify Lambda functions deploy successfully within size limits

#### 📱 🖥 Which devices would you like help testing on?

-   Linux (primary target for Lambda)
-   macOS (development)

#### 🧪 Code Coverage

-   Unit tests: Existing tests continue to pass
-   Integration tests: Services tested with native plugin
-   Benchmarks: Added `tests/benchmarking/` for performance comparison

# Documentation

#### 📝 Documentation Checklist

**User-Facing Docs** (`docs/` → [docs.learncard.com](https://docs.learncard.com))

-   [ ] **Tutorial** — New capability that users need to learn (`docs/tutorials/`)
-   [ ] **How-To Guide** — New workflow or integration (`docs/how-to-guides/`)
-   [x] **Reference** — New/changed API, config, or SDK method (`docs/sdks/`)
-   [ ] **Concept** — New mental model or architecture explanation (`docs/core-concepts/`)
-   [ ] **App Flows** — Changes to LearnCard App or ScoutPass user flows (`docs/apps/`)

**Internal/AI Docs**

-   [ ] **CLAUDE.md** — New pattern, flow, or context that AI assistants need
-   [x] **Code comments/JSDoc** — Complex logic that needs inline explanation

**Visual Documentation**

-   [x] **Mermaid diagram** — Complex flow, state machine, or architecture (included in docs/sdks/official-plugins/didkit-node.md)

#### 💭 Documentation Notes

-   Added comprehensive documentation at `docs/sdks/official-plugins/didkit-node.md`
-   Updated `docs/sdks/official-plugins/README.md` to list the new plugin
-   Includes performance comparison, usage examples, API reference, troubleshooting, and architecture diagram

# ✅ PR Checklist

-   [x] Related to a Jira issue ([create one if not](https://welibrary.atlassian.net/jira/software/projects/WE/boards/2))
-   [x] My code follows **style guidelines** (eslint / prettier)
-   [x] I have **manually tested** common end-2-end cases
-   [x] I have **reviewed** my code
-   [x] I have **commented** my code, particularly where ambiguous
-   [x] New and existing **unit tests pass** locally with my changes
-   [x] I have completed the **Documentation Checklist** above (or explained why N/A)

### 🚀 Ready to squash-and-merge?:

-   [x] Code is backwards compatible
-   [x] There is **not** a "Do Not Merge" label on this PR
-   [x] I have thoughtfully considered the security implications of this change.
-   [x] This change does not expose new public facing endpoints that do not have authentication
