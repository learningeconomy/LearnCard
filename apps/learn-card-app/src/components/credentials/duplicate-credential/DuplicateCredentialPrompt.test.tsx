import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import { DuplicateCredentialPrompt } from './DuplicateCredentialPrompt';

vi.mock('learn-card-base', () => ({
    Overlay: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getCredentialName: () => 'Safety Training',
    getImageUrlFromCredential: () => undefined,
}));

const existing = {
    credential: {
        id: 'urn:uuid:safety-training',
        type: ['VerifiableCredential'],
    } as VC,
    record: { uri: 'lc:credential:existing' },
};

describe('DuplicateCredentialPrompt', () => {
    it('presents the saved credential and returns each explicit decision', async () => {
        const onChoose = vi.fn();
        const { rerender } = render(
            <DuplicateCredentialPrompt existing={existing} onChoose={onChoose} />
        );

        expect(screen.getByRole('dialog', { name: 'Already saved' })).toBeVisible();
        expect(screen.getByText('Safety Training')).toBeVisible();
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Skip This Copy' })).toHaveFocus()
        );
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onChoose).toHaveBeenLastCalledWith('cancel');
        onChoose.mockClear();

        fireEvent.click(screen.getByRole('button', { name: 'Save Another Copy' }));
        expect(onChoose).toHaveBeenLastCalledWith('save');

        rerender(<DuplicateCredentialPrompt existing={existing} onChoose={onChoose} />);
        fireEvent.click(screen.getByRole('button', { name: 'Skip This Copy' }));
        expect(onChoose).toHaveBeenLastCalledWith('skip');

        rerender(<DuplicateCredentialPrompt existing={existing} onChoose={onChoose} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onChoose).toHaveBeenLastCalledWith('cancel');
    });
});
