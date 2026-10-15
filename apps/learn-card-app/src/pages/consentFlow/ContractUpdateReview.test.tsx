import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ConsentFlowContractUpdatePreview } from '@learncard/types';
import ContractUpdateReview from './ContractUpdateReview';
import { TenantConfigProvider } from 'learn-card-base/config/TenantConfigProvider';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/config/tenantDefaults';
vi.mock('./ConsentFlowGetAnAdult', () => ({
    default: ({ handleNextStep }: { handleNextStep: () => void }) => (
        <button type="button" onClick={handleNextStep}>
            Parent has reviewed
        </button>
    ),
}));

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
    it('expands existing access in place without mixing it into the change rows', () => {
        renderReview({ unchangedRows: ['Can see Achievements', 'Can add Transcripts'] });
        expect(screen.queryByText('Can add Transcripts')).toBeNull();
        fireEvent.click(
            screen.getByRole('button', {
                name: "Acme already sees Achievements. That doesn't change.",
            })
        );
        expect(screen.getByText('Can add Transcripts')).toBeVisible();
        fireEvent.click(
            screen.getByRole('button', {
                name: "Acme already sees Achievements. That doesn't change.",
            })
        );
        expect(screen.queryByText('Can add Transcripts')).toBeNull();
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
});
