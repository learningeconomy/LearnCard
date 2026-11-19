import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';
import { initDidKit } from '@learncard/didkit-plugin';
import { getLogger } from '../logging/logger';

const log = getLogger('wallet-helpers');

/**
 * Starts the bundled DIDKit WASM init at app entry without waiting for it, so the first
 * wallet build finds DIDKit warm. A failure is logged and dropped: DIDKit clears a failed
 * init, so the real wallet build retries it.
 *
 * Lives outside `walletHelpers` so the app entry can call it without statically pulling
 * `@learncard/init` and every wallet plugin into the entry chunk.
 */
export const prewarmDidKit = (): void => {
    try {
        initDidKit(didkit).catch(error =>
            log.warn('DIDKit prewarm failed; wallet build retries', error)
        );
    } catch (error) {
        log.warn('DIDKit prewarm failed; wallet build retries', error);
    }
};
