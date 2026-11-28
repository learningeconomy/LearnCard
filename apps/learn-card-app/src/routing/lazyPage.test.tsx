import React, { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { lazyPage } from './lazyPage';
import { markAppStarted, pageClientLoader } from './pageLoader';

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(res => (resolve = res));
    return { promise, resolve };
};

const Page: React.FC<{ label?: string }> = ({ label = 'page' }) => <span>{label}</span>;
const fallback = <span>fallback</span>;
const loaderArgs = {} as Parameters<ReturnType<typeof pageClientLoader>>[0];

describe('lazyPage', () => {
    it('renders the page without suspending once its chunk has loaded', async () => {
        const page = lazyPage(async () => ({ default: Page }));
        await page.preload();

        render(
            <Suspense fallback={fallback}>
                <page.Component />
            </Suspense>
        );

        // Synchronous first commit: no fallback.
        expect(screen.getByText('page')).toBeTruthy();
        expect(screen.queryByText('fallback')).toBeNull();
    });

    it('suspends until the chunk arrives when it has not loaded yet', async () => {
        const chunk = deferred<{ default: typeof Page }>();
        const page = lazyPage(() => chunk.promise);

        render(
            <Suspense fallback={fallback}>
                <page.Component label="late" />
            </Suspense>
        );
        expect(screen.getByText('fallback')).toBeTruthy();

        await act(async () => chunk.resolve({ default: Page }));
        expect(screen.getByText('late')).toBeTruthy();
    });
});

describe('pageClientLoader', () => {
    it('starts data and code together, and only waits for the code once the app has started', async () => {
        const order: string[] = [];
        const chunk = deferred<{ default: typeof Page }>();
        const page = lazyPage(() => {
            order.push('code');
            return chunk.promise;
        });
        const loader = pageClientLoader(page, () => order.push('data'));

        // Initial load: never holds the first render.
        await expect(loader(loaderArgs)).resolves.toBeNull();
        expect(order).toEqual(['data', 'code']);

        markAppStarted();
        let settled = false;
        const navigation = loader(loaderArgs).then(() => (settled = true));
        await Promise.resolve();
        expect(settled).toBe(false);

        chunk.resolve({ default: Page });
        await navigation;
        expect(settled).toBe(true);
    });

    it('still loads the page when its data prefetch throws', async () => {
        const page = lazyPage(async () => ({ default: Page }));
        const loader = pageClientLoader(page, () => {
            throw new Error('no wallet');
        });
        await expect(loader(loaderArgs)).resolves.toBeNull();
    });
});
