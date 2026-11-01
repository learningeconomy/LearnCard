let resolveReady: (() => void) | null = null;

let isReady = false;
let initializationError: Error | undefined;

let readyPromise: Promise<void> = new Promise<void>(resolve => {
    resolveReady = resolve;
});

export async function waitForSQLiteReady(): Promise<void> {
    await readyPromise;
    if (initializationError) throw initializationError;
}

/** Settle boot waiters as failed, without an unhandled rejected module-level promise. */
export function markSQLiteFailed(): void {
    initializationError = new Error('Account storage is unavailable. Please try again.');
    settleSQLiteReady();
}

export function markSQLiteReady(): void {
    initializationError = undefined;
    settleSQLiteReady();
}

function settleSQLiteReady(): void {
    if (!isReady) {
        isReady = true;
        if (resolveReady) {
            resolveReady();
            resolveReady = null;
        }
    }
}

export function resetSQLiteReady(): void {
    isReady = false;
    initializationError = undefined;
    readyPromise = new Promise<void>(resolve => {
        resolveReady = resolve;
    });
}
