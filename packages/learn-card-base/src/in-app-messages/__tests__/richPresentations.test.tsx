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
import { localizeMessage } from '../localizeMessage';

const mocks = vi.hoisted(() => ({
    runAction: vi.fn(),
    startUpdate: vi.fn(),
    status: 'idle',
    native: false,
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => mocks.native } }));
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
    mocks.startUpdate
        .mockReset()
        .mockImplementation(async (onComplete?: () => void) => onComplete?.());
    mocks.status = 'idle';
    mocks.native = false;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
            actionSource: 'message',
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
    it('renders localized final actions and identifies their source in analytics', async () => {
        const onAction = vi.fn();
        const localized = localizeMessage(
            inAppMessageValidator.parse({
                ...message,
                steps: [
                    {
                        title: 'Final',
                        actions: [{ label: 'Finish step', action: { type: 'dismiss' } }],
                    },
                ],
                locales: { es: { steps: [{ actionLabels: ['Listo'] }] } },
            }),
            'es'
        );
        render(<InAppMessageStory message={localized} onClose={vi.fn()} onAction={onAction} />);
        expect(screen.queryByRole('button', { name: 'Finish' })).toBeNull();
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Listo' })));
        expect(onAction).toHaveBeenCalledExactlyOnceWith({
            actionIndex: 0,
            actionSource: 'step',
            actionType: 'dismiss',
            stepIndex: 0,
        });
    });
    it('responds to direction changes when handling keyboard navigation', async () => {
        const view = render(<InAppMessageStory message={message} onClose={vi.fn()} />);
        const root = view.container.firstElementChild as HTMLElement;
        root.style.direction = 'rtl';
        fireEvent.keyDown(screen.getByRole('button', { name: 'Next' }), { key: 'ArrowRight' });
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
        fireEvent.keyDown(screen.getByRole('button', { name: 'Next' }), { key: 'ArrowLeft' });
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2');
        fireEvent.keyDown(screen.getByRole('button', { name: 'Previous' }), { key: 'ArrowLeft' });
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2');
        root.style.direction = 'ltr';
        fireEvent.keyDown(screen.getByRole('button', { name: 'Previous' }), { key: 'ArrowLeft' });
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
    });
    it.each(['ltr', 'rtl'])('maps taps and swipes to reading direction in %s', direction => {
        vi.stubGlobal('PointerEvent', MouseEvent);
        const view = render(<InAppMessageStory message={message} onClose={vi.fn()} />);
        const root = view.container.firstElementChild as HTMLElement;
        root.style.direction = direction;
        const content = root.querySelector('.touch-pan-y') as HTMLElement;
        vi.spyOn(content, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 300, 200));
        const gesture = (start: number, end: number): void => {
            fireEvent.pointerDown(content, { clientX: start, clientY: 100, button: 0 });
            fireEvent.pointerUp(content, { clientX: end, clientY: 100, button: 0 });
        };
        const forward = direction === 'rtl' ? 20 : 280;
        const back = direction === 'rtl' ? 280 : 20;
        gesture(forward, forward);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2');
        gesture(back, back);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
        gesture(forward, back);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2');
        gesture(back, forward);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
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
                ...(presentation === 'story' ? { steps: [{ title: 'Update' }] } : {}),
                actions: [{ label: 'Open store', action: { type: 'appStore' } }],
            });
            const onClose = vi.fn();
            const onAction = vi.fn();
            mocks.runAction.mockResolvedValueOnce('noop').mockResolvedValueOnce('closed');
            render(<Component message={message} onClose={onClose} onAction={onAction} />);
            const actionButton = screen.getByRole('button', {
                name: presentation === 'toast' ? 'Update available' : 'Open store',
            });
            await act(async () => fireEvent.click(actionButton));
            expect(mocks.runAction).toHaveBeenCalledOnce();
            expect(onClose).not.toHaveBeenCalled();
            expect(onAction).not.toHaveBeenCalled();
            await act(async () => fireEvent.click(actionButton));
            expect(mocks.runAction).toHaveBeenCalledTimes(2);
            expect(onClose).toHaveBeenCalledOnce();
            expect(onAction).toHaveBeenCalledOnce();
            expect(onClose.mock.calls[0]?.[0]).toBe('action');
        }
    );
    it.each([
        ['modal', InAppMessageModal],
        ['story', InAppMessageStory],
        ['banner', InAppMessageBanner],
        ['toast', InAppMessageToast],
    ] as const)(
        'does not count pending or rejected %s actions and allows retry',
        async (presentation, Component) => {
            const message = inAppMessageValidator.parse({
                id: 'failure',
                title: 'Try opening',
                presentation,
                ...(presentation === 'story' ? { steps: [{ title: 'Final' }] } : {}),
                actions: [
                    { label: 'Open', action: { type: 'externalLink', url: 'https://example.com' } },
                ],
            });
            let rejectAction: (error: Error) => void = () => undefined;
            mocks.runAction.mockImplementationOnce(
                () =>
                    new Promise((_resolve, reject) => {
                        rejectAction = reject;
                    })
            );
            const onAction = vi.fn();
            const onClose = vi.fn();
            render(<Component message={message} onClose={onClose} onAction={onAction} />);
            const button = screen.getByRole('button', {
                name: presentation === 'toast' ? 'Try opening' : 'Open',
            });
            fireEvent.click(button);
            expect(onAction).not.toHaveBeenCalled();
            await act(async () => rejectAction(new Error('Failed')));
            expect(onAction).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
            expect(screen.getByRole('alert')).toBeTruthy();
            await act(async () => fireEvent.click(button));
            expect(onAction).toHaveBeenCalledOnce();
            expect(onClose).toHaveBeenCalledOnce();
        }
    );
});

