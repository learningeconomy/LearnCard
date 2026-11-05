/**
 * Load-test failures carry only a fixed, allowlisted reason. They never carry
 * upstream bodies, tokens, keys, PINs, shares or email addresses.
 *
 * Exit codes for `scripts/load.ts`: 0 = run finished (failures are data, see the
 * summary); 1 = stopped by an unexpected error; 2 = guard or usage refusal,
 * nothing was sent; 3 = fatal mid-run guard (e.g. the ID token's Firebase project
 * did not match `--firebase-project`), scheduling stopped.
 */
export class LoadRefusal extends Error {
    readonly exitCode = 2;
    constructor(readonly reason: string) {
        super(`refused: ${reason}`);
        this.name = 'LoadRefusal';
    }
}

export class LoadError extends Error {
    constructor(readonly reason: string) {
        super(reason);
        this.name = 'LoadError';
    }
}

export const refuse = (reason: string): LoadRefusal => new LoadRefusal(reason);
