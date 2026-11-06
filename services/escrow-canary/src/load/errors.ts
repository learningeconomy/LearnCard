/**
 * Load-test failures carry only a fixed, allowlisted reason. They never carry
 * upstream bodies, tokens, keys, PINs, shares or email addresses.
 *
 * Exit codes for `scripts/load.ts`: 0 = run finished, or stopped by Ctrl-C or the
 * error-rate stop (failures are data, see the summary); 1 = stopped by an
 * unexpected error; 2 = guard or usage refusal, nothing was sent; 3 = fatal
 * mid-run guard (e.g. the ID token's Firebase project did not match
 * `--firebase-project`, or the run manifest could not be written), scheduling stopped, including one hit by an operation
 * still in flight when the stages ended; 4 = cleanup incomplete (some deletions
 * failed; re-run the same cleanup command).
 */
export class LoadRefusal extends Error {
    readonly exitCode = 2;
    constructor(
        readonly reason: string,
        /** Fixed operator guidance printed with the refusal (never upstream text). */
        readonly hint?: string
    ) {
        super(`refused: ${reason}`);
        this.name = 'LoadRefusal';
    }
}

export class LoadError extends Error {
    constructor(
        readonly reason: string,
        /** Set when the server refused before creating any hold (the PIN user is reusable). */
        readonly detail: { noHold?: boolean } = {}
    ) {
        super(reason);
        this.name = 'LoadError';
    }
}

export const refuse = (reason: string, hint?: string): LoadRefusal => new LoadRefusal(reason, hint);
