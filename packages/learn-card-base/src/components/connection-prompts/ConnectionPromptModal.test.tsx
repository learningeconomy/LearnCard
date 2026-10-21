// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { LCNConnectionPrompt } from '@learncard/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectionPromptModal, type ConnectionPromptCopy } from './ConnectionPromptModal';

// UserProfilePicture's file also exports the signed-in avatar, whose color helper has a legacy
// root-barrel import. Keep that unrelated persisted-store graph out of this focused modal test.
vi.mock('learn-card-base', () => ({ CredentialCategoryEnum: {} }));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({ default: () => null }));

const prompt: LCNConnectionPrompt = {
    promptId: '11111111-1111-4111-8111-111111111111',
    status: 'PENDING',
    surface: 'POST_CLAIM',
    triggerId: 'credential-1',
    triggeredAt: '2026-08-20T12:00:00.000Z',
    updatedAt: '2026-08-20T12:00:00.000Z',
    counterpart: {
        profileId: 'alice',
        displayName: 'Alice',
        shortBio: '',
        image: '',
        heroImage: '',
        type: 'person',
        isServiceProfile: false,
        display: {},
    },
};

const copy: ConnectionPromptCopy = {
    title: name => `Connect with ${name}?`,
    description: 'Stay in touch and recognize what comes next.',
    connect: 'Connect',
    skipForNow: 'Skip for Now',
    connecting: 'Connecting...',
    skipping: 'Skipping...',
    error: 'Something went wrong. Please try again.',
};

const deferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return { promise, resolve, reject };
};

describe('ConnectionPromptModal', () => {
    const onConnect = vi.fn<() => Promise<void>>();
    const onSkip = vi.fn<() => Promise<void>>();

    beforeEach(() => {
        vi.clearAllMocks();
        onConnect.mockResolvedValue(undefined);
        onSkip.mockResolvedValue(undefined);
    });

    it('renders the counterpart and action copy with the shared modal styles', () => {
        const { container } = render(
            <ConnectionPromptModal
                prompt={prompt}
                copy={copy}
                onConnect={onConnect}
                onSkip={onSkip}
            />
        );

        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();
        const connect = screen.getByRole('button', { name: 'Connect' });
        const skip = screen.getByRole('button', { name: 'Skip for Now' });

        expect(connect.className).toContain('rounded-[20px]');
        expect(connect.className).toContain('bg-grayscale-900');
        expect(skip.className).toContain('rounded-[20px]');
        const insetTerm = ['safe', 'area'].join('-');
        expect(container.innerHTML).not.toMatch(
            new RegExp(`${insetTerm}|--ion-${insetTerm}|lc-overlay-inset`)
        );
    });

    it('connects only on explicit click and keeps the modal open with a friendly error on failure', async () => {
        const request = deferred<void>();
        onConnect.mockReturnValue(request.promise);
        render(
            <ConnectionPromptModal
                prompt={prompt}
                copy={copy}
                onConnect={onConnect}
                onSkip={onSkip}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connecting...' }));

        expect(onConnect).toHaveBeenCalledOnce();
        expect(onConnect).toHaveBeenCalledWith(prompt.promptId);
        expect(
            (screen.getByRole('button', { name: 'Connecting...' }) as HTMLButtonElement).disabled
        ).toBe(true);

        request.reject(new Error('raw backend details'));

        await waitFor(() => {
            expect(screen.getByText(copy.error)).toBeTruthy();
        });
        expect(screen.queryByText('raw backend details')).toBeNull();
        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();
    });

    it('shows contextual progress while skipping', async () => {
        const request = deferred<void>();
        onSkip.mockReturnValue(request.promise);
        render(
            <ConnectionPromptModal
                prompt={prompt}
                copy={copy}
                onConnect={onConnect}
                onSkip={onSkip}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Skip for Now' }));

        expect(onSkip).toHaveBeenCalledOnce();
        expect(onSkip).toHaveBeenCalledWith(prompt.promptId);
        expect(
            (screen.getByRole('button', { name: 'Skipping...' }) as HTMLButtonElement).disabled
        ).toBe(true);

        request.resolve(undefined);
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Skip for Now' })).toBeTruthy()
        );
    });

    it('uses logical start alignment for errors in an Arabic RTL context', async () => {
        const rtlCopy = {
            ...copy,
            error: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
        };
        onConnect.mockRejectedValue(new Error('raw backend details'));
        render(
            <div dir="rtl">
                <ConnectionPromptModal
                    prompt={prompt}
                    copy={rtlCopy}
                    onConnect={onConnect}
                    onSkip={onSkip}
                />
            </div>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

        const alert = await screen.findByRole('alert');
        expect(alert.closest('[dir="rtl"]')).toBeTruthy();
        expect(alert.className).toContain('text-start');
        expect(alert.className).not.toContain('text-left');
        expect(alert.textContent).toContain(rtlCopy.error);
    });
});
