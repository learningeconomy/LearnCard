// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inAppMessageValidator } from '@learncard/types';
import { InAppMessageStory } from '../InAppMessageStory';

const native = vi.hoisted(() => ({
    getLatest: vi.fn(),
    addListener: vi.fn(),
    download: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capgo/capacitor-updater', () => ({ CapacitorUpdater: native }));
vi.mock('../useInAppMessageActions', () => ({
    useInAppMessageActions: () => ({ runAction: async () => 'capgo' }),
}));
vi.mock('../debug', () => ({ iamDebug: vi.fn() }));
vi.mock('../MessageMedia', () => ({ MessageMedia: () => null }));
vi.mock('framer-motion', async importOriginal => {
    const original = await importOriginal<typeof import('framer-motion')>();
    return { ...original, useReducedMotion: () => true };
});

beforeEach(() => {
    vi.resetAllMocks();
    native.getLatest.mockResolvedValue({
        version: '2.0.0',
        url: 'https://updates.example/app.zip',
    });
    native.addListener.mockResolvedValue({ remove: native.remove });
    native.set.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('story update lifecycle', () => {
    it('retains download progress and its running guard across screen navigation', async () => {
        let finishDownload: (bundle: { id: string }) => void = () => undefined;
        native.download.mockImplementation(
            () =>
                new Promise<{ id: string }>(resolve => {
                    finishDownload = resolve;
                })
        );
        const onClose = vi.fn();
        render(
            <InAppMessageStory
                message={inAppMessageValidator.parse({
                    id: 'update-story',
                    title: 'App update',
                    presentation: 'story',
                    steps: [{ title: 'Overview' }, { title: 'Get the update' }],
                    actions: [{ label: 'Update', action: { type: 'capgoUpdate' } }],
                })}
                onClose={onClose}
            />
        );
        expect(screen.queryByRole('button', { name: 'Update', exact: true })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        fireEvent.click(screen.getByRole('button', { name: 'Update', exact: true }));
        await waitFor(() => expect(native.download).toHaveBeenCalledOnce());
        const reportProgress = native.addListener.mock.calls[0]?.[1] as (event: {
            percent: number;
        }) => void;
        act(() => reportProgress({ percent: 35 }));
        expect(screen.getByText(/Downloading.*35/)).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
        expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
        fireEvent.keyDown(screen.getByRole('button', { name: 'Next' }), { key: 'ArrowRight' });
        expect(screen.queryByRole('button', { name: 'Update', exact: true })).toBeNull();
        expect(screen.getByText(/Downloading.*35/)).toBeTruthy();
        expect(native.getLatest).toHaveBeenCalledOnce();
        expect(native.download).toHaveBeenCalledOnce();

        await act(async () => finishDownload({ id: 'new-bundle' }));
        expect(native.set).toHaveBeenCalledExactlyOnceWith({ id: 'new-bundle' });
        expect(native.remove).toHaveBeenCalledOnce();
        expect(onClose).not.toHaveBeenCalled();
    });
});
