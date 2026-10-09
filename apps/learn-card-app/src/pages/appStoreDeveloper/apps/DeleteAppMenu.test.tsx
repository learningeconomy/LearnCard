import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteAppMenu, isAppDeletable } from './DeleteAppMenu';
import type { ListingMode } from '../submit/listingLifecycle';

const mocks = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeModal: vi.fn(),
}));

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));
vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModal: mocks.newModal, closeModal: mocks.closeModal }),
    ModalTypes: { Center: 'center', BottomSheet: 'bottom-sheet' },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
    useToast: () => ({ presentToast: vi.fn(), dismissToast: vi.fn() }),
    ToastTypeEnum: { Success: 'success', Error: 'error' },
    useWallet: () => ({ initWallet: vi.fn() }),
}));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('../useDeveloperPortal', () => ({
    useDeveloperPortal: () => ({
        useDeleteListing: () => ({ mutateAsync: vi.fn(), isPending: false }),
    }),
}));

const renderMenu = (mode: ListingMode) =>
    render(
        <DeleteAppMenu
            listingId="listing-1"
            integrationId="integration-1"
            displayName="Quiz Quest"
            mode={mode}
        />
    );

describe('isAppDeletable', () => {
    it('is true only for draft and removed listings', () => {
        expect(isAppDeletable('draft')).toBe(true);
        expect(isAppDeletable('removed')).toBe(true);
        expect(isAppDeletable('in-review')).toBe(false);
        expect(isAppDeletable('update-in-review')).toBe(false);
        expect(isAppDeletable('live')).toBe(false);
    });
});

describe('DeleteAppMenu', () => {
    beforeEach(() => {
        mocks.newModal.mockReset();
        mocks.closeModal.mockReset();
    });

    it.each(['in-review', 'update-in-review', 'live'] as ListingMode[])(
        'renders nothing for %s apps',
        mode => {
            const { container } = renderMenu(mode);
            expect(container).toBeEmptyDOMElement();
        }
    );

    it.each(['draft', 'removed'] as ListingMode[])('shows the overflow menu for %s apps', mode => {
        renderMenu(mode);
        expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
    });

    it('opens and closes the dropdown with a Delete draft item', () => {
        renderMenu('draft');
        const trigger = screen.getByRole('button', { name: 'More options' });

        expect(screen.queryByRole('menuitem', { name: /Delete draft/ })).not.toBeInTheDocument();
        fireEvent.click(trigger);
        expect(screen.getByRole('menuitem', { name: /Delete draft/ })).toBeInTheDocument();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('menuitem', { name: /Delete draft/ })).not.toBeInTheDocument();
    });

    it('closes the dropdown on an outside click', () => {
        renderMenu('draft');
        fireEvent.click(screen.getByRole('button', { name: 'More options' }));
        expect(screen.getByRole('menuitem', { name: /Delete draft/ })).toBeInTheDocument();

        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole('menuitem', { name: /Delete draft/ })).not.toBeInTheDocument();
    });

    it('opens the confirm sheet via the modal system when Delete draft is clicked', () => {
        renderMenu('removed');
        fireEvent.click(screen.getByRole('button', { name: 'More options' }));
        fireEvent.click(screen.getByRole('menuitem', { name: /Delete draft/ }));

        expect(mocks.newModal).toHaveBeenCalledTimes(1);
        const [component, , types] = mocks.newModal.mock.calls[0];
        expect(component.props).toMatchObject({
            listingId: 'listing-1',
            integrationId: 'integration-1',
            displayName: 'Quiz Quest',
        });
        expect(types).toEqual({ desktop: 'center', mobile: 'bottom-sheet' });
    });
});
