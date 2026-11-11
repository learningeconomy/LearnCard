// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    features: { classlinkSso: true, classlinkPersonalEmail: true } as Record<string, boolean>,
    preferences: { isMinor: false } as { isMinor?: boolean } | undefined,
    session: { classlink: true, student: false },
    personalEmail: vi.fn(),
    preferencesHook: vi.fn(),
}));

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('learn-card-base', () => ({
    useFeatureConfig: () => mocks.features,
    useGetPreferencesForDid: (enabled: boolean) => {
        mocks.preferencesHook(enabled);
        return { data: enabled ? mocks.preferences : undefined, isLoading: false };
    },
    useClassLinkPersonalEmail: (options?: { enabled?: boolean }) => {
        mocks.personalEmail(options);
        return { data: { verified: false }, isError: false };
    },
    useStartPersonalEmail: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useVerifyPersonalEmail: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('../../auth/classlink/classlinkProfileDefaults', () => ({
    getClassLinkSession: async () => mocks.session,
}));

import { PersonalEmailPrompt, isPersonalEmailPromptEnabled } from './PersonalEmailPrompt';

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
        mocks.preferences = { isMinor: false };
        mocks.session = { classlink: true, student: false };
    });
    afterEach(cleanup);

    it('requires both tenant flags', () => {
        expect(isPersonalEmailPromptEnabled({ classlinkSso: true })).toBe(false);
        expect(isPersonalEmailPromptEnabled({ classlinkPersonalEmail: true })).toBe(false);
        expect(
            isPersonalEmailPromptEnabled({ classlinkSso: true, classlinkPersonalEmail: true })
        ).toBe(true);
    });

    it('shows the invitation to an eligible non-student ClassLink account', async () => {
        render(<PersonalEmailPrompt />);
        expect(await screen.findByTestId('classlink-email-prompt')).toBeTruthy();
    });

    it('never requests personal-email status when the tenant flag is off', async () => {
        mocks.features = { classlinkSso: true, classlinkPersonalEmail: false };
        render(<PersonalEmailPrompt />);
        await flush();
        expect(mocks.personalEmail).not.toHaveBeenCalled();
        expect(mocks.preferencesHook).toHaveBeenCalledWith(false);
        expect(screen.queryByTestId('classlink-email-prompt')).toBeNull();
    });

    it('is never shown to ClassLink student sessions', async () => {
        mocks.session = { classlink: true, student: true };
        render(<PersonalEmailPrompt />);
        await flush();
        expect(mocks.personalEmail).not.toHaveBeenCalled();
        expect(screen.queryByTestId('classlink-email-prompt')).toBeNull();
    });

    it('is never shown to accounts locked as minors', async () => {
        mocks.preferences = { isMinor: true };
        render(<PersonalEmailPrompt />);
        await flush();
        expect(mocks.personalEmail).not.toHaveBeenCalled();
        expect(screen.queryByTestId('classlink-email-prompt')).toBeNull();
    });

    it('is not shown to non-ClassLink sessions', async () => {
        mocks.session = { classlink: false, student: false };
        render(<PersonalEmailPrompt />);
        await flush();
        expect(mocks.personalEmail).not.toHaveBeenCalled();
    });
});
