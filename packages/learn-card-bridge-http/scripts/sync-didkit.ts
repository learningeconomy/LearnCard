import { createHash } from 'crypto';
import { readFile, writeFile } from 'fs/promises';

const EXPECTED_DIDKIT_SHA256 = '38e9e39677846cfec7f0521cc23d707e2c9e87ae9981f988d78747f023bf64ee';
const sourceUrl = new URL(
    '../../plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
    import.meta.url
);
const destinationUrl = new URL('../src/didkit_wasm_bg.wasm', import.meta.url);
if (!process.env.LOCAL_DIDKIT_PATH) {
    const didkit = await readFile(sourceUrl);
    const actualHash = createHash('sha256').update(didkit).digest('hex');

    if (actualHash !== EXPECTED_DIDKIT_SHA256) {
        throw new Error(
            `DIDKit WASM hash changed: expected ${EXPECTED_DIDKIT_SHA256}, received ${actualHash}. ` +
                'Review the rebuilt artifact and update EXPECTED_DIDKIT_SHA256 intentionally.'
        );
    }

    await writeFile(destinationUrl, didkit);
}
