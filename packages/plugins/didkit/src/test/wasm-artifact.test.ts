import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const didkitDir = path.resolve(__dirname, '..', 'didkit');
const wasmPath = path.join(didkitDir, 'pkg', 'didkit_wasm_bg.wasm');
const indexPath = path.join(didkitDir, 'index.ts');

/**
 * The default `init()` argument is a content-addressed CDN URL, while the wasm-bindgen glue
 * in `pkg/` is generated from the checked-in binary. The two are version-locked: the glue
 * only defines the closure-wrapper imports of the exact binary it was generated from, so
 * pairing it with a different binary fails instantiation outright with a `LinkError`.
 *
 * Rebuilding the WASM without republishing and repointing the URL therefore breaks every
 * consumer that calls `initLearnCard()` without supplying its own `didkit` argument. This
 * asserts the two stay in lockstep so that drift fails here, loudly, instead of as an
 * opaque `LinkError` in a downstream package's test run.
 */
describe('checked-in DIDKit WASM artifact', () => {
    it('matches the sha256 embedded in the default init() CDN URL', () => {
        const source = readFileSync(indexPath, 'utf8');
        const urlMatch = source.match(/didkit_wasm_bg-([0-9a-f]{64})\.wasm/);

        expect(urlMatch).not.toBeNull();

        const urlSha = urlMatch![1];
        const binarySha = createHash('sha256').update(readFileSync(wasmPath)).digest('hex');

        if (urlSha !== binarySha) {
            throw new Error(
                [
                    'The checked-in DIDKit WASM does not match the default init() URL.',
                    `  checked-in pkg/didkit_wasm_bg.wasm: ${binarySha}`,
                    `  URL in src/didkit/index.ts:          ${urlSha}`,
                    '',
                    'The glue in pkg/ is generated from the checked-in binary, so serving a',
                    'different binary from the URL produces a LinkError at init time.',
                    'To resolve: publish the checked-in binary as',
                    `  https://assets.learncard.ai/didkit_wasm_bg-${binarySha}.wasm`,
                    'then update the default URL in src/didkit/index.ts to that sha.',
                ].join('\n')
            );
        }
    });
});
