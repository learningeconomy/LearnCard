import { createHash } from 'crypto';
import { readFile, writeFile } from 'fs/promises';

const EXPECTED_DIDKIT_SHA256 = 'da82d7c815e8a3bd14ed9d8b866918a67cc3f03d34daca22ef41e4b9febe4be7';
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
