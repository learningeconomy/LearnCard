/**
 * Output containment for the provisioning tool. SDK and wallet code logs to the
 * console, sometimes with raw error objects that may echo request material. For
 * the whole run every `console.*` method is replaced by a sink that only counts
 * calls; the tool's own lines go to `write`, which receives fixed strings only.
 */
const METHODS = ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'table'] as const;

export interface Containment {
    /** Number of suppressed console calls so far. */
    suppressed(): number;
    restore(): void;
}

export const containConsole = (target: Console = console): Containment => {
    let count = 0;
    const saved = METHODS.map(name => [name, target[name]] as const);
    for (const name of METHODS)
        (target as unknown as Record<string, unknown>)[name] = () => {
            count += 1;
        };
    return {
        suppressed: () => count,
        restore: () => {
            for (const [name, method] of saved)
                (target as unknown as Record<string, unknown>)[name] = method;
        },
    };
};

/**
 * Last-resort handlers: print a fixed line and exit. Never the error text, which
 * could contain a token or key from a rejected promise deep in the SDK.
 */
export const installCrashHandlers = (
    write: (line: string) => void,
    exit: (code: number) => never
): void => {
    const crash = () => {
        write('provision: unexpected failure (details suppressed); re-run to resume');
        exit(1);
    };
    process.on('uncaughtException', crash);
    process.on('unhandledRejection', crash);
};
