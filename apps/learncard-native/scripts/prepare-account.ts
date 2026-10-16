import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../../../packages/learn-card-base/src/config/tenantDefaults';
import { build } from 'esbuild';
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import './prepare-localization';
import './prepare-signup';
import './prepare-native-sign-in';
const root = resolve(import.meta.dir, '../../..');
const folder = resolve(
    root,
    'apps/learncard-native/ios/NativeCore/Sources/LearnCardNativeSDK/Resources'
);
await mkdir(folder, { recursive: true });
const tenant = JSON.parse(
    await readFile(resolve(root, 'apps/learn-card-app/environments/learncard/config.json'), 'utf8')
);
let previousEmail: string | undefined;
try {
    previousEmail = JSON.parse(
        await readFile(resolve(folder, 'account-config.json'), 'utf8')
    ).testEmail;
} catch {
    /* First local build. */
}
const testEmail =
    process.env.LC_NATIVE_TEST_EMAIL?.trim() || previousEmail || 'native-test@example.invalid';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail))
    throw new Error('Configure a valid staging test email');
await writeFile(
    resolve(folder, 'account-config.json'),
    JSON.stringify({
        apiKey: tenant.auth.firebase.apiKey,
        projectID: 'learncard',
        projectNumber: '776298253175',
        testEmail,
        imageUploadAPIKey: (tenant.storage ?? DEFAULT_LEARNCARD_TENANT_CONFIG.storage).apiKey,
    })
);
await copyFile(
    resolve(root, 'packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm'),
    resolve(folder, 'didkit.wasm')
);
await build({
    entryPoints: [resolve(root, 'apps/learncard-native/account-runtime/runtime.ts')],
    outfile: resolve(folder, 'account-sdk.js'),
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['safari18'],
    conditions: ['development', 'browser'],
    alias: {
        '@learncard/didkit-plugin-node': resolve(
            root,
            'apps/learncard-native/sdk-spike/node-unavailable.ts'
        ),
    },
    plugins: [
        {
            name: 'native-logger',
            setup(builder) {
                builder.onResolve({ filter: /\/logging\/logger$/ }, () => ({
                    path: resolve(root, 'apps/learncard-native/account-runtime/safe-logger.ts'),
                }));
            },
        },
    ],
    logLevel: 'warning',
});
for (const entry of ['consumer-host', 'consumer-fixture']) {
    await build({
        entryPoints: [resolve(root, `apps/learncard-native/account-runtime/${entry}.ts`)],
        outfile: resolve(folder, `${entry}.js`),
        bundle: true,
        minify: true,
        format: 'iife',
        platform: 'browser',
        target: ['safari18'],
        conditions: ['development', 'browser'],
        logLevel: 'warning',
    });
}
console.log(
    'Prepared bundled account SDK and public staging Firebase configuration. No account secrets bundled.'
);
