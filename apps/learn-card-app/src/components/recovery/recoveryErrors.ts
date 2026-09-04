import { getLogger } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

const log = getLogger('recovery');

export const toFriendlyRecoveryError = (err: unknown): string => {
    log.error('Recovery operation failed', err);

    if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes('decrypt') || msg.includes('password')) {
            return m['recovery.error.invalidPassword']();
        }

        if (msg.includes('phrase') || msg.includes('word') || msg.includes('mnemonic')) {
            return m['recovery.error.invalidPhrase']();
        }

        if (msg.includes('code') || msg.includes('expire')) {
            return m['recovery.error.invalidCode']();
        }

        if (msg.includes('network') || msg.includes('fetch')) {
            return m['recovery.error.network']();
        }
    }

    return m['recovery.error.default']();
};
