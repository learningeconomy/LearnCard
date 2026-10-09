import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteAppConfirmSheet } from './DeleteAppConfirmSheet';

const mocks = vi.hoisted(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    presentToast: vi.fn(),
    initWallet: vi.fn(),
    invalidateQueries: vi.fn(),
    logError: vi.fn(),
    logWarn: vi.fn(),
}));

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({
        error: mocks.logError,
        warn: mocks.logWarn,
        info: vi.fn(),
        debug: vi.fn(),
    }),
    useToast: () => ({ presentToast: mocks.presentToast, dismissToast: vi.fn() }),
    ToastTypeEnum: { Success: 'success', Error: 'error' },
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock('../useDeveloperPortal', () => ({
    useDeveloperPortal: () => ({
        useDeleteListing: () => ({
            mutateAsync: mocks.mutateAsync,
            isPending: mocks.isPending,
        }),
    }),
}));

const renderSheet = (overrides?: { integrationId?: string | null }) => {
    const onDismiss = vi.fn();
    const onDeleted = vi.fn();
    render(
        <DeleteAppConfirmSheet
            listingId="listing-1"
            integrationId={overrides?.integrationId ?? null}
            displayName="Quiz Quest"
            onDismiss={onDismiss}
            onDeleted={onDeleted}
        />
    );
    return { onDismiss, onDeleted };
};

describe('DeleteAppConfirmSheet', () => {
    beforeEach(() => {
        mocks.mutateAsync.mockReset();
        mocks.isPending = false;
        mocks.presentToast.mockReset();
        mocks.initWallet.mockReset();
        mocks.invalidateQueries.mockReset();
        mocks.logError.mockReset();
        mocks.logWarn.mockReset();
    });

    it('shows the confirmation copy with the app name', () => {
        renderSheet();
        expect(screen.getByText('Delete "Quiz Quest"?')).toBeInTheDocument();
        expect(
            screen.getByText(
                "Its store details and test history will be removed. This can't be undone."
            )
        ).toBeInTheDocument();
    });

    it('cancels without deleting anything', () => {
        const { onDismiss } = renderSheet();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onDismiss).toHaveBeenCalled();
        expect(mocks.mutateAsync).not.toHaveBeenCalled();
    });

    it('deletes, cleans up, toasts, and dismisses on success (no integration cleanup needed)', async () => {
        mocks.mutateAsync.mockResolvedValue(true);
        const { onDismiss, onDeleted } = renderSheet();

        fireEvent.click(screen.getByRole('button', { name: 'Delete Draft' }));

        await waitFor(() => expect(onDismiss).toHaveBeenCalled());
        expect(mocks.mutateAsync).toHaveBeenCalledWith('listing-1');
        expect(mocks.initWallet).not.toHaveBeenCalled();
        expect(mocks.presentToast).toHaveBeenCalledWith(
            'App deleted.',
            expect.objectContaining({ type: 'success' })
        );
        expect(onDeleted).toHaveBeenCalled();
        expect(mocks.invalidateQueries).toHaveBeenCalledWith({
            queryKey: ['developer', 'listing'],
        });
    });

    it('deletes the empty auto-created project after the listing is gone', async () => {
        mocks.mutateAsync.mockResolvedValue(true);
        const deleteIntegration = vi.fn().mockResolvedValue(true);
        const wallet = {
            invoke: {
                getIntegration: vi.fn().mockResolvedValue({
                    guideType: 'embed-app',
                    guideState: { publishedFromAppUrl: 'https://quiz.app' },
                }),
                getListingsForIntegration: vi.fn().mockResolvedValue({ records: [] }),
                deleteIntegration,
            },
        };
        mocks.initWallet.mockResolvedValue(wallet);

        renderSheet({ integrationId: 'integration-1' });
        fireEvent.click(screen.getByRole('button', { name: 'Delete Draft' }));

        await waitFor(() => expect(deleteIntegration).toHaveBeenCalledWith('integration-1'));
        expect(mocks.invalidateQueries).toHaveBeenCalledWith({
            queryKey: ['developer', 'integrations'],
        });
    });

    it('leaves the project alone when other listings remain', async () => {
        mocks.mutateAsync.mockResolvedValue(true);
        const deleteIntegration = vi.fn();
        const wallet = {
            invoke: {
                getIntegration: vi.fn().mockResolvedValue({
                    guideType: 'embed-app',
                    guideState: { publishedFromAppUrl: 'https://quiz.app' },
                }),
                getListingsForIntegration: vi.fn().mockResolvedValue({
                    records: [{ listing_id: 'other' }],
                }),
                deleteIntegration,
            },
        };
        mocks.initWallet.mockResolvedValue(wallet);

        const { onDismiss } = renderSheet({ integrationId: 'integration-1' });
        fireEvent.click(screen.getByRole('button', { name: 'Delete Draft' }));

        await waitFor(() => expect(onDismiss).toHaveBeenCalled());
        expect(deleteIntegration).not.toHaveBeenCalled();
    });

    it('leaves a not-auto-created project alone', async () => {
        mocks.mutateAsync.mockResolvedValue(true);
        const deleteIntegration = vi.fn();
        const wallet = {
            invoke: {
                getIntegration: vi.fn().mockResolvedValue({ guideType: undefined, guideState: {} }),
                getListingsForIntegration: vi.fn().mockResolvedValue({ records: [] }),
                deleteIntegration,
            },
        };
        mocks.initWallet.mockResolvedValue(wallet);

        const { onDismiss } = renderSheet({ integrationId: 'integration-1' });
        fireEvent.click(screen.getByRole('button', { name: 'Delete Draft' }));

        await waitFor(() => expect(onDismiss).toHaveBeenCalled());
        expect(deleteIntegration).not.toHaveBeenCalled();
    });

    it('shows the server message for a known precondition failure and stays open', async () => {
        mocks.mutateAsync.mockRejectedValue(
            new Error('Only draft apps can be deleted. Withdraw it from review first.')
        );
        const { onDismiss } = renderSheet();

        fireEvent.click(screen.getByRole('button', { name: 'Delete Draft' }));

        expect(
            await screen.findByText(
                'Only draft apps can be deleted. Withdraw it from review first.'
            )
        ).toBeInTheDocument();
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('maps unknown errors to a friendly fallback message', async () => {
        mocks.mutateAsync.mockRejectedValue(new Error('ECONNRESET on socket 5'));
        renderSheet();

        fireEvent.click(screen.getByRole('button', { name: 'Delete Draft' }));

        expect(
            await screen.findByText('Something went wrong. Please try again.')
        ).toBeInTheDocument();
        expect(screen.queryByText('ECONNRESET on socket 5')).not.toBeInTheDocument();
    });
});
