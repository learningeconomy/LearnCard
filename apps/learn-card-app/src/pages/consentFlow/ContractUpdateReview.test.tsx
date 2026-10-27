import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConsentFlowContractUpdatePreview } from '@learncard/types';
import ContractUpdateReview from './ContractUpdateReview';
import { TenantConfigProvider } from 'learn-card-base/config/TenantConfigProvider';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/config/tenantDefaults';
import { setLocale } from '../../paraglide/runtime.js';
vi.mock('./ConsentFlowGetAnAdult', () => ({
    default: ({ handleNextStep }: { handleNextStep: () => void }) => (
        <button type="button" onClick={handleNextStep}>
            Parent has reviewed
        </button>
    ),
}));
vi.mock('../../i18n', () => ({ useLocale: () => 'en' }));

const preview: ConsentFlowContractUpdatePreview = {
    headline: 'Acme has a new option',
    subhead: 'Turn it on if you want. Nothing changes unless you do.',
    primaryLabel: 'Continue',
    rows: [
        {
            scope: { area: 'write', type: 'credential', key: 'CERTIFICATES', required: false },
            change: 'added',
            label: 'Certificates',
            subtitle: 'Share this if you choose.',
        },
        {
            scope: { area: 'read', type: 'credential', key: 'WORK_HISTORY', required: false },
            change: 'removed',
            label: 'Work History',
            subtitle: 'No longer requested.',
        },
    ],
};

const renderReview = (
    overrides: Partial<React.ComponentProps<typeof ContractUpdateReview>> = {}
) => {
    const props = {
        open: true,
        name: 'Acme',
        preview,
        unchangedRows: [],
        onAccept: vi.fn().mockResolvedValue(undefined),
        onDecline: vi.fn().mockResolvedValue(undefined),
        onClose: vi.fn(),
        ...overrides,
    };
    const view = render(
        <TenantConfigProvider config={DEFAULT_LEARNCARD_TENANT_CONFIG}>
            <ContractUpdateReview {...props} />
        </TenantConfigProvider>
    );
    return { ...props, unmount: view.unmount };
};

