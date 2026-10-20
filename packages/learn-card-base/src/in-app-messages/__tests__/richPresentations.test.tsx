// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://app.example/"}
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inAppMessageValidator } from '@learncard/types';
import { InAppMessageStory, getStorySwipeDirection } from '../InAppMessageStory';
import { InAppMessageIframe } from '../InAppMessageIframe';
import { InAppMessageToast } from '../InAppMessageToast';
import { InAppMessageBanner } from '../InAppMessageBanner';
import { InAppMessageModal } from '../InAppMessageModal';
import { MessageActions } from '../MessageActions';

const mocks = vi.hoisted(() => ({ runAction: vi.fn(), startUpdate: vi.fn(), status: 'idle' }));
vi.mock('../useInAppMessageActions', () => ({
    useInAppMessageActions: () => ({ runAction: mocks.runAction }),
}));
vi.mock('../useCapgoUpdate', () => ({
    useCapgoUpdate: () => ({ startUpdate: mocks.startUpdate, status: mocks.status, progress: 20 }),
}));
vi.mock('../MessageMedia', () => ({ MessageMedia: () => <button>Play media</button> }));
vi.mock('framer-motion', async importOriginal => {
    const original = await importOriginal<typeof import('framer-motion')>();
    return { ...original, useReducedMotion: () => true };
});

