import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `warmed` counts HTTP-cache prefetches; `imported` counts imports of the modal module.
const calls = { warmed: 0, imported: 0 };

/** A fresh copy of the modal module and the first-screen signal it waits on. */
const loadModal = async () => {
    vi.resetModules();
    calls.warmed = 0;
    calls.imported = 0;
    vi.doMock('../../helpers/prefetchChunk', () => ({
        prefetchChunk: (key: string) => {
            expect(key).toBe('my-learncard');
            calls.warmed += 1;
            return Promise.resolve(true);
        },
    }));
    vi.doMock('./MyLearnCardModalContent', () => {
        calls.imported += 1;
        return { default: () => <p>My LearnCard body</p> };
    });
    const modal = await import('./MyLearnCardModal');
    const firstScreen = await import('learn-card-base/helpers/firstScreen');
    return { ...modal, markFirstScreenPainted: firstScreen.markFirstScreenPainted };
};

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

const originalRic = window.requestIdleCallback;

afterEach(() => {
    cleanup();
    window.requestIdleCallback = originalRic;
});

describe('My LearnCard modal prefetch', () => {
    describe('idle', () => {
        let idle: Array<() => void>;
        beforeEach(() => {
            idle = [];
            window.requestIdleCallback = ((cb: IdleRequestCallback) => {
                idle.push(() => cb({ didTimeout: false, timeRemaining: () => 50 }));
                return idle.length;
            }) as typeof window.requestIdleCallback;
        });

        it('warms the chunk after the first screen paints and the browser goes idle, without importing it', async () => {
            const {
                prefetchMyLearnCardWhenIdle,
                markFirstScreenPainted,
                default: Modal,
            } = await loadModal();

            prefetchMyLearnCardWhenIdle();
            await settle();
            expect(calls.warmed).toBe(0);

            markFirstScreenPainted();
            await settle();
            expect(calls.warmed).toBe(0);

            idle.forEach(run => run());
            await settle();
            expect(calls.warmed).toBe(1);
            // A speculative import() that fails is remembered by the browser; only the open imports.
            expect(calls.imported).toBe(0);

            render(<Modal branding={'learncard' as never} />);
            expect(await screen.findByText('My LearnCard body')).toBeTruthy();
            expect(calls.imported).toBe(1);
        });

        it('does nothing if cancelled before the browser goes idle', async () => {
            const { prefetchMyLearnCardWhenIdle, markFirstScreenPainted } = await loadModal();

            const cancel = prefetchMyLearnCardWhenIdle();
            markFirstScreenPainted();
            await settle();
            cancel();
            idle.forEach(run => run());
            await settle();

            expect(calls.warmed).toBe(0);
        });
    });

    it('falls back to a timer where requestIdleCallback is missing', async () => {
        // @ts-expect-error simulate Safari, which has no requestIdleCallback
        delete window.requestIdleCallback;
        const { prefetchMyLearnCardWhenIdle, markFirstScreenPainted } = await loadModal();

        prefetchMyLearnCardWhenIdle();
        markFirstScreenPainted();
        await settle();
        await new Promise(resolve => setTimeout(resolve, 250));

        expect(calls.warmed).toBe(1);
    });

    it.each(['pointerEnter', 'focus', 'pointerDown', 'touchStart'] as const)(
        'warms the chunk on %s of a trigger, before the click',
        async event => {
            const { myLearnCardIntentHandlers } = await loadModal();
            render(
                <button type="button" {...myLearnCardIntentHandlers}>
                    Open profile
                </button>
            );

            fireEvent[event](screen.getByRole('button', { name: 'Open profile' }));
            await settle();

            expect(calls.warmed).toBe(1);
            expect(calls.imported).toBe(0);
        }
    );
});
