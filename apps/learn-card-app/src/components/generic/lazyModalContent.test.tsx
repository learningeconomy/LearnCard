import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { lazyModalContent } from './lazyModalContent';

type Module = { default: React.ComponentType };
const body: Module = { default: () => <p>modal body</p> };
// What a dynamic import rejects with when its chunk is gone after a deploy or the fetch drops.
const staleChunk = () =>
    new TypeError('Failed to fetch dynamically imported module: https://app.example/a.js');

const reload = vi.fn();

beforeEach(() => {
    sessionStorage.clear();
    Object.defineProperty(window, 'location', { configurable: true, value: { reload } });
});

afterEach(() => {
    cleanup();
    reload.mockReset();
});

describe('lazyModalContent prefetch', () => {
    it('starts the import before the first open, and the open reuses it', async () => {
        const factory = vi.fn(async (): Promise<Module> => body);
        const Modal = lazyModalContent(factory);

        Modal.prefetch();
        Modal.prefetch();
        expect(factory).toHaveBeenCalledTimes(1);

        render(<Modal />);
        expect(await screen.findByText('modal body')).toBeTruthy();
        expect(factory).toHaveBeenCalledTimes(1);

        Modal.prefetch();
        expect(factory).toHaveBeenCalledTimes(1);
    });

    it('does not let a failed prefetch break the open', async () => {
        const factory = vi
            .fn<() => Promise<Module>>()
            .mockRejectedValueOnce(staleChunk())
            .mockResolvedValue(body);
        const Modal = lazyModalContent(factory);

        Modal.prefetch();
        await Promise.resolve();
        await Promise.resolve();

        render(<Modal />);
        expect(await screen.findByText('modal body')).toBeTruthy();
        expect(factory).toHaveBeenCalledTimes(2);
        expect(reload).not.toHaveBeenCalled();
    });

    it('a failed prefetch does not reload the page; a stale chunk on open still recovers as before', async () => {
        const factory = vi.fn<() => Promise<Module>>().mockRejectedValue(staleChunk());
        const Modal = lazyModalContent(factory);

        Modal.prefetch();
        await Promise.resolve();
        await Promise.resolve();
        expect(reload).not.toHaveBeenCalled();

        render(<Modal />);
        await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
        // The prefetch, then lazyWithRetry's first try and its one retry.
        expect(factory).toHaveBeenCalledTimes(3);
    });
});
