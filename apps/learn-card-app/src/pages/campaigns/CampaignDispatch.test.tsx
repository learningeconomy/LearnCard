import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CampaignValidator, type CampaignDispatchPreview, type Campaign } from '@learncard/types';
import { ModalsProvider, useModalsContext } from 'learn-card-base/components/modals/ModalsContext';
import { CampaignDispatch } from './CampaignDispatch';
import type { CampaignApi } from './types';

const live = (): Campaign =>
    CampaignValidator.parse({
        id: 'test-send',
        name: 'Notification test',
        status: 'live',
        channels: ['notify'],
        notification: { title: 'Hello', body: 'Test' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
    });
const preview: CampaignDispatchPreview = {
    campaignId: 'test-send',
    audienceCount: 10,
    alreadyNotifiedCount: 4,
    recipientCount: 3,
    previewToken: 'a'.repeat(64),
};
const mockApi = () => ({
    campaignsPreviewDispatch: vi.fn().mockResolvedValue(preview),
    campaignsDispatch: vi.fn().mockResolvedValue({ dispatchId: 'example' }),
});
// Exercise the actual modal lifecycle; browser QA covers the shared surface,
// focus management, Escape and backdrop dismissal.
const TestModals = () => {
    const { modals } = useModalsContext();
    return (
        <>
            {modals
                .filter(modal => modal.open)
                .map(modal => (
                    <React.Fragment key={modal.id}>{modal.component}</React.Fragment>
                ))}
        </>
    );
};
const ModalWrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <ModalsProvider>
        {children}
        <TestModals />
    </ModalsProvider>
);
const mount = (api = mockApi(), campaign = live(), disabled = false) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const onBusy = vi.fn();
    const view = render(
        <QueryClientProvider client={queryClient}>
            <CampaignDispatch
                api={api as unknown as CampaignApi}
                campaign={campaign}
                disabled={disabled}
                onBusy={onBusy}
            />
        </QueryClientProvider>,
        { wrapper: ModalWrapper }
    );
    return { api, queryClient, invalidate, onBusy, ...view };
};
afterEach(cleanup);
const review = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Send Notifications' }));
    await screen.findByRole('heading', { name: 'Send notifications?' });
};

