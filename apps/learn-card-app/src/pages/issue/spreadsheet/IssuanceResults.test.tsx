import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IssuanceResults } from './IssuanceResults';
import { DeliveryStatus } from './DeliveryStatus';
import { makeRun } from './fixtures.test-support';

const modal = vi.hoisted(() => ({ open: vi.fn(() => ({ id: 1, generation: 1 })) }));
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
afterEach(() => {
    vi.unstubAllGlobals();
    if (originalScroll)
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll);
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});
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
    it('announces successful completion once after an active run, and not on restoration', () => {
        const initial = makeRun(2);
        const complete = {
            ...initial,
            outcomes: { 'row-0': { state: 'sent' as const }, 'row-1': { state: 'sent' as const } },
        };
        const onComplete = vi.fn();
        const callbacks = {
            onResume: vi.fn(),
            onRetry: vi.fn(),
            onDownload: vi.fn(),
            onNew: vi.fn(),
            onComplete,
        };
        const view = render(<IssuanceResults {...callbacks} run={initial} busy />);
        view.rerender(<IssuanceResults {...callbacks} run={complete} busy={false} />);
        expect(screen.getByRole('heading', { name: 'All credentials sent' })).toBeVisible();
        expect(screen.getByText('2 of 2 sent successfully.')).toBeVisible();
        expect(onComplete).toHaveBeenCalledExactlyOnceWith({
            sent: 2,
            failed: 0,
            confirming: 0,
            total: 2,
        });
        view.rerender(<IssuanceResults {...callbacks} run={{ ...complete }} busy={false} />);
        expect(onComplete).toHaveBeenCalledTimes(1);
        view.unmount();
        onComplete.mockClear();
        render(<IssuanceResults {...callbacks} run={complete} busy={false} />);
        expect(onComplete).not.toHaveBeenCalled();
    });
    it.each(['failed', 'confirming'] as const)(
        'shows %s deliveries as needing attention, never as all sent',
        state => {
            const initial = makeRun(2);
            const onComplete = vi.fn();
            const callbacks = {
                onResume: vi.fn(),
                onRetry: vi.fn(),
                onDownload: vi.fn(),
                onNew: vi.fn(),
                onComplete,
            };
            const view = render(<IssuanceResults {...callbacks} run={initial} busy />);
            const final = {
                ...initial,
                outcomes: { 'row-0': { state: 'sent' as const }, 'row-1': { state } },
            };
            view.rerender(<IssuanceResults {...callbacks} run={final} busy={false} />);
            expect(screen.queryByRole('heading', { name: 'All credentials sent' })).toBeNull();
            expect(screen.getByRole('heading', { name: 'Delivery needs attention' })).toBeVisible();
            if (state === 'confirming') {
                expect(onComplete).not.toHaveBeenCalled();
                return;
            }
            expect(onComplete).toHaveBeenCalledExactlyOnceWith({
                sent: 1,
                failed: 1,
                confirming: 0,
                total: 2,
            });
        }
    );
    it('does not announce completion while rows remain queued or ready', () => {
        const run = makeRun(2);
        const onComplete = vi.fn();
        const callbacks = {
            onResume: vi.fn(),
            onRetry: vi.fn(),
            onDownload: vi.fn(),
            onNew: vi.fn(),
            onComplete,
        };
        const view = render(<IssuanceResults {...callbacks} run={run} busy />);
        view.rerender(
            <IssuanceResults
                {...callbacks}
                run={{
                    ...run,
                    outcomes: { 'row-0': { state: 'sent' }, 'row-1': { state: 'queued' } },
                }}
                busy={false}
            />
        );
        expect(onComplete).not.toHaveBeenCalled();
        expect(screen.queryByRole('heading', { name: 'All credentials sent' })).toBeNull();
        view.rerender(
            <IssuanceResults
                {...callbacks}
                run={{
                    ...run,
                    outcomes: { 'row-0': { state: 'sent' }, 'row-1': { state: 'sent' } },
                }}
                busy={false}
            />
        );
        expect(onComplete).toHaveBeenCalledExactlyOnceWith({
            sent: 2,
            failed: 0,
            confirming: 0,
            total: 2,
        });
        view.rerender(
            <IssuanceResults
                {...callbacks}
                run={{
                    ...run,
                    outcomes: { 'row-0': { state: 'sent' }, 'row-1': { state: 'sent' } },
                }}
                busy={false}
            />
        );
        expect(onComplete).toHaveBeenCalledTimes(1);
    });
    it.each(['sent', 'failed'] as const)(
        'waits for an unconfirmed-only result to resolve to %s',
        state => {
            const run = makeRun(1);
            const onComplete = vi.fn();
            const callbacks = {
                onResume: vi.fn(),
                onRetry: vi.fn(),
                onDownload: vi.fn(),
                onNew: vi.fn(),
                onComplete,
            };
            const view = render(<IssuanceResults {...callbacks} run={run} busy />);
            view.rerender(
                <IssuanceResults
                    {...callbacks}
                    run={{ ...run, outcomes: { 'row-0': { state: 'confirming' } } }}
                    busy={false}
                />
            );
            expect(onComplete).not.toHaveBeenCalled();
            view.rerender(
                <IssuanceResults
                    {...callbacks}
                    run={{ ...run, outcomes: { 'row-0': { state } } }}
                    busy={false}
                />
            );
            expect(onComplete).toHaveBeenCalledExactlyOnceWith({
                sent: state === 'sent' ? 1 : 0,
                failed: state === 'failed' ? 1 : 0,
                confirming: 0,
                total: 1,
            });
            view.rerender(
                <IssuanceResults
                    {...callbacks}
                    run={{ ...run, outcomes: { 'row-0': { state } } }}
                    busy={false}
                />
            );
            expect(onComplete).toHaveBeenCalledTimes(1);
        }
    );
    it('keeps progress visible alongside definite failures while other rows are queued', () => {
        const run = makeRun(2);
        run.outcomes = { 'row-0': { state: 'failed' }, 'row-1': { state: 'queued' } };
        const onComplete = vi.fn();
        const view = render(
            <IssuanceResults
                run={run}
                busy={false}
                onResume={vi.fn()}
                onRetry={vi.fn()}
                onDownload={vi.fn()}
                onNew={vi.fn()}
                onComplete={onComplete}
            />
        );
        expect(screen.getByRole('heading', { name: 'Delivery needs attention' })).toBeVisible();
        expect(screen.getByText('1 waiting')).toBeVisible();
        expect(
            view.container.querySelector('.batch-delivery-illustration--active')
        ).toBeInTheDocument();
        expect(onComplete).not.toHaveBeenCalled();
    });
    it('keeps Resume off a draft that has never submitted', () => {
        const run = makeRun();
        run.outcomes = { 'row-0': { state: 'ready' } };
        render(
            <IssuanceResults
                run={run}
                busy={false}
                onResume={vi.fn()}
                onRetry={vi.fn()}
                onDownload={vi.fn()}
                onNew={vi.fn()}
            />
        );
        expect(screen.getByText('Draft saved on this device')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull();
    });
    it('offers a receipt check for unconfirmed emails without enabling Retry failed', () => {
        const run = makeRun();
        run.outcomes = { 'row-0': { state: 'confirming' } };
        run.attempts = [
            {
                id: 'attempt',
                rowIds: ['row-0'],
                body: { items: [] },
                batchId: 'batch',
                done: true,
                createdAt: Date.now(),
            },
        ];
        const onCheckStatus = vi.fn();
        render(
            <IssuanceResults
                run={run}
                busy={false}
                onResume={vi.fn()}
                onRetry={vi.fn()}
                onDownload={vi.fn()}
                onNew={vi.fn()}
                onCheckStatus={onCheckStatus}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Check Again' }));
        expect(onCheckStatus).toHaveBeenCalledOnce();
        expect(screen.queryByRole('button', { name: 'Retry Failed' })).toBeNull();
    });
    it.each([false, true])('reveals sending progress once (reduced motion: %s)', reduced => {
        const scroll = vi.fn();
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: scroll,
        });
        vi.stubGlobal(
            'matchMedia',
            vi.fn(() => ({ matches: reduced }))
        );
        const run = makeRun(2);
        const callbacks = {
            onResume: vi.fn(),
            onRetry: vi.fn(),
            onDownload: vi.fn(),
            onNew: vi.fn(),
        };
        const view = render(<IssuanceResults {...callbacks} run={run} busy={false} />);
        expect(scroll).not.toHaveBeenCalled();
        view.rerender(<IssuanceResults {...callbacks} run={run} busy />);
        expect(scroll).toHaveBeenCalledWith({
            block: 'center',
            behavior: reduced ? 'auto' : 'smooth',
        });
        view.rerender(
            <IssuanceResults
                {...callbacks}
                run={{ ...run, outcomes: { 'row-0': { state: 'sent' } } }}
                busy
            />
        );
        view.rerender(<IssuanceResults {...callbacks} run={run} busy={false} />);
        view.rerender(<IssuanceResults {...callbacks} run={run} busy />);
        expect(scroll).toHaveBeenCalledOnce();
    });
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
