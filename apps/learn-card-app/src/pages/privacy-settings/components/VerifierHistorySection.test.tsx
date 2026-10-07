import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    revision: 0,
    current: true,
    allowed: true,
    initWallet: vi.fn(),
    privacy: vi.fn(),
    load: vi.fn(),
    toggle: vi.fn(),
    clear: vi.fn(),
    remove: vi.fn(),
    modal: vi.fn(),
    close: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: mocks.initWallet }),
    useModal: () => ({ newModalWithToken: mocks.modal, forceCloseModalByToken: mocks.close }),
    ModalTypes: { Center: 'center', FullScreen: 'fullscreen' },
}));
vi.mock('../../../helpers/verifier-history/useEligibility', () => ({
    useVerifierHistoryEligibility: () => () => mocks.allowed,
}));
vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));
vi.mock('../../../components/share-links/sharePrivacy', () => ({
    enterSharePrivacy: mocks.privacy,
}));
vi.mock('../../../helpers/verifier-history/account', () => ({
    captureHistoryAccount: () => () => mocks.current,
    captureHistoryContext: (wallet: unknown) => ({
        wallet,
        eligible: mocks.allowed,
        isCurrent: () => mocks.current,
    }),
    getHistoryAccountRevision: () => mocks.revision,
    useHistoryAccountRevision: () => mocks.revision,
    isHistoryAccountEligible: (eligible: boolean) => eligible && mocks.allowed,
}));
vi.mock('../../../helpers/verifier-history/history', () => ({
    loadVerifierHistory: mocks.load,
    setVerifierHistoryEnabled: mocks.toggle,
    clearVerifierHistory: mocks.clear,
    deleteVerifierReceipt: mocks.remove,
}));
import VerifierHistorySection from './VerifierHistorySection';
const receipt = {
    eventId: 'event',
    sentAt: '2026-10-02T12:00:00.000Z',
    label: 'Private verifier canary',
    titles: ['Private diploma canary'],
    protocol: 'chapi',
    outcome: 'handed-off',
};
const open = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open private history' }));
    await screen.findByRole('checkbox');
};
beforeEach(() => {
    vi.clearAllMocks();
    mocks.current = true;
    mocks.allowed = true;
    mocks.revision = 0;
    mocks.initWallet.mockResolvedValue({});
    mocks.load.mockResolvedValue({ enabled: false, receipts: [receipt], cleanupComplete: true });
    mocks.toggle.mockResolvedValue(undefined);
    mocks.clear.mockResolvedValue(true);
    mocks.remove.mockResolvedValue(true);
    mocks.modal.mockReturnValue({ id: 7, generation: 1 });
});
describe('verifier history controls', () => {
    it('activates privacy before loading, excludes screenshots, and distinguishes handoff from acceptance', async () => {
        render(<VerifierHistorySection eligible />);
        expect(mocks.load).not.toHaveBeenCalled();
        expect(screen.queryByText(receipt.label)).not.toBeInTheDocument();
        await open();
        expect(mocks.privacy.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.load.mock.invocationCallOrder[0]
        );
        expect(screen.getByRole('region', { name: 'Shared with verifiers' })).toHaveAttribute(
            'data-feedback-exclude'
        );
        expect(screen.getByText(/delivery unconfirmed/)).toBeInTheDocument();
        expect(screen.getByText(/Deleting history cannot retract/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Stop sharing/ })).not.toBeInTheDocument();
    });
    it('supports opt-in, exact reminder deletion and clear, reloading after each action', async () => {
        render(<VerifierHistorySection eligible />);
        await open();
        fireEvent.click(screen.getByRole('checkbox'));
        await waitFor(() => expect(mocks.toggle).toHaveBeenCalledWith(expect.any(Object), true));
        await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeDisabled());
        fireEvent.click(
            screen.getByRole('button', { name: 'Delete reminder for Private verifier canary' })
        );
        await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(expect.any(Object), 'event'));
        await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeDisabled());
        fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
        await waitFor(() => expect(mocks.clear).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeDisabled());
        expect(mocks.load).toHaveBeenCalledTimes(4);
        expect(mocks.toggle).toHaveBeenCalledTimes(1); // clear did not change preference
    });
    it('handles connection and cleanup failures honestly without marking a failed toggle saved', async () => {
        render(<VerifierHistorySection eligible />);
        await open();
        mocks.toggle.mockRejectedValue(new Error('TOKEN_CANARY'));
        fireEvent.click(screen.getByRole('checkbox'));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'History could not be loaded or updated'
        );
        expect(screen.getByRole('checkbox')).not.toBeChecked();
        expect(screen.queryByText('TOKEN_CANARY')).not.toBeInTheDocument();
        mocks.load.mockResolvedValue({ enabled: false, receipts: [], cleanupComplete: false });
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        expect(
            await screen.findByText(/Some records could not be read or removed/)
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Clear history' })).not.toBeDisabled();
    });
    it('offers Clear after an initial load failure and reloads the recovered state', async () => {
        mocks.load.mockRejectedValueOnce(new Error('Missing settings'));
        render(<VerifierHistorySection eligible />);
        fireEvent.click(screen.getByRole('button', { name: 'Open private history' }));
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
        await screen.findByRole('checkbox');
        expect(mocks.clear).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    it('offers Clear after refreshing an already loaded empty history fails', async () => {
        mocks.load.mockResolvedValue({ enabled: true, receipts: [], cleanupComplete: true });
        render(<VerifierHistorySection eligible />);
        await open();
        expect(screen.getByRole('button', { name: 'Clear history' })).toBeDisabled();
        mocks.load.mockRejectedValueOnce(new Error('Missing settings'));
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        await screen.findByRole('alert');
        expect(screen.getByRole('button', { name: 'Clear history' })).not.toBeDisabled();
        mocks.load.mockResolvedValue({ enabled: false, receipts: [], cleanupComplete: true });
        fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
        await waitFor(() => expect(mocks.clear).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeChecked());
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    it('shows incomplete Clear cleanup without implying all records were removed', async () => {
        render(<VerifierHistorySection eligible />);
        await open();
        mocks.clear.mockResolvedValue(false);
        mocks.load.mockResolvedValue({ enabled: false, receipts: [], cleanupComplete: true });
        fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
        await screen.findByText(/Some records could not be read or removed/);
        expect(screen.getByRole('button', { name: 'Clear history' })).not.toBeDisabled();
    });
    it('hides decrypted state synchronously on switch and rejects late loads', async () => {
        const { rerender } = render(<VerifierHistorySection eligible />);
        await open();
        mocks.revision++;
        mocks.current = false;
        rerender(<VerifierHistorySection eligible />);
        expect(screen.queryByText(receipt.label)).not.toBeInTheDocument();
        mocks.current = true;
        let resolve!: (value: unknown) => void;
        mocks.load.mockImplementationOnce(
            () =>
                new Promise(done => {
                    resolve = done;
                })
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open private history' }));
        await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
        mocks.current = false;
        mocks.revision++;
        rerender(<VerifierHistorySection eligible />);
        await act(async () =>
            resolve({ enabled: true, receipts: [receipt], cleanupComplete: true })
        );
        await waitFor(() => expect(screen.queryByText(receipt.label)).not.toBeInTheDocument());
    });
    it('bounds a 500-entry preview and pages locally without more reads', async () => {
        const receipts = Array.from({ length: 500 }, (_, i) => ({
            ...receipt,
            eventId: `event-${i}`,
            label: `Verifier ${i}`,
        }));
        mocks.load.mockResolvedValue({ enabled: true, receipts, cleanupComplete: true });
        render(<VerifierHistorySection eligible />);
        await open();
        const card = within(screen.getByRole('region', { name: 'Shared with verifiers' }));
        expect(card.getAllByRole('listitem')).toHaveLength(5);
        expect(card.queryByText('Verifier 5')).not.toBeInTheDocument();
        fireEvent.click(card.getByRole('button', { name: 'View all 500' }));
        render(mocks.modal.mock.calls[0][0]);
        const dialog = within(screen.getByTestId('verifier-history-modal'));
        expect(screen.getByTestId('verifier-history-modal')).toHaveAttribute(
            'data-feedback-exclude'
        );
        expect(dialog.getAllByRole('listitem')).toHaveLength(20);
        expect(dialog.getByText('Page 1 of 25')).toBeInTheDocument();
        expect(dialog.getByRole('button', { name: 'Previous' })).toBeDisabled();
        fireEvent.click(dialog.getByRole('button', { name: 'Next' }));
        expect(dialog.getByText('Verifier 20')).toBeInTheDocument();
        expect(dialog.queryByText('Verifier 0')).not.toBeInTheDocument();
        fireEvent.click(dialog.getByRole('button', { name: 'Previous' }));
        expect(dialog.getByText('Verifier 0')).toBeInTheDocument();
        expect(mocks.load).toHaveBeenCalledTimes(1);
        fireEvent.click(dialog.getByRole('button', { name: 'Done' }));
        expect(mocks.close).toHaveBeenCalledWith({ id: 7, generation: 1 });
        fireEvent.click(card.getByRole('button', { name: 'View all 500' }));
        expect(mocks.modal).toHaveBeenCalledTimes(2);
        act(() => mocks.modal.mock.calls[1][1].onClose());
        fireEvent.click(card.getByRole('button', { name: 'View all 500' }));
        expect(mocks.modal).toHaveBeenCalledTimes(3);
    });
    it('clamps the final page after deletion and updates the main preview count', async () => {
        const receipts = Array.from({ length: 21 }, (_, i) => ({
            ...receipt,
            eventId: `event-${i}`,
            label: `Verifier ${i}`,
        }));
        mocks.load.mockResolvedValue({ enabled: true, receipts, cleanupComplete: true });
        render(<VerifierHistorySection eligible />);
        await open();
        fireEvent.click(screen.getByRole('button', { name: 'View all 21' }));
        render(mocks.modal.mock.calls[0][0]);
        const dialog = within(screen.getByTestId('verifier-history-modal'));
        fireEvent.click(dialog.getByRole('button', { name: 'Next' }));
        expect(dialog.getAllByRole('listitem')).toHaveLength(1);
        expect(dialog.getByRole('button', { name: 'Next' })).toBeDisabled();
        mocks.load.mockResolvedValue({
            enabled: true,
            receipts: receipts.slice(0, 20),
            cleanupComplete: true,
        });
        fireEvent.click(dialog.getByRole('button', { name: 'Delete reminder for Verifier 20' }));
        await waitFor(() =>
            expect(mocks.remove).toHaveBeenCalledWith(expect.any(Object), 'event-20')
        );
        await dialog.findByText('Page 1 of 1');
        expect(dialog.getAllByRole('listitem')).toHaveLength(20);
        expect(screen.getByRole('button', { name: 'View all 20' })).toBeInTheDocument();
        expect(mocks.load).toHaveBeenCalledTimes(2);
    });
    it.each(['account switch', 'eligibility loss'])(
        'hides modal data on %s and ignores a late refresh',
        async reason => {
            const receipts = Array.from({ length: 6 }, (_, i) => ({
                ...receipt,
                eventId: `event-${i}`,
            }));
            mocks.load.mockResolvedValue({ enabled: true, receipts, cleanupComplete: true });
            const card = render(<VerifierHistorySection eligible />);
            await open();
            fireEvent.click(screen.getByRole('button', { name: 'View all 6' }));
            const content = mocks.modal.mock.calls[0][0];
            const onUpdate = vi.fn();
            const modal = render(React.cloneElement(content, { onUpdate }));
            let resolve!: (value: unknown) => void;
            mocks.load.mockImplementationOnce(
                () =>
                    new Promise(done => {
                        resolve = done;
                    })
            );
            fireEvent.click(
                within(screen.getByTestId('verifier-history-modal')).getByRole('button', {
                    name: 'Refresh',
                })
            );
            await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
            if (reason === 'account switch') {
                mocks.current = false;
                mocks.revision++;
            } else mocks.allowed = false;
            card.rerender(<VerifierHistorySection eligible />);
            modal.rerender(React.cloneElement(content, { onUpdate }));
            expect(screen.queryByText(receipt.label)).not.toBeInTheDocument();
            expect(
                within(screen.getByTestId('verifier-history-modal')).queryByRole('button', {
                    name: 'Clear history',
                })
            ).not.toBeInTheDocument();
            await act(async () => resolve({ enabled: true, receipts, cleanupComplete: true }));
            expect(onUpdate).not.toHaveBeenCalled();
            expect(mocks.close).toHaveBeenCalled();
        }
    );
    it('offers modal recovery after failure and propagates incomplete clear to the card', async () => {
        const receipts = Array.from({ length: 6 }, (_, i) => ({
            ...receipt,
            eventId: `event-${i}`,
        }));
        mocks.load.mockResolvedValue({ enabled: true, receipts, cleanupComplete: true });
        render(<VerifierHistorySection eligible />);
        await open();
        fireEvent.click(screen.getByRole('button', { name: 'View all 6' }));
        render(mocks.modal.mock.calls[0][0]);
        const dialog = within(screen.getByTestId('verifier-history-modal'));
        mocks.load.mockRejectedValueOnce(new Error('PRIVATE_CANARY'));
        fireEvent.click(dialog.getByRole('button', { name: 'Refresh' }));
        expect(await dialog.findByRole('alert')).toHaveTextContent(
            'History could not be loaded or updated'
        );
        expect(screen.queryByText('PRIVATE_CANARY')).not.toBeInTheDocument();
        expect(dialog.getByRole('button', { name: 'Clear history' })).not.toBeDisabled();
        mocks.clear.mockResolvedValue(false);
        mocks.load.mockResolvedValue({ enabled: false, receipts: [], cleanupComplete: true });
        fireEvent.click(dialog.getByRole('button', { name: 'Clear history' }));
        await dialog.findByText(/Some records could not be read or removed/);
        expect(dialog.getByText('No recorded disclosures.')).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).not.toBeChecked();
        expect(screen.queryByRole('button', { name: 'View all 6' })).not.toBeInTheDocument();
    });
    it('does not load or offer recording for managed/ineligible accounts', () => {
        mocks.allowed = false;
        render(<VerifierHistorySection eligible />);
        expect(screen.getByText(/unavailable for managed accounts/)).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(mocks.load).not.toHaveBeenCalled();
    });
});
