import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The modal body chunk. `requested` counts how often the app asks for it.
const chunk = { requested: 0 };

/** A fresh copy of the modal module and the first-screen signal it waits on. */
const loadModal = async () => {
    vi.resetModules();
    chunk.requested = 0;
    vi.doMock('./MyLearnCardModalContent', () => {
        chunk.requested += 1;
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
    vi.useRealTimers();
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

        it('fetches the chunk after the first screen paints and the browser goes idle, before any open', async () => {
            const {
                prefetchMyLearnCardWhenIdle,
                markFirstScreenPainted,
                default: Modal,
            } = await loadModal();

            prefetchMyLearnCardWhenIdle();
            await settle();
            expect(chunk.requested).toBe(0);

            markFirstScreenPainted();
            await settle();
            expect(chunk.requested).toBe(0);

            idle.forEach(run => run());
            await settle();
            expect(chunk.requested).toBe(1);

            render(<Modal branding={'learncard' as never} />);
            expect(await screen.findByText('My LearnCard body')).toBeTruthy();
            expect(chunk.requested).toBe(1);
        });

        it('does nothing if cancelled before the browser goes idle', async () => {
            const { prefetchMyLearnCardWhenIdle, markFirstScreenPainted } = await loadModal();

            const cancel = prefetchMyLearnCardWhenIdle();
            markFirstScreenPainted();
            await settle();
            cancel();
            idle.forEach(run => run());
            await settle();

            expect(chunk.requested).toBe(0);
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

        expect(chunk.requested).toBe(1);
    });

    it.each(['pointerEnter', 'focus', 'pointerDown', 'touchStart'] as const)(
        'fetches the chunk on %s of a trigger, before the click',
        async event => {
            const { myLearnCardIntentHandlers } = await loadModal();
            render(
                <button type="button" {...myLearnCardIntentHandlers}>
                    Open profile
                </button>
            );

            fireEvent[event](screen.getByRole('button', { name: 'Open profile' }));
            await settle();

            expect(chunk.requested).toBe(1);
        }
    );
});
