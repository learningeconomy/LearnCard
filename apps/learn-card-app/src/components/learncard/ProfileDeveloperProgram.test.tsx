import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';

import ProfileDeveloperProgram from './ProfileDeveloperProgram';
import LaunchPadBecomeAnApp from '../../pages/launchPad/LaunchPadBecomeAnApp';

vi.mock('./DeveloperRoleConfirmation', () => ({ default: () => null }));

const state = vi.hoisted(() => ({
    role: null as string | null,
    profileType: 'parent' as string | null,
    type: undefined as string | undefined,
    hasProfile: true,
    pending: false,
    error: false,
    fetching: false,
    closeAllModals: vi.fn(),
    newModalWithToken: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useGetProfile: () => ({
        data: state.hasProfile
            ? { profileId: 'alice', role: state.role, type: state.type }
            : undefined,
        isPending: state.pending,
        isError: state.error,
        isFetching: state.fetching,
    }),
    switchedProfileStore: {
        use: { profileType: () => state.profileType },
        get: { profileType: () => state.profileType },
    },
    ModalTypes: { Center: 'center' },
    useModal: () => ({
        closeAllModals: state.closeAllModals,
        newModalWithToken: state.newModalWithToken,
        forceCloseModalByToken: vi.fn(),
    }),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    state.role = null;
    state.profileType = 'parent';
    state.type = undefined;
    state.hasProfile = true;
    state.pending = false;
    state.error = false;
    state.fetching = false;
});

const renderEntry = (): void => {
    render(
        <MemoryRouter>
            <ProfileDeveloperProgram />
            <Routes>
                <Route path="/app-store/developer/*" element={<h1>Developer portal</h1>} />
                <Route path="*" element={null} />
            </Routes>
        </MemoryRouter>
    );
};

describe('profile Developer Program entry', () => {
    it.each(['loading', 'error', 'missing'])(
        'hides role actions when the profile is %s',
        status => {
            state.hasProfile = false;
            state.pending = status === 'loading';
            state.error = status === 'error';
            renderEntry();
            expect(screen.queryByRole('button')).toBeNull();
            expect(screen.queryByText('Developer Program')).toBeNull();
        }
    );

    it.each(['developer', 'learner'])(
        'keeps the known %s content during background refetches',
        role => {
            state.role = role;
            state.fetching = true;
            renderEntry();
            expect(
                screen.getByRole('button', {
                    name: role === 'developer' ? 'Developer Program' : 'Become a Developer',
                })
            ).toBeTruthy();
        }
    );

    it.each(['developer', 'learner'])('hides every CTA for child accounts with role %s', role => {
        state.role = role;
        state.profileType = 'child';
        renderEntry();
        expect(screen.queryByRole('button')).toBeNull();
        expect(screen.queryByText('Developer Program')).toBeNull();
    });

    it('also hides a child network profile before the switched-profile metadata catches up', () => {
        state.type = 'child';
        renderEntry();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it.each(['parent', 'service', null])(
        'keeps the entry available for eligible profile type %s',
        profileType => {
            state.profileType = profileType;
            state.role = 'developer';
            renderEntry();
            expect(screen.getByRole('button', { name: 'Developer Program' })).toBeTruthy();
        }
    );

    it('supports opening the portal using only the keyboard', async () => {
        state.role = 'developer';
        renderEntry();
        userEvent.tab();
        expect(document.activeElement).toBe(
            screen.getByRole('button', { name: 'Developer Program' })
        );
        await act(async () => {
            await userEvent.type(document.activeElement as HTMLElement, '{enter}', {
                skipClick: true,
            });
        });
        expect(screen.getByRole('heading', { name: 'Developer portal' })).toBeTruthy();
    });

    it('opens the same destination as Browse More and dismisses the profile overlay', () => {
        state.role = 'developer';
        renderEntry();
        const button = screen.getByRole('button', { name: 'Developer Program' });
        button.focus();
        expect(document.activeElement).toBe(button);
        expect(button.className).toContain('focus-visible:ring-2');
        fireEvent.click(button);
        expect(screen.getByRole('heading', { name: 'Developer portal' })).toBeTruthy();
        expect(state.closeAllModals).toHaveBeenCalledOnce();
        expect(state.newModalWithToken).not.toHaveBeenCalled();

        cleanup();
        render(
            <MemoryRouter>
                <LaunchPadBecomeAnApp />
                <Routes>
                    <Route path="/app-store/developer/*" element={<h1>Developer portal</h1>} />
                    <Route path="*" element={null} />
                </Routes>
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: /Developer Program/ }));
        expect(screen.getByRole('heading', { name: 'Developer portal' })).toBeTruthy();
    });

    it.each(['learner', 'teacher', null])('invites a %s to confirm a role change', role => {
        state.role = role;
        renderEntry();
        expect(screen.queryByRole('button', { name: 'Developer Program' })).toBeNull();
        expect(screen.getByRole('heading', { name: 'Developer Program' })).toBeTruthy();
        expect(
            screen.getByText(
                'Interested in building with LearnCard? Switch to the Developer role to explore developer tools.'
            )
        ).toBeTruthy();
        const button = screen.getByRole('button', { name: 'Become a Developer' });
        button.focus();
        expect(document.activeElement).toBe(button);
        fireEvent.click(button);
        expect(state.newModalWithToken).toHaveBeenCalledOnce();
        expect(state.closeAllModals).not.toHaveBeenCalled();
        expect(screen.queryByRole('heading', { name: 'Developer portal' })).toBeNull();
    });
});
