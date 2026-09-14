import { createHash } from 'crypto';
import { readFile, writeFile } from 'fs/promises';

const EXPECTED_DIDKIT_SHA256 = '38e9e39677846cfec7f0521cc23d707e2c9e87ae9981f988d78747f023bf64ee';
const sourceUrl = new URL(
    '../../plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
    import.meta.url
);
const destinationUrl = new URL('../src/didkit_wasm_bg.wasm', import.meta.url);
const args = process.argv.slice(2);
const updateIntegrity = args.length === 1 && args[0] === '--update-integrity';

if (args.length > 0 && !updateIntegrity) {
    throw new Error('Usage: bun scripts/sync-didkit.ts [--update-integrity]');
}
if (updateIntegrity && process.env.LOCAL_DIDKIT_PATH) {
    throw new Error('Unset LOCAL_DIDKIT_PATH before updating the canonical DIDKit integrity pin.');
}

if (!process.env.LOCAL_DIDKIT_PATH) {
    const didkit = await readFile(sourceUrl);
    const actualHash = createHash('sha256').update(didkit).digest('hex');

    if (updateIntegrity && actualHash !== EXPECTED_DIDKIT_SHA256) {
        // Only intentional artifact generation/review may change the committed guard.
        const scriptUrl = new URL(import.meta.url);
        const script = await readFile(scriptUrl, 'utf8');
        const declaration = `const EXPECTED_DIDKIT_SHA256 = '${EXPECTED_DIDKIT_SHA256}';`;
        if (!script.includes(declaration)) {
            throw new Error('Could not locate the DIDKit integrity pin to update.');
        }
        await writeFile(
            scriptUrl,
            script.replace(declaration, `const EXPECTED_DIDKIT_SHA256 = '${actualHash}';`)
        );
    } else if (actualHash !== EXPECTED_DIDKIT_SHA256) {
        throw new Error(
            `DIDKit WASM hash changed: expected ${EXPECTED_DIDKIT_SHA256}, received ${actualHash}. ` +
                'Review the rebuilt artifact, then run sync-didkit.ts --update-integrity intentionally.'
        );
    }

    await writeFile(destinationUrl, didkit);
}
