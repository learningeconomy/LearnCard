import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InboxGuardianPending, {
    normalizeInboxClaimOutcomes,
    resolveInboxClaimCompletion,
    summarizeInboxClaimOutcomes,
} from './InboxGuardianPending';
import type { InboxClaimOutcome } from './exchange.types';

vi.mock('@ionic/react', () => ({
    IonIcon: ({ icon }: { icon: string }) => <span data-testid={`ion-icon-${icon}`} />,
}));

vi.mock('ionicons/icons', () => ({
    alertCircleOutline: 'alert',
    closeCircleOutline: 'close',
    homeOutline: 'home',
    refreshOutline: 'refresh',
    timeOutline: 'time',
}));

vi.mock('../../paraglide/messages.js', () => ({
    'claim.pending.title': () => 'Waiting for guardian approval',
    'claim.pending.subtitle': () => 'Some credentials need a guardian to approve them.',
    'claim.pending.awaiting.one': ({ count }: { count: number }) =>
        `${count} credential is waiting for approval.`,
    'claim.pending.awaiting.other': ({ count }: { count: number }) =>
        `${count} credentials are waiting for approval.`,
    'claim.pending.awaitingHint': () => 'Check again soon.',
    'claim.pending.rejected.one': ({ count }: { count: number }) =>
        `${count} credential was declined by a guardian.`,
    'claim.pending.rejected.other': ({ count }: { count: number }) =>
        `${count} credentials were declined by a guardian.`,
    'claim.pending.checkAgain': () => 'Check again',
    'claim.pending.checking': () => 'Checking',
    'claim.pending.checkAgainError': () => 'Could not check for updates.',
    'claim.pending.goHome': () => 'Go to home',
}));

const inboxRequestUrl = 'http://localhost:4000/api/workflows/inbox-claim/exchanges/claim-token';
const awaiting: InboxClaimOutcome = { id: 'a', status: 'AWAITING_GUARDIAN' };
const rejected: InboxClaimOutcome = { id: 'b', status: 'GUARDIAN_REJECTED' };

describe('normalizeInboxClaimOutcomes', () => {
    it('returns an empty list for legacy responses without outcomes', () => {
        expect(normalizeInboxClaimOutcomes(undefined)).toEqual([]);
        expect(normalizeInboxClaimOutcomes(null)).toEqual([]);
        expect(normalizeInboxClaimOutcomes('nope')).toEqual([]);
    });

    it('keeps only well-formed outcomes and drops malformed entries', () => {
        expect(
            normalizeInboxClaimOutcomes([
                awaiting,
                rejected,
                { id: 'missing-status' },
                { status: 'AWAITING_GUARDIAN' },
                { id: 'bad-status', status: 'APPROVED' },
                null,
                'string',
            ])
        ).toEqual([awaiting, rejected]);
    });

    it('collapses duplicate ids so a batch is never counted twice', () => {
        expect(normalizeInboxClaimOutcomes([awaiting, { ...awaiting }])).toEqual([awaiting]);
    });
});

describe('summarizeInboxClaimOutcomes', () => {
    it('separates awaiting from rejected', () => {
        expect(summarizeInboxClaimOutcomes([awaiting, rejected, rejected])).toEqual({
            awaiting: 1,
            rejected: 2,
            total: 3,
        });
    });
});

describe('resolveInboxClaimCompletion', () => {
    it('completes locally for an empty (no outcomes) inbox batch', () => {
        expect(
            resolveInboxClaimCompletion({
                requestUrl: inboxRequestUrl,
                credentialClaimCount: 2,
                body: {},
                outcomes: [],
            })
        ).toBe('complete-locally');
    });

    it('retains the pending summary when guardian outcomes remain', () => {
        expect(
            resolveInboxClaimCompletion({
                requestUrl: inboxRequestUrl,
                credentialClaimCount: 2,
                body: {},
                outcomes: [awaiting],
            })
        ).toBe('retain-pending');
    });

    it('continues to the server for a fresh initiation without a claim count', () => {
        expect(
            resolveInboxClaimCompletion({
                requestUrl: inboxRequestUrl,
                credentialClaimCount: undefined,
                body: {},
                outcomes: [awaiting],
            })
        ).toBe('continue');
    });

    it('continues to the server for generic (non-inbox) exchanges', () => {
        expect(
            resolveInboxClaimCompletion({
                requestUrl: 'http://localhost:4000/api/workflows/claim/exchanges/exchange-id',
                credentialClaimCount: 1,
                body: {},
                outcomes: [awaiting],
            })
        ).toBe('continue');
    });
});

describe('InboxGuardianPending', () => {
    it('renders an accessible awaiting summary with a fresh-check retry and home exit', () => {
        const onCheckAgain = vi.fn();
        const onGoHome = vi.fn();

        render(
            <InboxGuardianPending
                outcomes={[awaiting]}
                onCheckAgain={onCheckAgain}
                onGoHome={onGoHome}
            />
        );

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Waiting for guardian approval');
        expect(status).toHaveTextContent('1 credential is waiting for approval.');

        fireEvent.click(screen.getByRole('button', { name: /check again/i }));
        fireEvent.click(screen.getByRole('button', { name: /go to home/i }));

        expect(onCheckAgain).toHaveBeenCalledTimes(1);
        expect(onGoHome).toHaveBeenCalledTimes(1);
    });

    it('shows rejected outcomes separately and hides Check Again for a declined-only batch', () => {
        render(<InboxGuardianPending outcomes={[rejected]} onGoHome={vi.fn()} />);

        expect(screen.getByRole('status')).toHaveTextContent(
            '1 credential was declined by a guardian.'
        );
        expect(screen.queryByRole('button', { name: /check again/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    });

    it('shows loading feedback and disables the retry while checking', () => {
        render(
            <InboxGuardianPending
                outcomes={[awaiting]}
                onCheckAgain={vi.fn()}
                onGoHome={vi.fn()}
                isCheckingAgain
            />
        );

        const button = screen.getByRole('button', { name: /checking/i });
        expect(button).toBeDisabled();
        expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('renders an inline error retry alert when the fresh check fails', () => {
        render(
            <InboxGuardianPending
                outcomes={[awaiting]}
                onCheckAgain={vi.fn()}
                onGoHome={vi.fn()}
                checkAgainError
            />
        );

        expect(screen.getByRole('alert')).toHaveTextContent('Could not check for updates.');
        expect(screen.getByRole('button', { name: /check again/i })).toBeEnabled();
    });

    it('renders nothing when there are no outcomes', () => {
        const { container } = render(<InboxGuardianPending outcomes={[]} onGoHome={vi.fn()} />);

        expect(container).toBeEmptyDOMElement();
    });
});
