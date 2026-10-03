import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, copyFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repo = fileURLToPath(new URL('../../../../', import.meta.url));
const service = fileURLToPath(new URL('../', import.meta.url));
const bun = process.env.BUN_BINARY || 'bun';
const temporary = await mkdtemp(join(tmpdir(), 'ai-agent-did-auth-'));
const runtime = join(temporary, 'app');
const packageRoot = join(runtime, 'node_modules/@learncard/didkit-plugin');
const binary = 'src/didkit/pkg/didkit_wasm_bg.wasm';

const run = (args, cwd = repo) =>
    spawnSync(bun, args, {
        cwd,
        encoding: 'utf8',
        timeout: 120_000,
        env: { ...process.env, SKIP_DIDKIT_NAPI: '1' },
    });
const succeeded = result => {
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
};

try {
    const dockerfile = await readFile(join(service, 'Dockerfile'), 'utf8');
    const target = dockerfile.match(/source=[^\s,]+runtime-did-auth-smoke\.js,target=([^,\s]+),ro/);
    assert.ok(target, 'Dockerfile must mount the bundled runtime smoke');
    // Map the Docker mount into this isolated filesystem, preserving its placement.
    const bundled = join(temporary, target[1]);
    await mkdir(dirname(bundled), { recursive: true });
    await mkdir(dirname(join(packageRoot, binary)), { recursive: true });
    await copyFile(
        join(repo, 'packages/plugins/didkit/package.json'),
        join(packageRoot, 'package.json')
    );
    await copyFile(join(repo, 'packages/plugins/didkit', binary), join(packageRoot, binary));

    succeeded(
        run([
            'build',
            join(service, 'scripts/runtime-did-auth-smoke.ts'),
            '--target=bun',
            '--conditions=development',
            `--outfile=${bundled}`,
            '--external=@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm',
        ])
    );

    // Only the bundled entrypoint, package manifest and copied WASM are present.
    const result = run(['--no-install', '--conditions=development', bundled], runtime);
    succeeded(result);
    const evidence = JSON.parse(result.stdout.trim().split('\n').at(-1));
    assert.equal(evidence.ok, true);
    assert.equal(evidence.check, 'did-auth-vp');
    assert.equal(evidence.wasmPath, join(packageRoot, binary));
    assert.equal(
        evidence.wasmSha256,
        createHash('sha256')
            .update(await readFile(join(packageRoot, binary)))
            .digest('hex')
    );

    // Reproduce Docker's old /tmp entrypoint: cwd does not supply package resolution.
    const detached = join(temporary, 'runtime-did-auth-smoke.js');
    await copyFile(bundled, detached);
    const outside = run(['--no-install', '--conditions=development', detached], runtime);
    assert.notEqual(outside.status, 0, 'A detached smoke must not silently select another package');
    assert.match(outside.stderr, /Cannot find module|Module not found/);

    // Ensure the smoke actually instantiates the copied artifact.
    await writeFile(join(packageRoot, binary), new Uint8Array([0, 97, 115, 109]));
    const corrupt = run(['--no-install', '--conditions=development', bundled], runtime);
    assert.notEqual(corrupt.status, 0, 'A corrupt assembled WASM must fail the smoke');
    assert.match(corrupt.stderr, /CompileError|WebAssembly/);
    console.log(
        JSON.stringify({ ...evidence, detachedEntrypointRejected: true, corruptWasmRejected: true })
    );
} finally {
    await rm(temporary, { recursive: true, force: true });
}