beforeEach(() => {
    mocks.runAction.mockReset().mockResolvedValue('closed');
    mocks.startUpdate.mockReset();
    mocks.status = 'idle';
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('story presentation', () => {
    it.each([
        [-60, 0, 1000, 1],
        [60, 0, 1000, -1],
        [-30, 0, 60, 1],
        [-59, 0, 1000, null],
        [-70, 100, 50, null],
    ])('uses horizontal distance/velocity thresholds (%s, %s, %s)', (dx, dy, ms, expected) => {
        expect(getStorySwipeDirection(dx!, dy!, ms!)).toBe(expected);
    });
    const message = inAppMessageValidator.parse({
        id: 'story',
        title: 'Walkthrough',
        presentation: 'story',
        steps: [
            { title: 'First', media: { type: 'youtube', url: 'https://example.com' } },
            { title: 'Second' },
        ],
        actions: [{ label: 'Finish', action: { type: 'dismiss' } }],
    });
    it('navigates without wrapping and runs final actions with screen indexes', async () => {
        const onClose = vi.fn();
        const onAction = vi.fn();
        render(<InAppMessageStory message={message} onClose={onClose} onAction={onAction} />);
        fireEvent.keyDown(screen.getByRole('button', { name: 'Next' }), { key: 'ArrowLeft' });
        expect(screen.getByText('First')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Play media' }));
        expect(screen.getByText('First')).toBeTruthy();
        fireEvent.keyDown(screen.getByRole('button', { name: 'Next' }), { key: 'ArrowRight' });
        await screen.findByText('Second');
        expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
        await waitFor(() => expect(onClose).toHaveBeenCalledWith('dismissed', { stepIndex: 1 }));
        expect(onAction).toHaveBeenCalledWith({
            actionIndex: 0,
            actionType: 'dismiss',
            stepIndex: 1,
        });
    });
    it('uses screen actions instead of message actions and hides passive close when required', () => {
        const required = {
            ...message,
            dismissible: false,
            steps: [{ title: 'Only', actions: [] }],
        };
        render(<InAppMessageStory message={required} onClose={vi.fn()} />);
        expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Finish' })).toBeNull();
    });
    it('shares Capgo progress without closing the story', async () => {
        mocks.runAction.mockResolvedValue('capgo');
        mocks.status = 'checking';
        const onClose = vi.fn();
        render(
            <MessageActions
                actions={[
                    {
                        label: 'Update',
                        style: 'primary',
                        closeOnComplete: true,
                        action: { type: 'capgoUpdate' },
                    },
                ]}
                onClose={onClose}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Update' }));
        await screen.findByText('Checking…');
        expect(mocks.startUpdate).toHaveBeenCalledOnce();
        expect(onClose).not.toHaveBeenCalled();
    });
});

describe('toast lifecycle', () => {
    const message = inAppMessageValidator.parse({
        id: 'toast',
        title: 'Saved',
        presentation: 'toast',
    });

    it('does not restart expiry when the host updates its callback', () => {
        vi.useFakeTimers();
        const firstClose = vi.fn();
        const latestClose = vi.fn();
        const view = render(<InAppMessageToast message={message} onClose={firstClose} />);
        act(() => vi.advanceTimersByTime(4000));
        view.rerender(<InAppMessageToast message={message} onClose={latestClose} />);
        act(() => vi.advanceTimersByTime(1000));
        expect(firstClose).not.toHaveBeenCalled();
        expect(latestClose).toHaveBeenCalledExactlyOnceWith('expired');
    });

    it('does not report expiry while a tapped navigation action completes', async () => {
        vi.useFakeTimers();
        let resolve: (value: string) => void = () => undefined;
        mocks.runAction.mockImplementation(
            () =>
                new Promise<string>(done => {
                    resolve = done;
                })
        );
        const onClose = vi.fn();
        render(
            <InAppMessageToast
                message={{
                    ...message,
                    actions: [
                        {
                            label: 'Open',
                            style: 'primary',
                            closeOnComplete: true,
                            action: { type: 'internalLink', path: '/home' },
                        },
                    ],
                }}
                onClose={onClose}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Saved' }));
        act(() => vi.advanceTimersByTime(5000));
        expect(onClose).not.toHaveBeenCalled();
        await act(async () => resolve('closed'));
        expect(onClose).toHaveBeenCalledExactlyOnceWith('action');
    });

    it('restores expiry after a no-op action even if the original timer elapsed', async () => {
        vi.useFakeTimers();
        let resolve: (value: string) => void = () => undefined;
        mocks.runAction.mockImplementation(
            () =>
                new Promise<string>(done => {
                    resolve = done;
                })
        );
        const onClose = vi.fn();
        render(
            <InAppMessageToast
                message={inAppMessageValidator.parse({
                    ...message,
                    actions: [{ label: 'Open store', action: { type: 'appStore' } }],
                })}
                onClose={onClose}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Saved' }));
        act(() => vi.advanceTimersByTime(5000));
        await act(async () => resolve('noop'));
        expect(onClose).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(5000));
        expect(onClose).toHaveBeenCalledExactlyOnceWith('expired');
    });
});

describe('action completion', () => {
    it.each([
        ['modal', InAppMessageModal],
        ['story', InAppMessageStory],
        ['banner', InAppMessageBanner],
        ['toast', InAppMessageToast],
    ] as const)(
        'keeps a %s open after a no-op and allows a successful retry',
        async (presentation, Component) => {
            const message = inAppMessageValidator.parse({
                id: 'store',
                title: 'Update available',
                presentation,
                dismissible: false,
                steps: [{ title: 'Update' }],
                actions: [{ label: 'Open store', action: { type: 'appStore' } }],
            });
            const onClose = vi.fn();
            mocks.runAction.mockResolvedValueOnce('noop').mockResolvedValueOnce('closed');
            render(<Component message={message} onClose={onClose} />);
            const actionButton = screen.getByRole('button', {
                name: presentation === 'toast' ? 'Update available' : 'Open store',
            });
            await act(async () => fireEvent.click(actionButton));
            expect(mocks.runAction).toHaveBeenCalledOnce();
            expect(onClose).not.toHaveBeenCalled();
            await act(async () => fireEvent.click(actionButton));
            expect(mocks.runAction).toHaveBeenCalledTimes(2);
            expect(onClose).toHaveBeenCalledOnce();
            expect(onClose.mock.calls[0]?.[0]).toBe('action');
        }
    );
});

describe('iframe lifecycle', () => {
    it('does not mount a scripted iframe on the app origin', () => {
        const message = inAppMessageValidator.parse({
            id: 'same-origin',
            title: 'Unsafe',
            presentation: 'iframe',
            iframe: { url: 'https://app.example/content' },
        });
        render(<InAppMessageIframe message={message} onClose={vi.fn()} />);
        expect(screen.queryByTitle('Unsafe')).toBeNull();
        expect(screen.getByRole('alert')).toBeTruthy();
    });
    const message = inAppMessageValidator.parse({
        id: 'frame',
        title: 'Embedded',
        presentation: 'iframe',
        iframe: { url: 'https://example.com/page', loadTimeoutMs: 100 },
    });
    const send = (
        frame: HTMLIFrameElement,
        event: string,
        action?: unknown,
        origin = 'https://example.com'
    ): void => {
        act(() =>
            window.dispatchEvent(
                new MessageEvent('message', {
                    source: frame.contentWindow,
                    origin,
                    data: { type: 'LC_IN_APP_MESSAGE', event, ...(action ? { action } : {}) },
                })
            )
        );
    };
    it('accepts ready and rejects another origin', () => {
        render(<InAppMessageIframe message={message} onClose={vi.fn()} />);
        const frame = screen.getByTitle('Embedded') as HTMLIFrameElement;
        expect(frame.getAttribute('sandbox')).toBe(
            'allow-scripts allow-same-origin allow-forms allow-popups'
        );
        send(frame, 'ready', undefined, 'https://other.example');
        expect(screen.getByRole('status')).toBeTruthy();
        send(frame, 'ready');
        expect(screen.queryByRole('status')).toBeNull();
    });
    it('keeps required frames recoverable after load without a valid ready handshake', () => {
        vi.useFakeTimers();
        const onClose = vi.fn();
        render(
            <InAppMessageIframe message={{ ...message, dismissible: false }} onClose={onClose} />
        );
        const frame = screen.getByTitle('Embedded') as HTMLIFrameElement;
        fireEvent.load(frame);
        send(frame, 'ready', undefined, 'https://other.example');
        expect(screen.getByRole('status')).toBeTruthy();
        act(() => vi.advanceTimersByTime(101));
        expect(screen.getByRole('alert')).toBeTruthy();
        send(frame, 'ready');
        expect(screen.getByRole('alert')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        const retryFrame = screen.getByTitle('Embedded') as HTMLIFrameElement;
        expect(retryFrame).not.toBe(frame);
        send(retryFrame, 'ready');
        expect(screen.queryByRole('status')).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
        act(() => vi.advanceTimersByTime(101));
        expect(screen.queryByRole('alert')).toBeNull();
        expect(onClose).not.toHaveBeenCalled();
    });
    it('times out, retries with a fresh frame, and ignores late messages from the old frame', () => {
        vi.useFakeTimers();
        render(<InAppMessageIframe message={message} onClose={vi.fn()} />);
        const oldFrame = screen.getByTitle('Embedded') as HTMLIFrameElement;
        const oldWindow = oldFrame.contentWindow;
        act(() => vi.advanceTimersByTime(101));
        expect(screen.getByRole('alert')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        const frame = screen.getByTitle('Embedded') as HTMLIFrameElement;
        expect(frame).not.toBe(oldFrame);
        act(() =>
            window.dispatchEvent(
                new MessageEvent('message', {
                    source: oldWindow,
                    origin: 'https://example.com',
                    data: { type: 'LC_IN_APP_MESSAGE', event: 'ready' },
                })
            )
        );
        expect(screen.getByRole('status')).toBeTruthy();
        fireEvent.load(frame);
        expect(screen.queryByRole('status')).toBeNull();
    });
    it('required frames reject close/dismiss/Capgo but close after navigation', async () => {
        const onClose = vi.fn();
        const onAction = vi.fn();
        render(
            <InAppMessageIframe
                message={{ ...message, dismissible: false }}
                onClose={onClose}
                onAction={onAction}
            />
        );
        const frame = screen.getByTitle('Embedded') as HTMLIFrameElement;
        expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
        send(frame, 'close');
        send(frame, 'runAction', { type: 'dismiss' });
        send(frame, 'runAction', { type: 'capgoUpdate' });
        expect(onClose).not.toHaveBeenCalled();
        expect(mocks.runAction).not.toHaveBeenCalled();
        send(frame, 'runAction', { type: 'internalLink', path: '/wallet' });
        await waitFor(() => expect(onClose).toHaveBeenCalledWith('action'));
        expect(onAction).toHaveBeenCalledWith({ actionType: 'internalLink' });
    });
    it('does not close on no-op and discards completion after unmount', async () => {
        const onClose = vi.fn();
        mocks.runAction.mockResolvedValue('noop');
        const view = render(<InAppMessageIframe message={message} onClose={onClose} />);
        const frame = screen.getByTitle('Embedded') as HTMLIFrameElement;
        await act(async () => send(frame, 'runAction', { type: 'appStore' }));
        expect(onClose).not.toHaveBeenCalled();
        let resolve: (value: string) => void = () => undefined;
        mocks.runAction.mockImplementation(
            () =>
                new Promise<string>(done => {
                    resolve = done;
                })
        );
        send(frame, 'runAction', { type: 'internalLink', path: '/wallet' });
        view.unmount();
        await act(async () => resolve('closed'));
        expect(onClose).not.toHaveBeenCalled();
    });
    it('shows an offline error with retry', () => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
        render(<InAppMessageIframe message={message} onClose={vi.fn()} />);
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy();
    });
});
