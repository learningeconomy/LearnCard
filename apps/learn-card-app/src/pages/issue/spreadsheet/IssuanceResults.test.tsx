import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IssuanceResults } from './IssuanceResults';
import { DeliveryStatus } from './DeliveryStatus';
import { makeRun } from './fixtures.test-support';

const modal = vi.hoisted(() => ({ open: vi.fn(() => ({ id: 1, generation: 1 })) }));
vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModalWithToken: modal.open, forceCloseModalByToken: vi.fn() }),
    ModalTypes: { Center: 'center', FullScreen: 'fullscreen' },
}));
const failedRun = () => {
    const run = makeRun(250);
    run.outcomes = Object.fromEntries(
        run.draft.recipients.map(row => [
            row.rowId!,
            {
                state: 'failed' as const,
                error: { code: 'OTHER', message: 'private server detail' },
            },
        ])
    );
    return run;
};

describe('delivery status review', () => {
    it('keeps 250 failures off the main page and retains retry and download actions', () => {
        const onRetry = vi.fn();
        const onDownload = vi.fn();
        render(
            <IssuanceResults
                run={failedRun()}
                busy={false}
                onResume={vi.fn()}
                onRetry={onRetry}
                onDownload={onDownload}
                onNew={vi.fn()}
            />
        );
        expect(screen.queryByRole('list')).toBeNull();
        expect(screen.queryByText('person249@test.com')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Review delivery issues · 250' }));
        expect(modal.open).toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Retry Failed' }));
        fireEvent.click(screen.getByRole('button', { name: /Download.*250/ }));
        expect(onRetry).toHaveBeenCalledOnce();
        expect(onDownload).toHaveBeenCalledOnce();
    });
    it('pages and searches all delivery issues without exposing raw server errors', () => {
        render(<DeliveryStatus initialFilter="issues" run={failedRun()} onClose={vi.fn()} />);
        expect(screen.getAllByRole('listitem')).toHaveLength(25);
        expect(screen.queryByText('private server detail')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(screen.getByText('Rows 26–50 of 250')).toBeVisible();
        fireEvent.change(screen.getByRole('searchbox'), {
            target: { value: 'person249@test.com' },
        });
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
        expect(screen.getByText('person249@test.com')).toBeVisible();
    });
    it('includes unconfirmed sends and omits successful sends', () => {
        const run = makeRun(2);
        run.outcomes = { 'row-0': { state: 'confirming' }, 'row-1': { state: 'sent' } };
        render(<DeliveryStatus initialFilter="issues" run={run} onClose={vi.fn()} />);
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
        expect(screen.getByText('person0@test.com')).toBeVisible();
        expect(screen.queryByText('person1@test.com')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Retry Failed' })).toBeNull();
    });
    it('lets people open the status viewer while sending without enabling retries', () => {
        render(
            <IssuanceResults
                run={failedRun()}
                busy
                onResume={vi.fn()}
                onRetry={vi.fn()}
                onDownload={vi.fn()}
                onNew={vi.fn()}
            />
        );
        const open = screen.getByRole('button', { name: 'View delivery status' });
        expect(open).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Retry Failed' })).toBeDisabled();
        fireEvent.click(open);
        expect(modal.open).toHaveBeenCalled();
    });
    it('shows every state and keeps the selected filter current as outcomes change', () => {
        const run = makeRun(5);
        const states = ['ready', 'queued', 'sent', 'failed', 'confirming'] as const;
        run.outcomes = Object.fromEntries(
            states.map((state, index) => [`row-${index}`, { state }])
        );
        const view = render(<DeliveryStatus run={run} onClose={vi.fn()} />);
        expect(screen.getAllByRole('listitem')).toHaveLength(5);
        for (const label of ['Not sent', 'Queued', 'Sent', 'Failed', 'Unconfirmed'])
            expect(screen.getByText(label, { exact: true })).toBeVisible();
        fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
            target: { value: 'sent' },
        });
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
        const updated = {
            ...run,
            outcomes: { ...run.outcomes, 'row-1': { state: 'sent' as const } },
        };
        view.rerender(<DeliveryStatus run={updated} onClose={vi.fn()} />);
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getByRole('option', { name: 'Sent · 2' })).toBeInTheDocument();
    });
});
