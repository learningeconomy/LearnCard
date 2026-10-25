import React, { useId } from 'react';
import { IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    closeCircleOutline,
    homeOutline,
    refreshOutline,
    timeOutline,
} from 'ionicons/icons';

import * as m from '../../paraglide/messages.js';
import type { InboxClaimOutcome, InboxClaimOutcomeStatus } from './exchange.types';
import { shouldCompleteInboxClaimLocally } from './claimRequest.helpers';
import InboxAccountApprovalNotice from './InboxAccountApprovalNotice';

const OUTCOME_STATUSES: ReadonlySet<string> = new Set<InboxClaimOutcomeStatus>([
    'AWAITING_GUARDIAN',
    'GUARDIAN_REJECTED',
]);

/**
 * Defensively normalizes the optional `inboxClaimOutcomes` field. Older
 * wrapped/unwrapped VC-API responses omit it entirely; malformed entries are
 * dropped rather than rendered. Duplicate ids are collapsed so a batch can't
 * be counted twice.
 */
export const normalizeInboxClaimOutcomes = (value: unknown): InboxClaimOutcome[] => {
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();
    const outcomes: InboxClaimOutcome[] = [];

    for (const candidate of value) {
        if (!candidate || typeof candidate !== 'object') continue;

        const { id, status } = candidate as { id?: unknown; status?: unknown };
        if (typeof id !== 'string' || !id) continue;
        if (typeof status !== 'string' || !OUTCOME_STATUSES.has(status)) continue;
        if (seen.has(id)) continue;

        seen.add(id);
        outcomes.push({ id, status: status as InboxClaimOutcomeStatus });
    }

    return outcomes;
};

export interface InboxClaimOutcomeSummary {
    awaiting: number;
    rejected: number;
    total: number;
}

export const summarizeInboxClaimOutcomes = (
    outcomes: InboxClaimOutcome[]
): InboxClaimOutcomeSummary => {
    let awaiting = 0;
    let rejected = 0;

    for (const outcome of outcomes) {
        if (outcome.status === 'AWAITING_GUARDIAN') awaiting += 1;
        else if (outcome.status === 'GUARDIAN_REJECTED') rejected += 1;
    }

    return { awaiting, rejected, total: outcomes.length };
};

export type InboxClaimCompletionAction = 'continue' | 'complete-locally' | 'retain-pending';

/**
 * Decides what an `onAccept` from the accept screen should do for an inbox
 * claim batch.
 *
 * The brain service finalizes eligible inbox credentials before returning them,
 * so once the learner saves them locally there is no follow-up request to make.
 * An empty POST would be interpreted as a *new* claim initiation.
 * When guardian outcomes remain, the local shortcut must also retain the
 * pending summary instead of navigating away (which would drop the waiting
 * state).
 */
export const resolveInboxClaimCompletion = ({
    requestUrl,
    credentialClaimCount,
    body,
    outcomes,
}: {
    requestUrl: unknown;
    credentialClaimCount?: number;
    body?: unknown;
    outcomes: InboxClaimOutcome[];
}): InboxClaimCompletionAction => {
    if (!shouldCompleteInboxClaimLocally(requestUrl, credentialClaimCount, body)) return 'continue';

    return outcomes.length > 0 ? 'retain-pending' : 'complete-locally';
};

export interface InboxGuardianPendingProps {
    outcomes: InboxClaimOutcome[];
    onGoHome: () => void;
    /** Starts a fresh exchange challenge. Omitted when only rejected items remain. */
    onCheckAgain?: () => void;
    isCheckingAgain?: boolean;
    checkAgainError?: boolean;
    variant?: 'inline' | 'page';
    className?: string;
}

/**
 * Localized, accessible summary of guardian-gated inbox claim outcomes.
 *
 * Rendered mixed with eligible credentials, or on its own when every delivery
 * is still pending/declined. "Check Again" is a fresh exchange initiation — the
 * caller must not reuse a previously signed VP.
 */
