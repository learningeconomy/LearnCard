import { expect, test } from 'bun:test';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

test('AIP HTTP auth keeps its status with an independent host SDK error module', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'learncard-oauth-sdk-'));
    const sdkErrors = createRequire(import.meta.url).resolve(
        '@modelcontextprotocol/sdk/server/auth/errors.js'
    );
    const hostErrors = join(directory, 'host-sdk-errors.cjs');
    const preload = join(directory, 'separate-sdk.ts');
    const appPath = fileURLToPath(new URL('../app.ts', import.meta.url));
    const suite = fileURLToPath(new URL('./overlapping-requests.test.ts', import.meta.url));

    try {
        // Use the installed SDK's actual classes, not look-alike error mocks.
        copyFileSync(sdkErrors, hostErrors);
        writeFileSync(
            preload,
            `const core = await import(${JSON.stringify(sdkErrors)});
const host = await import(${JSON.stringify(hostErrors)});
if (host.InvalidTokenError === core.InvalidTokenError ||
    new host.InvalidTokenError('test') instanceof core.OAuthError) {
    throw new Error('Fixture did not create independent SDK error classes');
}
Bun.plugin({
    name: 'independent-host-sdk',
    setup(build) {
        build.onResolve({ filter: /^@modelcontextprotocol\\/sdk\\/server\\/auth\\/errors\\.js$/ }, args => {
            if (args.importer === ${JSON.stringify(appPath)}) {
                return { path: ${JSON.stringify(hostErrors)} };
            }
        });
    },
});
`
        );
        const child = Bun.spawn(
            [process.execPath, 'test', '--preload', preload, '--conditions=development', suite],
            { env: { ...process.env, JWT_SECRET: 'test-only' }, stdout: 'pipe', stderr: 'pipe' }
        );
        const [stdout, stderr, exitCode] = await Promise.all([
            new Response(child.stdout).text(),
            new Response(child.stderr).text(),
            child.exited,
        ]);
        if (exitCode !== 0)
            throw new Error(`Separate-SDK HTTP regression failed:\n${stdout}${stderr}`);
        expect(exitCode).toBe(0);
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
