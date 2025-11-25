let resolveReady: (() => void) | null = null;

let isReady = false;

let readyPromise: Promise<void> = new Promise<void>(resolve => {
    resolveReady = resolve;
});

export function waitForSQLiteReady(): Promise<void> {
    return readyPromise;
}

export function markSQLiteReady(): void {
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
    readyPromise = new Promise<void>(resolve => {
        resolveReady = resolve;
    });
}
