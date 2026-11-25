/**
 * Run tasks with at most `concurrency` in flight, keeping result order. The
 * first failure rejects the whole run and stops new tasks from starting; tasks
 * already running are not cancelled.
 */
export const runWithConcurrency = async <T>(
    tasks: ReadonlyArray<() => Promise<T>>,
    concurrency: number
): Promise<T[]> => {
    const results: T[] = Array.from({ length: tasks.length });
    const limit = Math.max(1, Math.min(Math.floor(concurrency) || 1, tasks.length));
    let nextIndex = 0;
    let failed = false;
    await Promise.all(
        Array.from({ length: tasks.length ? limit : 0 }, async () => {
            while (!failed && nextIndex < tasks.length) {
                const index = nextIndex;
                nextIndex += 1;
                try {
                    results[index] = await tasks[index]!();
                } catch (error) {
                    failed = true;
                    throw error;
                }
            }
        })
    );
    return results;
};
