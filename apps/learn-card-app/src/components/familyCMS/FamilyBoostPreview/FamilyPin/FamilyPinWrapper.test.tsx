import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as m from '../../../../paraglide/messages.js';

const state = vi.hoisted(() => ({ verifyPin: vi.fn() }));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ warn: vi.fn(), error: vi.fn() }),
    currentUserStore: {
        get: { parentUserDid: () => 'did:example:parent', parentUser: () => null },
    },
    switchedProfileStore: { use: { isSwitchedProfile: () => true } },
    useVerifyPin: () => ({ mutateAsync: state.verifyPin }),
    useModal: () => ({ closeModal: vi.fn(), newModal: vi.fn() }),
    useCurrentUser: () => ({ name: 'Adult' }),
    ProfilePicture: () => null,
    ModalTypes: { Cancel: 'cancel' },
}));
vi.mock('./ForgotPinConfirmation', () => ({ default: () => null }));
import FamilyPinWrapper, { FamilyPinViewModeEnum } from './FamilyPinWrapper';

const enterPin = () => {
    for (const digit of '12345')
        fireEvent.click(screen.getByRole('button', { name: digit, exact: true }));
    fireEvent.click(
        screen.getByRole('button', { name: m['family.pinModal.verifyTitle'](), exact: true })
    );
};
const mount = (handleOnSubmit: () => Promise<void>) =>
    render(
        <FamilyPinWrapper
            viewMode={FamilyPinViewModeEnum.edit}
            existingPin={['', '', '', '', '']}
            handleOnSubmit={handleOnSubmit}
        />
    );

describe('verified family PIN action completion', () => {
    beforeEach(() => {
        state.verifyPin.mockReset().mockResolvedValue(true);
    });
    afterEach(cleanup);

    it('keeps the action busy until it settles, then shows a retryable action error rather than blaming the PIN', async () => {
        let rejectAction!: (error: Error) => void;
        const action = new Promise<void>((_resolve, reject) => {
            rejectAction = reject;
        });
        mount(() => action);
        enterPin();
        await waitFor(() =>
            expect(
                screen
                    .getByRole('button', { name: m['family.pinModal.verifying']() })
                    .hasAttribute('disabled')
            ).toBe(true)
        );
        await act(async () => rejectAction(new Error('Wallet unavailable')));
        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toBe(m['error.generic']());
        expect(screen.queryByText(m['family.pinModal.invalidPin']())).toBeNull();
        expect(
            screen
                .getByRole('button', { name: m['family.pinModal.verifyTitle'](), exact: true })
                .hasAttribute('disabled')
        ).toBe(false);
    });

    it('still blocks the protected action and reports PIN validation when verification rejects', async () => {
        state.verifyPin.mockRejectedValue(new Error('Incorrect PIN'));
        const action = vi.fn(async () => undefined);
        mount(action);
        enterPin();
        await screen.findByText(m['family.pinModal.invalidPin']());
        expect(screen.queryByRole('alert')).toBeNull();
        expect(action).not.toHaveBeenCalled();
    });
});
