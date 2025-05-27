# @learncard/init Local Bundle Test Scripts

This directory contains scripts to perform basic local testing of the CommonJS (CJS) and ES Module (ESM) bundles produced by the `@learncard/init` package.

These tests help verify that the package exports are correctly structured and importable in both module systems after a local build.

## Prerequisites

1.  **Navigate to the `@learncard/init` package root:**

    ```bash
    cd /path/to/your/LearnCard/packages/learn-card-init
    ```

2.  **Build the `@learncard/init` package:**
    Ensure all dependencies are installed (e.g., `pnpm install` in the monorepo root or package root) and then run the build command:

    ```bash
    pnpm build
    ```

    This command should generate the `dist` folder in the `@learncard/init` package root, containing the CJS and ESM bundles.

3.  **Navigate to this test directory:**
    ```bash
    cd test/build-step
    ```
    (Assuming you are already in `/path/to/your/LearnCard/packages/learn-card-init`)

## Running the Tests

Once the prerequisites are met and you are in this `test/build-step` directory:

### 1. Test CommonJS (CJS) Bundles

These scripts import the CJS bundle using `require()`.

-   **Test Development CJS Bundle:**

    ```bash
    NODE_ENV=development node ./test-cjs.cjs
    ```

    This will test the `../../dist/init.cjs.development.js` bundle via `../../dist/index.cjs`.

-   **Test Production CJS Bundle:**
    ```bash
    NODE_ENV=production node ./test-cjs.cjs
    ```
    This will test the `../../dist/init.cjs.production.min.js` bundle via `../../dist/index.cjs`.

**Expected Output (for each CJS test):**
Look for messages like:

```bash
Testing CJS import for @learncard/init (NODE_ENV: production)
Successfully required @learncard/init
Expected exports not found or not in the correct format!
Available exports: [
  'customLearnCard',
  'didWebLearnCardFromSeed',
  'didWebNetworkLearnCardFromSeed',
  'emptyLearnCard',
  'initLearnCard',
  'learnCardFromApiUrl',
  'learnCardFromSeed',
  'networkLearnCardFromSeed'
]
```

### 2. Test ES Module (ESM) Bundle

This script imports the ESM bundle using `import()`.

-   **Run the ESM Test:**
    ```bash
    node ./test-esm.mjs
    ```
    This will test the `../../dist/init.esm.js` bundle.

**Expected Output:**
Look for messages like:

```bash
Testing ESM import for @learncard/init
Successfully imported from @learncard/init
Found expected export: initLearnCard
```
