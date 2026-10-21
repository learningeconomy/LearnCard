/**
 * Shared output router for every CLI command.
 *
 * Human mode: `out.log(...)` behaves exactly like `console.log(...)`.
 * `--json` mode: `out.log(...)` is redirected to stderr (so stdout stays reserved
 * for the single JSON result line) and each command accumulates its result via
 * `out.set(...)`. `index.tsx`'s `runCommand` prints the final `out.result` object
 * as one JSON line on stdout after the command succeeds (or an error envelope on
 * failure) and sets `out.json` before running the command's action.
 */
export const out = {
    json: false,
    log: (...a: unknown[]) => (out.json ? console.error(...a) : console.log(...a)),
    result: {} as Record<string, unknown>,
    set: (patch: Record<string, unknown>) => Object.assign(out.result, patch),
};
