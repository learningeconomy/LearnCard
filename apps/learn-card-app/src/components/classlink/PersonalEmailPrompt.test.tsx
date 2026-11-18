// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as m from '../../paraglide/messages.js';

type Continuity = {
    personalEmail: { allowed: boolean; reason?: string };
    emailVerified: boolean;
    nextStep: 'email' | 'method' | 'done';
};

const mocks = vi.hoisted(() => ({
    features: { classlinkSso: true, classlinkPersonalEmail: true } as Record<string, boolean>,
    session: { classlink: true, student: false },
    continuity: undefined as Continuity | undefined,
    continuityHook: vi.fn(),
    start: vi.fn(),
    verify: vi.fn(),
}));

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('learn-card-base', () => ({
    useFeatureConfig: () => mocks.features,
    useClassLinkAccountContinuity: (options?: { enabled?: boolean }) => {
        mocks.continuityHook(options);
        return { data: mocks.continuity, isError: false };
    },
    useStartPersonalEmail: () => ({ mutateAsync: mocks.start, isPending: false }),
    useVerifyPersonalEmail: () => ({ mutateAsync: mocks.verify, isPending: false }),
}));
vi.mock('../../auth/classlink/classlinkProfileDefaults', () => ({
    getClassLinkSession: async () => mocks.session,
}));

import { PersonalEmailPrompt, isPersonalEmailPromptEnabled } from './PersonalEmailPrompt';

const allowed = (overrides: Partial<Continuity> = {}): Continuity => ({
    personalEmail: { allowed: true },
    emailVerified: false,
    nextStep: 'email',
    ...overrides,
});
const trpcError = (code: string) => Object.assign(new Error('server copy'), { data: { code } });

/** Lets the async session check settle so "not shown" assertions are meaningful. */
const flush = async (): Promise<void> => {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });
};

describe('PersonalEmailPrompt gating', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear?.();
        mocks.features = { classlinkSso: true, classlinkPersonalEmail: true };
        mocks.session = { classlink: true, student: false };
        mocks.continuity = allowed();
    });
    afterEach(cleanup);

    it('requires both tenant flags', () => {
        expect(isPersonalEmailPromptEnabled({ classlinkSso: true })).toBe(false);
        expect(isPersonalEmailPromptEnabled({ classlinkPersonalEmail: true })).toBe(false);
        expect(
            isPersonalEmailPromptEnabled({ classlinkSso: true, classlinkPersonalEmail: true })
        ).toBe(true);
    });

    it('stays off once the keep-account flow is on, so the email is never asked twice', async () => {
        const all = {
            classlinkSso: true,
            classlinkPersonalEmail: true,
            classlinkKeepAccount: true,
        };
        expect(isPersonalEmailPromptEnabled(all)).toBe(false);
        mocks.features = all;
        render(<PersonalEmailPrompt />);
        await act(async () => {
            await Promise.resolve();
        });
        expect(screen.queryByTestId('classlink-email-prompt')).toBeNull();
        expect(mocks.continuityHook).not.toHaveBeenCalled();
    });

    it('shows the invitation when the server allows a personal email', async () => {
        render(<PersonalEmailPrompt />);
        expect(await screen.findByTestId('classlink-email-prompt')).toBeTruthy();
        expect(mocks.continuityHook).toHaveBeenCalledWith({ enabled: true });
    });

    it('never asks the server when the tenant flag is off', async () => {
        mocks.features = { classlinkSso: true, classlinkPersonalEmail: false };
        render(<PersonalEmailPrompt />);
        await flush();
        expect(mocks.continuityHook).not.toHaveBeenCalled();
        expect(screen.queryByTestId('classlink-email-prompt')).toBeNull();
    });

    it('is not shown to non-ClassLink sessions', async () => {
        mocks.session = { classlink: false, student: false };
        render(<PersonalEmailPrompt />);
        await flush();
        expect(mocks.continuityHook).not.toHaveBeenCalled();
    });

    it('follows the server, not the client, for students', async () => {
        mocks.session = { classlink: true, student: true };
        render(<PersonalEmailPrompt />);
        expect(await screen.findByTestId('classlink-email-prompt')).toBeTruthy();
    });

    it('is hidden when the server refuses this account', async () => {
        mocks.continuity = allowed({
            personalEmail: { allowed: false, reason: 'students_excluded' },
        });
        render(<PersonalEmailPrompt />);
        await flush();
        expect(mocks.continuityHook).toHaveBeenCalled();
        expect(screen.queryByTestId('classlink-email-prompt')).toBeNull();
    });

    it('is hidden once a personal email is verified', async () => {
        mocks.continuity = allowed({ emailVerified: true, nextStep: 'method' });
        render(<PersonalEmailPrompt />);
        await flush();
        expect(screen.queryByTestId('classlink-email-prompt')).toBeNull();
    });

    it('maps errors by tRPC code, not by the server message', async () => {
        mocks.start
            .mockRejectedValueOnce(trpcError('BAD_REQUEST'))
            .mockResolvedValueOnce({ success: true });
        mocks.verify.mockRejectedValueOnce(trpcError('CONFLICT'));
        render(<PersonalEmailPrompt />);
        fireEvent.change(await screen.findByTestId('classlink-email-input'), {
            target: { value: 'me@school.example' },
        });
        await act(async () => {
            fireEvent.click(screen.getByTestId('classlink-email-submit'));
        });
        expect(screen.getByRole('alert').textContent).toBe(
            m['classlinkKeepAccount.emailRejected']()
        );

        await act(async () => {
            fireEvent.click(screen.getByTestId('classlink-email-submit'));
        });
        // The code is checked as soon as the last digit is in (here, all at once by autofill).
        await act(async () => {
            fireEvent.change(screen.getByLabelText('Code digit 1'), {
                target: { value: '123456' },
            });
        });
        expect(mocks.verify).toHaveBeenCalledWith({ email: 'me@school.example', code: '123456' });
        // A taken address is about the email: back to its field, with the error under it.
        expect(screen.getByTestId('classlink-email-input')).toBeTruthy();
        expect(screen.getByRole('alert').textContent).toBe(
            m['classlinkPersonalEmail.conflictError']()
        );
    });
});
