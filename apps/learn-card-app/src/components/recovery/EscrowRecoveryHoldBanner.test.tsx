import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EscrowRecoveryHoldBanner } from './EscrowRecoveryHoldBanner';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));

describe('EscrowRecoveryHoldBanner', () => {
    it('renders the request date and hides after cancellation', async () => {
        const onCancel = vi.fn().mockResolvedValue(undefined);
        const requestedAt = '2026-09-01T12:00:00Z';
        render(<EscrowRecoveryHoldBanner requestedAt={requestedAt} onCancel={onCancel} />);
        expect(
            screen.getByText(
                new RegExp(
                    new Date(requestedAt).toLocaleString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                )
            )
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel recovery request' }));
        await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument());
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
    it('shows friendly failure copy and allows retry', async () => {
        render(
            <EscrowRecoveryHoldBanner
                requestedAt="2026-09-01"
                onCancel={vi.fn().mockRejectedValue(new Error('private server error'))}
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(
            await screen.findByText('Something went wrong. Please try again.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeEnabled();
        expect(screen.queryByText('private server error')).not.toBeInTheDocument();
    });
});
