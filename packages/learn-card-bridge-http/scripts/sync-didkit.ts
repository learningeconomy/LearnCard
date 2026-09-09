import { createHash } from 'crypto';
import { readFile, writeFile } from 'fs/promises';

const EXPECTED_DIDKIT_SHA256 = '7c4eb57ab6cb88915d9211d6733018e5e4d210045c31cc2f74087566e7bf0de9';
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