const InboxGuardianPending: React.FC<InboxGuardianPendingProps> = ({
    outcomes,
    onGoHome,
    onCheckAgain,
    isCheckingAgain = false,
    checkAgainError = false,
    variant = 'inline',
    className = '',
}) => {
    const headingId = useId();
    const summary = summarizeInboxClaimOutcomes(outcomes);

    if (summary.total === 0) return null;

    const rejectedOnly = summary.awaiting === 0 && summary.rejected > 0;
    const canCheckAgain = summary.awaiting > 0 && Boolean(onCheckAgain);
    const isPage = variant === 'page';

    const cardClassName = [
        'rounded-[20px] border p-5 font-poppins',
        rejectedOnly ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50',
        isPage ? 'w-full max-w-md shadow-xl' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={`w-full space-y-4 ${isPage ? 'max-w-md' : ''} ${className}`}>
            {/*
             * Account approval is a separate concern from the credential
             * outcomes below: a profile can be unapproved while credentials are
             * pending, and vice versa. Keep them as distinct surfaces.
             */}
            <InboxAccountApprovalNotice variant={variant} />

            <section
                role="status"
                aria-live="polite"
                aria-labelledby={headingId}
                aria-busy={isCheckingAgain || undefined}
                className={cardClassName}
            >
                <div className="flex items-start gap-3">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            rejectedOnly ? 'bg-red-100' : 'bg-amber-100'
                        }`}
                    >
                        <IonIcon
                            icon={rejectedOnly ? closeCircleOutline : timeOutline}
                            aria-hidden="true"
                            className={`text-2xl ${rejectedOnly ? 'text-red-500' : 'text-amber-600'}`}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2
                            id={headingId}
                            className="text-base font-semibold leading-snug text-grayscale-900"
                        >
                            {rejectedOnly
                                ? m['claim.pending.rejectedTitle']()
                                : m['claim.pending.title']()}
                        </h2>

                        <p className="mt-1 text-sm leading-relaxed text-grayscale-600">
                            {rejectedOnly
                                ? m['claim.pending.rejectedSubtitle']()
                                : m['claim.pending.subtitle']()}
                        </p>
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    {summary.awaiting > 0 && (
                        <div className="flex items-start gap-2.5">
                            <IonIcon
                                icon={timeOutline}
                                aria-hidden="true"
                                className="mt-0.5 shrink-0 text-amber-600"
                            />

                            <div>
                                <p className="text-sm font-medium text-grayscale-900">
                                    {summary.awaiting === 1
                                        ? m['claim.pending.awaiting.one']({
                                              count: summary.awaiting,
                                          })
                                        : m['claim.pending.awaiting.other']({
                                              count: summary.awaiting,
                                          })}
                                </p>

                                <p className="mt-0.5 text-xs leading-relaxed text-grayscale-600">
                                    {m['claim.pending.awaitingHint']()}
                                </p>
                            </div>
                        </div>
                    )}

                    {summary.rejected > 0 && (
                        <div className="flex items-start gap-2.5">
                            <IonIcon
                                icon={closeCircleOutline}
                                aria-hidden="true"
                                className="mt-0.5 shrink-0 text-red-500"
                            />

                            <p className="text-sm font-medium text-grayscale-900">
                                {summary.rejected === 1
                                    ? m['claim.pending.rejected.one']({ count: summary.rejected })
                                    : m['claim.pending.rejected.other']({
                                          count: summary.rejected,
                                      })}
                            </p>
                        </div>
                    )}
                </div>

                {checkAgainError && (
                    <div
                        role="alert"
                        className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3"
                    >
                        <IonIcon
                            icon={alertCircleOutline}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-red-500"
                        />

                        <p className="text-sm leading-relaxed text-red-700">
                            {m['claim.pending.checkAgainError']()}
                        </p>
                    </div>
                )}

                <div className="mt-5 space-y-2.5">
                    {canCheckAgain && (
                        <button
                            type="button"
                            onClick={onCheckAgain}
                            disabled={isCheckingAgain}
                            aria-busy={isCheckingAgain || undefined}
                            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isCheckingAgain ? (
                                <>
                                    <span
                                        aria-hidden
                                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                    />
                                    {m['claim.pending.checking']()}
                                </>
                            ) : (
                                <>
                                    <IonIcon
                                        icon={refreshOutline}
                                        aria-hidden="true"
                                        className="text-base"
                                    />
                                    {m['claim.pending.checkAgain']()}
                                </>
                            )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onGoHome}
                        className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10"
                    >
                        <IonIcon icon={homeOutline} aria-hidden="true" className="text-base" />
                        {m['claim.pending.goHome']()}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default InboxGuardianPending;
