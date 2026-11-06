import { build, type BuildOptions } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(`${root}dist`, { recursive: true });
const options: BuildOptions = {
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    // Always use the JS/WASM implementation, never a host-architecture native addon.
    external: ['@learncard/didkit-plugin-node'],
    banner: {
        js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
    },
};
await build({
    ...options,
    entryPoints: [`${root}src/handler.ts`],
    outfile: `${root}dist/handler.mjs`,
});
await copyFile(
    `${root}../../packages/plugins/didkit/dist/didkit/didkit_wasm_bg.wasm`,
    `${root}dist/didkit.wasm`
);
await build({
    ...options,
    entryPoints: [`${root}scripts/smoke.ts`],
    outfile: `${root}dist/smoke.mjs`,
});
execFileSync('node', [`${root}dist/smoke.mjs`], { stdio: 'inherit' });
// Operator-only provisioning tool. Lives next to didkit.wasm (createSdk loads it
// relative to the bundle) and is deliberately NOT part of canary.zip.
await build({
    ...options,
    entryPoints: [`${root}scripts/provision.ts`],
    outfile: `${root}dist/provision.mjs`,
});
// Operator-only staging load test (README "Load testing"). Also NOT part of
// canary.zip. firebase-admin stays external: it resolves from the workspace
// node_modules when run from the repo, and is never bundled into the canary.
await build({
    ...options,
    external: [...(options.external ?? []), 'firebase-admin', 'firebase-admin/*'],
    entryPoints: [`${root}scripts/load.ts`],
    outfile: `${root}dist/load.mjs`,
});
execFileSync('zip', ['-j', '-q', 'canary.zip', 'handler.mjs', 'didkit.wasm'], {
    cwd: `${root}dist`,
});
