/** The live account owning a recovery setup attempt. */
export interface RecoverySetupSession {
    identity: object;
    needsActivation: boolean;
    activate: () => Promise<unknown>;
}

export interface RecoverySetupRunner {
    /** Run a terminal setup/confirmation action, then activate. Retry resumes activation only. */
    run: <T>(method: string, action: () => Promise<T>) => Promise<T>;
    /** Discard an earlier confirmation when generating replacement recovery material. */
    reset: (method: string) => void;
}

/**
 * Keep successful setup results until activation succeeds. Phrase/backup challenges
 * and email codes may be consumed by confirmation, and passkeys must not be recreated
 * on an activation retry. No passwords or confirmation inputs are retained here.
 * A method must use the same result type throughout a setup attempt.
 */
export const createRecoverySetupRunner = (
    getSession: () => RecoverySetupSession | null,
    onCompleted: () => void
): RecoverySetupRunner => {
    let owner: object | undefined;
    const confirmed = new Map<string, unknown>();
    const running = new Map<string, Promise<unknown>>();
    let activating: Promise<unknown> | undefined;

    const session = (): RecoverySetupSession => {
        const current = getSession();
        if (!current) throw new Error('Please sign in again to set up account recovery.');
        if (owner !== current.identity) {
            owner = current.identity;
            confirmed.clear();
            running.clear();
            activating = undefined;
        }
        return current;
    };

    return {
        reset(method) {
            session();
            if (running.has(method)) throw new Error('Please wait for recovery setup to finish.');
            confirmed.delete(method);
        },
        run<T>(method: string, action: () => Promise<T>): Promise<T> {
            const identity = session().identity;
            const existing = running.get(method);
            if (existing) return existing as Promise<T>;

            const assertCurrent = (): RecoverySetupSession => {
                const current = getSession();
                if (!current || current.identity !== identity) {
                    throw new Error('Please sign in again to set up account recovery.');
                }
                return current;
            };

            const attempt = Promise.resolve().then(async () => {
                assertCurrent();
                if (!confirmed.has(method)) {
                    const result = await action();
                    assertCurrent();
                    confirmed.set(method, result);
                }

                const current = assertCurrent();
                if (current.needsActivation) {
                    try {
                        activating ??= Promise.resolve().then(current.activate);
                        await activating;
                    } catch {
                        throw new Error('Could not finish account setup. Please try again.');
                    } finally {
                        if (owner === identity) activating = undefined;
                    }
                }

                assertCurrent();
                const result = confirmed.get(method) as T;
                confirmed.delete(method);
                onCompleted();
                return result;
            });

            running.set(method, attempt);
            const cleanup = (): void => {
                if (running.get(method) === attempt) running.delete(method);
            };
            void attempt.then(cleanup, cleanup);
            return attempt;
        },
    };
};

/** Count configured types, not confirmation attempts or duplicate records. */
export const countConfiguredRecoveryMethods = (
    methods: Array<{ type: string; confirmedAt?: Date | string }>,
    maskedRecoveryEmail?: string | null
): number =>
    new Set(
        methods
            .filter(method => method.type !== 'email' || method.confirmedAt || maskedRecoveryEmail)
            .map(method => method.type)
    ).size;