describe('ContractUpdateReview', () => {
    beforeEach(() => setLocale('en', { reload: false }));
    it('expands structured existing access without mixing it into the change rows', () => {
        renderReview({
            unchangedRows: [
                { area: 'read', label: 'Achievements' },
                { area: 'write', label: 'Transcripts' },
            ],
        });
        expect(screen.queryByText('Transcripts')).toBeNull();
        fireEvent.click(
            screen.getByRole('button', {
                name: /Acme already sees Achievements/,
            })
        );
        expect(screen.getByText('Transcripts')).toBeVisible();
        fireEvent.click(
            screen.getByRole('button', {
                name: /Acme already sees Achievements/,
            })
        );
        expect(screen.queryByText('Transcripts')).toBeNull();
    });
    it('shows explicit no-grants feedback for accepted users, and labels preview defaults separately', () => {
        const props = renderReview();
        fireEvent.click(
            screen.getByRole('button', { name: 'Your existing choices stay the same.' })
        );
        expect(screen.getByText('No access is currently enabled for this app.')).toBeVisible();
        props.unmount();

        renderReview({ accessContext: 'defaults', readOnly: true });
        fireEvent.click(screen.getByRole('button', { name: 'Current request’s default access' }));
        expect(screen.getByText('No default access stays unchanged.')).toBeVisible();
        expect(screen.getByText(/not a person’s saved permissions/)).toBeVisible();
    });

    it('does not claim access is absent when existing grants are included in the changed rows', () => {
        renderReview({ hasExistingAccess: true, unchangedRows: [] });
        fireEvent.click(
            screen.getByRole('button', { name: 'Your existing choices stay the same.' })
        );
        expect(
            screen.getByText('Your existing access is included in the changes above.')
        ).toBeVisible();
        expect(screen.queryByText('No access is currently enabled for this app.')).toBeNull();
    });

    it('discloses read and write access with their areas', () => {
        renderReview({
            unchangedRows: [
                { area: 'read', label: 'Achievements' },
                { area: 'write', label: 'Transcripts' },
            ],
        });
        fireEvent.click(screen.getByRole('button', { name: /already sees/ }));
        expect(screen.getByText('Achievements')).toBeVisible();
        expect(screen.getByText('(Read access)')).toBeVisible();
        expect(screen.getByText('(Write access)')).toBeVisible();
        expect(screen.queryByText('No access is currently enabled for this app.')).toBeNull();
    });

    it('exposes accessible help context next to the app identity', () => {
        renderReview();
        const button = screen.getByRole('button', { name: 'Why am I seeing this?' });
        expect(button).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText(/Acme is an app you connected to/)).toBeVisible();
    });

    it('does not dismiss another screen when an in-flight save finishes after unmount', async () => {
        vi.useFakeTimers();
        try {
            let finish!: () => void;
            const pending = new Promise<void>(resolve => {
                finish = resolve;
            });
            const props = renderReview({ onAccept: () => pending });
            fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
            props.unmount();
            await act(async () => {
                finish();
                await pending;
                await vi.advanceTimersByTimeAsync(400);
            });
            expect(props.onClose).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });

    it('keeps an added optional item off unless explicitly selected', async () => {
        const props = renderReview();
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        await waitFor(() => expect(props.onAccept).toHaveBeenCalledWith([]));
    });

    it('shows the real primary action in a developer preview without saving a decision', async () => {
        const props = renderReview({ readOnly: true });
        fireEvent.click(screen.getByRole('button', { name: preview.primaryLabel }));
        await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
        expect(props.onAccept).not.toHaveBeenCalled();
        expect(props.onDecline).not.toHaveBeenCalled();
    });

    it('allows optional additions to be selected', async () => {
        const props = renderReview();
        fireEvent.click(screen.getByLabelText('Turn on this option'));
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        await waitFor(() =>
            expect(props.onAccept).toHaveBeenCalledWith(['write|credential|CERTIFICATES'])
        );
    });

    it('shows the response deadline and confirms stopping sharing inline', async () => {
        const props = renderReview({ deadline: '2026-09-30T00:00:00.000Z' });
        expect(screen.getByText(/Respond by Sep 30 to keep sharing/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Stop sharing with Acme' }));
        expect(screen.getByText(/Acme will lose access to everything/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }));
        await waitFor(() => expect(props.onDecline).toHaveBeenCalled());
    });
    it('keeps an already-enabled optional choice selected when reopening', () => {
        renderReview({ initialEnabledOptionalKeys: ['write|credential|CERTIFICATES'] });
        expect((screen.getByLabelText('Turn on this option') as HTMLInputElement).checked).toBe(
            true
        );
    });

    it('shows the parent path before accepting when guardian approval is required', async () => {
        const props = renderReview({
            needsGuardianConsent: true,
            guardianContract: {} as React.ComponentProps<
                typeof ContractUpdateReview
            >['guardianContract'],
        });
        fireEvent.click(screen.getByRole('button', { name: 'Ask a parent' }));
        expect(props.onAccept).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Parent has reviewed' }));
        await waitFor(() => expect(props.onAccept).toHaveBeenCalledWith([]));
    });
    it('does not offer approval again for an already handled version', async () => {
        const props = renderReview({
            alreadyHandled: true,
            preview: { ...preview, rows: [] },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Done' }));
        await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
        expect(props.onAccept).not.toHaveBeenCalled();
    });

    it('still allows withdrawing consent after the update was handled', async () => {
        const props = renderReview({
            alreadyHandled: true,
            preview: { ...preview, rows: [] },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Stop sharing with Acme' }));
        fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }));
        await waitFor(() => expect(props.onDecline).toHaveBeenCalledOnce());
        expect(props.onAccept).not.toHaveBeenCalled();
    });

    it('settles the saving state when guardian approval is cancelled', async () => {
        const props = renderReview({
            needsGuardianConsent: true,
            guardianContract: {} as React.ComponentProps<
                typeof ContractUpdateReview
            >['guardianContract'],
            onAccept: vi.fn().mockRejectedValue(new Error('cancelled')),
        });
        fireEvent.click(screen.getByRole('button', { name: 'Ask a parent' }));
        fireEvent.click(screen.getByRole('button', { name: 'Parent has reviewed' }));
        await waitFor(() =>
            expect(screen.getByRole('alert').textContent).toBe(
                'Something went wrong. Please try again.'
            )
        );
        expect(screen.getByRole('button', { name: 'Ask a parent' })).toBeEnabled();
        expect(props.onAccept).toHaveBeenCalledOnce();
    });
});
