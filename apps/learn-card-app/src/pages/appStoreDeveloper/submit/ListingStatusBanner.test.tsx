import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ListingStatusBanner } from './ListingStatusBanner';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));

const renderBanner = (
    mode: React.ComponentProps<typeof ListingStatusBanner>['mode'],
    hasPendingChanges = false
) => {
    const onMakeChanges = vi.fn();
    const onDiscardChanges = vi.fn();
    render(
        <ListingStatusBanner
            mode={mode}
            hasPendingChanges={hasPendingChanges}
            isWorking={false}
            onMakeChanges={onMakeChanges}
            onDiscardChanges={onDiscardChanges}
        />
    );
    return { onMakeChanges, onDiscardChanges };
};

describe('ListingStatusBanner', () => {
    it('shows nothing for a draft', () => {
        const { container } = render(
            <ListingStatusBanner
                mode="draft"
                hasPendingChanges={false}
                isWorking={false}
                onMakeChanges={vi.fn()}
                onDiscardChanges={vi.fn()}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('asks before withdrawing an app from review', () => {
        const { onMakeChanges } = renderBanner('in-review');

        fireEvent.click(screen.getByRole('button', { name: 'Make Changes' }));
        expect(onMakeChanges).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Withdraw and Edit' }));
        expect(onMakeChanges).toHaveBeenCalledTimes(1);
    });

    it('explains that a live app stays live while its update is reviewed', () => {
        renderBanner('update-in-review');
        expect(screen.getByText(/stays live until it's approved/)).toBeInTheDocument();
    });

    it('offers to discard unsubmitted changes to a live app', () => {
        const { onDiscardChanges } = renderBanner('live', true);

        fireEvent.click(screen.getByRole('button', { name: 'Discard Changes' }));
        fireEvent.click(screen.getByRole('button', { name: 'Discard Changes' }));
        expect(onDiscardChanges).toHaveBeenCalledTimes(1);
    });

    it('has no discard action when a live app has no changes', () => {
        renderBanner('live', false);
        expect(screen.queryByRole('button')).toBeNull();
    });
});
