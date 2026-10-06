import { spawnSync } from 'node:child_process';
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const originalConfig = `const config = {
    plugins: { CapacitorUpdater: { autoUpdate: true, } },
};
export default config;
`;

const fixtures: string[] = [];

afterEach(() => {
    for (const fixture of fixtures.splice(0)) {
        rmSync(fixture, { recursive: true, force: true });
    }
});

describe('native dev config cleanup', () => {
    it.each([42, 0])('restores the source config after sync exits with %i', syncExitCode => {
        const fixture = mkdtempSync(join(tmpdir(), 'lc-native-dev-'));
        fixtures.push(fixture);

        const scripts = join(fixture, 'scripts');
        const loggerPackage = join(fixture, 'node_modules/learn-card-base');
        const tenant = join(fixture, 'environments/learncard');
        for (const path of [scripts, loggerPackage, tenant]) mkdirSync(path, { recursive: true });

        // Run the actual CLI against disposable config and fake native commands.
        copyFileSync(resolve('scripts/lc.ts'), join(scripts, 'lc.ts'));
        writeFileSync(join(fixture, 'capacitor.config.ts'), originalConfig);
        writeFileSync(join(tenant, 'config.json'), JSON.stringify({ branding: { name: 'QA' } }));
        writeFileSync(
            join(fixture, 'package.json'),
            JSON.stringify({
                scripts: { 'native:sync': 'bun scripts/sync-fixture.ts' },
            })
        );
        writeFileSync(
            join(loggerPackage, 'package.json'),
            JSON.stringify({
                name: 'learn-card-base',
                exports: { './src/logging/logger': './logger.ts' },
            })
        );
        writeFileSync(
            join(loggerPackage, 'logger.ts'),
            `
export const getLogger = () => ({ info: () => {}, warn: () => {}, error: console.error });
`
        );
        writeFileSync(
            join(scripts, 'sync-fixture.ts'),
            `
import { readFileSync, writeFileSync } from 'node:fs';
writeFileSync('synced-config.ts', readFileSync('capacitor.config.ts'));
process.exit(${syncExitCode});
`
        );
        // Stop a successful sync before it can open an IDE or start Vite.
        writeFileSync(
            join(scripts, 'prepare-native-config.ts'),
            `
import { writeFileSync } from 'node:fs';
writeFileSync('prepare-reached', 'true');
throw new Error('fixture stops after sync');
`
        );
        // Do not depend on the test machine having a non-loopback interface.
        const preload = join(fixture, 'preload.ts');
        writeFileSync(
            preload,
            `
const os = require('node:os');
os.networkInterfaces = () => ({
    qa: [{ family: 'IPv4', internal: false, address: '192.0.2.1' }],
});
require('node:module').syncBuiltinESMExports();
`
        );

        const result = spawnSync(
            'bun',
            ['--preload', preload, join(scripts, 'lc.ts'), 'native', 'dev', 'learncard', 'ios'],
            { cwd: fixture, encoding: 'utf8', timeout: 15_000 }
        );

        expect(result.error).toBeUndefined();
        expect(result.status).toBe(1);
        const syncedConfig = readFileSync(join(fixture, 'synced-config.ts'), 'utf8');
        expect(syncedConfig).toContain("url: 'http://192.0.2.1:5173'");
        expect(syncedConfig).toContain('autoUpdate: false');
        expect(existsSync(join(fixture, 'prepare-reached'))).toBe(syncExitCode === 0);
        expect(readFileSync(join(fixture, 'capacitor.config.ts'), 'utf8')).toBe(originalConfig);
        expect(existsSync(join(fixture, 'capacitor.config.ts.bak'))).toBe(false);
    });
});
