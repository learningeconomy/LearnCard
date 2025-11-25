import React from 'react';

const isStaleChunkError = (err: unknown) =>
    typeof err === 'object' &&
    err &&
    /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
        (err as any).message || ''
    );

export function lazyWithRetry<T extends { default: React.ComponentType<any> }>(
    factory: () => Promise<T>
) {
    return React.lazy(async () => {
        try {
            return await factory();
        } catch (err) {
            if (isStaleChunkError(err)) {
                // Hard refresh to pick up the new HTML + manifest
                window.location.reload();
            }
            throw err;
        }
    });
}
