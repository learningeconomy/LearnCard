import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';

import ProfileDeveloperProgram from './ProfileDeveloperProgram';
import LaunchPadBecomeAnApp from '../../pages/launchPad/LaunchPadBecomeAnApp';

vi.mock('./DeveloperRoleConfirmation', () => ({ default: () => null }));

const state = vi.hoisted(() => ({
    role: null as string | null,
    closeAllModals: vi.fn(),
    newModalWithToken: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useGetCurrentUserRole: () => state.role,
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
});

const renderEntry = (): void => {
    render(
        <MemoryRouter>
            <ProfileDeveloperProgram />
            <Route path="/app-store/developer" render={() => <h1>Developer portal</h1>} />
        </MemoryRouter>
    );
};

describe('profile Developer Program entry', () => {
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
                <Route path="/app-store/developer" render={() => <h1>Developer portal</h1>} />
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
