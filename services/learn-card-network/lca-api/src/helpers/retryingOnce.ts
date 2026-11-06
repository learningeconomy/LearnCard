/**
 * Run `task` at most once at a time and share its result. A rejection is not
 * cached: the next call starts the task again. Used for Lambda cold-start work,
 * where caching a failure turns one transient error (e.g. a slow Mongo call)
 * into a container that fails every request until it is recycled.
 */
export const createRetryingOnce = <T>(task: () => Promise<T>): (() => Promise<T>) => {
    let pending: Promise<T> | undefined;

    return () => {
        pending ??= task().catch((error: unknown) => {
            pending = undefined;
            throw error;
        });

        return pending;
    };
};
