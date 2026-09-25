import { randomBytes } from 'node:crypto';

import { argon2id, argon2Verify } from 'hash-wasm';

const ARGON2_MEMORY_KIB = 19_456;
const ARGON2_ITERATIONS = 2;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_BYTES = 32;
const MAX_CONCURRENT_VERIFICATIONS = 4;
let activeVerifications = 0;

export class SharePasscodeCapacityError extends Error {
    constructor() {
        super('share passcode verification capacity exhausted');
    }
}

/** Hash a share passcode as an Argon2id PHC string with a fresh 128-bit salt. */
export const hashSharePasscode = async (passcode: string): Promise<string> =>
    argon2id({
        password: passcode,
        salt: randomBytes(16),
        iterations: ARGON2_ITERATIONS,
        memorySize: ARGON2_MEMORY_KIB,
        parallelism: ARGON2_PARALLELISM,
        hashLength: ARGON2_HASH_BYTES,
        outputType: 'encoded',
    });

/** Verify without ever logging, returning, or persisting the plaintext passcode. */
export const verifySharePasscode = async (
    passcodeHash: string,
    passcode: string
): Promise<boolean> => {
    // Capacity is not a wrong guess: the caller fails closed without recording
    // a failed attempt against the share's short abuse window.
    if (activeVerifications >= MAX_CONCURRENT_VERIFICATIONS) throw new SharePasscodeCapacityError();
    activeVerifications += 1;
    try {
        return await argon2Verify({ password: passcode, hash: passcodeHash });
    } catch {
        return false;
    } finally {
        activeVerifications -= 1;
    }
};
