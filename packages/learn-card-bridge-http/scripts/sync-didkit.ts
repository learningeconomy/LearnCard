import { createHash } from 'crypto';
import { readFile, writeFile } from 'fs/promises';

const EXPECTED_DIDKIT_SHA256 = '0db9aca00b3235f96fcfe3f6fa5a333f8b9949fd1589a7e7a84b85f2c06475cc';
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