describe('iframe lifecycle', () => {
    it.each([false, true])(
        'never creates a remote native frame, even when rendered directly (dismissible: %s)',
        dismissible => {
            mocks.native = true;
            const createElement = vi.spyOn(document, 'createElement');
            const onClose = vi.fn();
            const { container } = render(
                <InAppMessageIframe
                    message={inAppMessageValidator.parse({
                        id: 'native-probe',
                        title: 'Native bridge probe',
                        presentation: 'iframe',
                        dismissible,
                        iframe: { url: 'https://campaign.example/native-bridge-probe.html' },
                    })}
                    onClose={onClose}
                />
            );
            expect(createElement.mock.calls.some(([tag]) => tag === 'iframe')).toBe(false);
            expect(container.childElementCount).toBe(0);
            expect(mocks.runAction).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
        }
    );
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
        iframe: {
            url: 'https://example.com/page',
            loadTimeoutMs: 100,
            allowedInternalPaths: ['/wallet'],
        },
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
    it.each(['same-origin', 'offline', 'timeout', 'frame-error'])(
        'lets the user close a required iframe after %s failure',
        failure => {
            vi.useFakeTimers();
            if (failure === 'offline') {
                Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
            }
            const onClose = vi.fn();
            render(
                <InAppMessageIframe
                    message={{
                        ...message,
                        dismissible: false,
                        iframe: {
                            ...message.iframe!,
                            url:
                                failure === 'same-origin'
                                    ? 'https://app.example/content'
                                    : message.iframe!.url,
                        },
                    }}
                    onClose={onClose}
                />
            );
            if (failure === 'timeout' || failure === 'frame-error') {
                expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
                const frame = screen.getByTitle('Embedded');
                if (failure === 'frame-error') fireEvent.error(frame);
                else {
                    fireEvent.load(frame);
                    act(() => vi.advanceTimersByTime(101));
                }
            }
            expect(screen.getByRole('alert')).toBeTruthy();
            fireEvent.click(screen.getByRole('button', { name: 'Close' }));
            expect(onClose).toHaveBeenCalledExactlyOnceWith('dismissed');
        }
    );
    it('times out a required iframe at the maximum configured duration', () => {
        vi.useFakeTimers();
        render(
            <InAppMessageIframe
                message={inAppMessageValidator.parse({
                    ...message,
                    dismissible: false,
                    iframe: { ...message.iframe!, loadTimeoutMs: 30000 },
                })}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByRole('status')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
        act(() => vi.advanceTimersByTime(29999));
        expect(screen.getByRole('status')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
        act(() => vi.advanceTimersByTime(1));
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
    });
    it('does not run or report undeclared bridge navigation', async () => {
        const onClose = vi.fn();
        const onAction = vi.fn();
        render(<InAppMessageIframe message={message} onClose={onClose} onAction={onAction} />);
        const frame = screen.getByTitle('Embedded') as HTMLIFrameElement;
        for (const path of ['/request', '/wallet?uri=untrusted', '/wallet#untrusted']) {
            await act(async () => send(frame, 'runAction', { type: 'internalLink', path }));
        }
        expect(mocks.runAction).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(onAction).not.toHaveBeenCalled();
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
        const onAction = vi.fn();
        mocks.runAction.mockResolvedValue('noop');
        const view = render(
            <InAppMessageIframe message={message} onClose={onClose} onAction={onAction} />
        );
        const frame = screen.getByTitle('Embedded') as HTMLIFrameElement;
        await act(async () => send(frame, 'runAction', { type: 'appStore' }));
        expect(onClose).not.toHaveBeenCalled();
        expect(onAction).not.toHaveBeenCalled();
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
        expect(onAction).not.toHaveBeenCalled();
    });
    it('does not report pending or rejected bridge actions', async () => {
        let rejectAction: (error: Error) => void = () => undefined;
        mocks.runAction.mockImplementationOnce(
            () =>
                new Promise((_resolve, reject) => {
                    rejectAction = reject;
                })
        );
        const onAction = vi.fn();
        const onClose = vi.fn();
        render(<InAppMessageIframe message={message} onClose={onClose} onAction={onAction} />);
        send(screen.getByTitle('Embedded') as HTMLIFrameElement, 'runAction', {
            type: 'externalLink',
            url: 'https://example.com',
        });
        expect(onAction).not.toHaveBeenCalled();
        await act(async () => rejectAction(new Error('Failed')));
        expect(onAction).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toBeTruthy();
    });
    it('shows an offline error with retry', () => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
        render(<InAppMessageIframe message={message} onClose={vi.fn()} />);
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy();
    });
});
