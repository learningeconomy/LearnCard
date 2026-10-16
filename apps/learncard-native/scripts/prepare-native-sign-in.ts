import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { nativeSignInFiles } from './native-sign-in-config';

// Public registration only; mobile builds must never contain provider secrets.
const root = resolve(import.meta.dir, '..');
const source = process.env.LC_NATIVE_OAUTH_CONFIG || resolve(root, 'oauth-config.json');
const files = nativeSignInFiles(JSON.parse(await readFile(source, 'utf8')));
await writeFile(
    resolve(root, 'ios/NativeCore/Sources/LearnCardNativeSDK/Resources/native-oauth.json'),
    files.resource
);
await writeFile(resolve(root, 'ios/GeneratedOAuth.xcconfig'), files.xcconfig);
await writeFile(resolve(root, 'ios/GeneratedOAuth.entitlements'), files.entitlements);
