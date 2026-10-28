import { afterAll, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

// startMcpServer() always imports ./instrument, so a broken Sentry/OpenTelemetry graph
// takes the MCP server down at startup even when SENTRY_DSN is unset. Load it in a fresh
// process (no shared module cache or mock.module bleed) from source and from a bundle
// built the same way `bun run build` builds the server.

const MCP_DIR = path.resolve(import.meta.dir, '..');
const FAKE_DSN = 'https://public@o0.ingest.sentry.invalid/0';
const tempDirs: string[] = [];

afterAll(async () => {
    await Promise.all(tempDirs.map(dir => rm(dir, { recursive: true, force: true })));
});

const loadInstrumentation = async (modulePath: string, dsn?: string) => {
    const env: Record<string, string | undefined> = { ...process.env };
    delete env.SENTRY_DSN;
    if (dsn) env.SENTRY_DSN = dsn;

    const child = Bun.spawn(
        [
            process.execPath,
            '--conditions=development',
            '-e',
            `
        const Sentry = await import("@sentry/node");
        const { initializeInstrumentation } = await import(${JSON.stringify(modulePath)});
        initializeInstrumentation();
        console.log(typeof Sentry.setupExpressErrorHandler, Sentry.isInitialized());
        await Sentry.close(0);
      `,
        ],
        { cwd: MCP_DIR, env, stdout: 'pipe', stderr: 'pipe' }
    );

    const exitCode = await child.exited;
    const stdout = await new Response(child.stdout).text();
    const stderr = await new Response(child.stderr).text();

    return { exitCode, stdout: stdout.trim(), stderr };
};

test('MCP instrumentation imports from source without a DSN', async () => {
    const result = await loadInstrumentation(path.join(MCP_DIR, 'instrument.ts'));

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.stdout).toBe('function false');
});

test('MCP instrumentation initializes Sentry from source with a DSN', async () => {
    const result = await loadInstrumentation(path.join(MCP_DIR, 'instrument.ts'), FAKE_DSN);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.stdout).toBe('function true');
});

test('bundled MCP instrumentation imports and initializes', async () => {
    const outdir = await mkdtemp(path.join(tmpdir(), 'ai-passport-instrument-'));
    tempDirs.push(outdir);

    const build = await Bun.build({
        entrypoints: [path.join(MCP_DIR, 'instrument.ts')],
        outdir,
        target: 'bun',
        conditions: ['development'],
    });

    expect(build.success, build.logs.map(String).join('\n')).toBe(true);

    const bundled = path.join(outdir, 'instrument.js');

    for (const dsn of [undefined, FAKE_DSN]) {
        const result = await loadInstrumentation(bundled, dsn);

        expect(result.exitCode, result.stderr).toBe(0);
        expect(result.stdout).toBe(`function ${dsn ? 'true' : 'false'}`);
    }
});