describe('audience notification dispatch', () => {
    it('reviews actual eligible counts before sending and supports cancellation', async () => {
        const { api } = mount();
        await review();
        expect(screen.getByText('3 eligible recipients')).toBeVisible();
        expect(screen.getByText('10 stored members · 4 already notified')).toBeVisible();
        expect(api.campaignsDispatch).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(
            screen.queryByRole('heading', { name: 'Send notifications?' })
        ).not.toBeInTheDocument();
        expect(api.campaignsDispatch).not.toHaveBeenCalled();
    });
    it('dispatches the reviewed token once, shows loading, and refreshes stats', async () => {
        const api = mockApi();
        let resolve!: (value: { dispatchId: string }) => void;
        api.campaignsDispatch.mockReturnValue(
            new Promise(done => {
                resolve = done;
            })
        );
        const { onBusy, invalidate } = mount(api);
        await review();
        const confirm = screen.getByRole('button', { name: 'Confirm notification send' });
        fireEvent.click(confirm);
        fireEvent.click(confirm);
        expect(api.campaignsDispatch).toHaveBeenCalledTimes(1);
        expect(api.campaignsDispatch).toHaveBeenCalledWith('test-send', {
            expectedPreviewToken: preview.previewToken,
        });
        expect(
            screen.getByRole('button', { name: 'Starting notification delivery...' })
        ).toBeDisabled();
        expect(onBusy).toHaveBeenLastCalledWith(true);
        await act(async () => resolve({ dispatchId: 'accepted' }));
        expect(await screen.findByText(/Notification delivery started/)).toBeVisible();
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['campaign-stats', 'test-send'] });
        expect(onBusy).toHaveBeenLastCalledWith(false);
    });
    it.each(['not_live', 'notify_disabled', 'not_started', 'ended', 'no_recipients'] as const)(
        'blocks a server preview with reason %s',
        async blockedReason => {
            const api = mockApi();
            api.campaignsPreviewDispatch.mockResolvedValue({
                ...preview,
                recipientCount: 0,
                blockedReason,
            });
            mount(api);
            await review();
            expect(
                screen.getByRole('button', { name: 'Confirm notification send' })
            ).toBeDisabled();
            expect(api.campaignsDispatch).not.toHaveBeenCalled();
        }
    );
    it.each([
        { status: 'draft' },
        { status: 'paused' },
        { status: 'archived' },
        { channels: ['inApp'] },
        { startsAt: '2999-01-01T00:00:00Z' },
        { endsAt: '2000-01-01T00:00:00Z' },
    ] as Partial<Campaign>[])(
        'explains unavailable sending before requesting a preview (%j)',
        changes => {
            const { api } = mount(undefined, { ...live(), ...changes });
            expect(screen.getByRole('button', { name: 'Send Notifications' })).toBeDisabled();
            expect(api.campaignsPreviewDispatch).not.toHaveBeenCalled();
        }
    );
    it('requires saved changes and rejects an old confirmation when editing resumes', async () => {
        const { api, rerender, queryClient, onBusy } = mount();
        await review();
        rerender(
            <QueryClientProvider client={queryClient}>
                <CampaignDispatch
                    api={api as unknown as CampaignApi}
                    campaign={live()}
                    disabled
                    onBusy={onBusy}
                />
            </QueryClientProvider>
        );
        expect(
            screen.queryByRole('heading', { name: 'Send notifications?' })
        ).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Send Notifications' })).toBeDisabled();
    });
    it('requires reviewing again after a conflict and forwards only the new token', async () => {
        const api = mockApi();
        api.campaignsDispatch.mockRejectedValueOnce({
            data: { code: 'CONFLICT' },
            message: 'backend details',
        });
        mount(api);
        await review();
        fireEvent.click(screen.getByRole('button', { name: 'Confirm notification send' }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Review the recipient count again'
        );
        expect(screen.getByRole('alert')).not.toHaveTextContent('backend details');
        api.campaignsPreviewDispatch.mockResolvedValue({
            ...preview,
            previewToken: 'b'.repeat(64),
            recipientCount: 2,
        });
        await review();
        fireEvent.click(screen.getByRole('button', { name: 'Confirm notification send' }));
        await waitFor(() =>
            expect(api.campaignsDispatch).toHaveBeenLastCalledWith('test-send', {
                expectedPreviewToken: 'b'.repeat(64),
            })
        );
    });
    it('handles preview and dispatch failures without exposing raw errors', async () => {
        const api = mockApi();
        api.campaignsPreviewDispatch.mockRejectedValueOnce(new Error('secret database details'));
        mount(api);
        fireEvent.click(screen.getByRole('button', { name: 'Send Notifications' }));
        expect(await screen.findByRole('alert')).not.toHaveTextContent('secret database details');
        await review();
        api.campaignsDispatch.mockRejectedValueOnce(new Error('secret queue details'));
        fireEvent.click(screen.getByRole('button', { name: 'Confirm notification send' }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'The last request may have completed'
        );
        expect(screen.getByRole('alert')).not.toHaveTextContent('secret queue details');
        expect(
            screen.queryByRole('heading', { name: 'Send notifications?' })
        ).not.toBeInTheDocument();
    });
    it('closes the review when the editor unmounts without dispatching', async () => {
        const { api, rerender } = mount();
        await review();
        rerender(<div>Another page</div>);
        expect(
            screen.queryByRole('heading', { name: 'Send notifications?' })
        ).not.toBeInTheDocument();
        expect(api.campaignsDispatch).not.toHaveBeenCalled();
    });
});
