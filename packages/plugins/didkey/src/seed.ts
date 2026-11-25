import { toUint8Array } from 'hex-lite';
import { isHex } from '@learncard/helpers';

let _shortSeedWarned = false;

/**
 * Validates a hex key and turns it into the 32 seed bytes every did:key derivation uses.
 * Shorter keys are left-padded with zeroes (legacy keys can drop leading zeroes).
 */
export const didKeySeedToBytes = (key: string): { seed: string; seedBytes: Uint8Array } => {
    if (key.length === 0) throw new Error("Please don't use an empty string for a key!");
    if (!isHex(key)) throw new Error('Key must be a hexadecimal string!');
    if (key.length > 64) throw new Error('Key must be less than 64 characters');

    if (key.length < 64 && !_shortSeedWarned) {
        _shortSeedWarned = true;

        console.warn(
            'Warning: A LearnCard has been initialized with a seed that is less than 32 bytes, and will be padded with zeroes'
        );
        console.warn(
            'Please instantiate LearnCards using 32 bytes that have been randomly generated in a cryptographically secure fashion!'
        );
        console.warn(
            'See https://app.gitbook.com/o/6uDv1QDlxaaZC7i8EaGb/s/FXvEJ9j3Vf3FW5Nc557n/learn-card-packages/learncard-core/instantiation#key-generation for details'
        );
    }

    const seed = key.padStart(64, '0');

    return { seed, seedBytes: toUint8Array(seed) };
};
