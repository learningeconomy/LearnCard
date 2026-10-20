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
        const onAction = vi.fn();
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
                onAction={onAction}
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
        expect(onAction).not.toHaveBeenCalled();

        await act(async () => finishDownload({ id: 'new-bundle' }));
        expect(native.set).toHaveBeenCalledExactlyOnceWith({ id: 'new-bundle' });
        expect(native.remove).toHaveBeenCalledOnce();
        expect(onClose).not.toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledExactlyOnceWith({
            actionIndex: 0,
            actionSource: 'message',
            actionType: 'capgoUpdate',
            stepIndex: 1,
        });
    });
    it('does not count a failed native update as an action', async () => {
        native.getLatest.mockRejectedValue(new Error('Connection failed'));
        const onAction = vi.fn();
        render(
            <InAppMessageStory
                message={inAppMessageValidator.parse({
                    id: 'failed-update',
                    title: 'Update',
                    presentation: 'story',
                    steps: [{ title: 'Update available' }],
                    actions: [{ label: 'Install', action: { type: 'capgoUpdate' } }],
                })}
                onClose={vi.fn()}
                onAction={onAction}
            />
        );
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Install' })));
        expect(native.getLatest).toHaveBeenCalledOnce();
        expect(onAction).not.toHaveBeenCalled();
        expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy();
    });
});
