import { getResultValidationError } from '../components/resultField';
import { getOverlongTextVariables } from './longText';
import { SpreadsheetError } from './parseSpreadsheet';
import {
    IssueInboxCredentialBatchValidator,
    type InboxBatchStatus,
    type InboxBatchReceipt,
    type IssueInboxCredentialBatch,
} from '@learncard/types';
import { recipientKey, type Recipient } from '../components/recipientTypes';
import { effectiveRowValues } from './roster';
import { attachmentsToEvidence } from '../components/mediaEvidence';
import { saveIssuanceRun, readIssuanceRun } from './issuanceStore';
import {
    issuanceScopeKey,
    IssuanceRecoveryError,
    type IssuanceRun,
    type IssuanceScope,
    type RowOutcome,
    type SubmissionAttempt,
} from './issuanceTypes';

export interface IssuanceTransport {
    createTemplate: () => Promise<string>;
    submit: (body: IssueInboxCredentialBatch) => Promise<InboxBatchReceipt>;
    wait: (
        batchId: string,
        onProgress: (status: InboxBatchStatus) => void
    ) => Promise<InboxBatchStatus>;
    sendProfile: (
        profileId: string,
        templateUri: string,
        values: Record<string, unknown>
    ) => Promise<unknown>;
}

const latestAttemptFor = (run: IssuanceRun, rowId: string): SubmissionAttempt | undefined =>
    [...run.attempts].reverse().find(attempt => attempt.rowIds.includes(rowId));

/** Recheck receipts only; an unconfirmed send never authorizes a new submission. */
export const canCheckIssuanceStatus = (run: IssuanceRun): boolean =>
    run.attempts.some(
        attempt =>
            Boolean(attempt.batchId) &&
            attempt.rowIds.some(
                rowId =>
                    run.outcomes[rowId]?.state === 'confirming' &&
                    latestAttemptFor(run, rowId) === attempt
            )
    );

/** Attempted rows remain part of the recovery ledger, even after a definite failure. */
export const canRemoveIssuanceRow = (run: IssuanceRun | null, rowId: string): boolean =>
    !run?.attempts.some(attempt => attempt.rowIds.includes(rowId)) &&
    !['queued', 'sent', 'confirming'].includes(run?.outcomes[rowId]?.state ?? 'ready');

/** Check against the current run so stale modal callbacks cannot discard history. */
export const canReplaceIssuanceRecipients = (
    run: IssuanceRun | null,
    recipients: Recipient[]
): boolean => {
    const retained = new Set(recipients.map(recipientKey));
    return !run?.draft.recipients.some(
        row => !canRemoveIssuanceRow(run, recipientKey(row)) && !retained.has(recipientKey(row))
    );
};

export const classifyInboxOutcome = (item: InboxBatchStatus['items'][number]): RowOutcome => {
    const result = item.result;
    if (result?.success) return { state: 'sent', issuanceId: result.issuanceId };
    if (!result)
        return {
            state: ['NEEDS_RECONCILIATION', 'COMPLETED'].includes(item.state)
                ? 'confirming'
                : 'queued',
        };
    const uncertain =
        item.state === 'NEEDS_RECONCILIATION' ||
        result.issuanceId ||
        ['IN_PROGRESS', 'UNCONFIRMED', 'IDEMPOTENCY_MISMATCH', 'DUPLICATE_KEY'].includes(
            result.error.reason ?? ''
        );
    return {
        state: uncertain ? 'confirming' : item.state === 'COMPLETED' ? 'failed' : 'queued',
        error: result.error,
        issuanceId: result.issuanceId,
    };
};

const rowTemplateData = (run: IssuanceRun, rowId: string): Record<string, unknown> => {
    const recipient = run.draft.recipients.find(row => recipientKey(row) === rowId)!;
    const data: Record<string, unknown> = effectiveRowValues(
        recipient,
        Object.keys(run.scopes),
        run.scopes,
        run.shared,
        run.draft.values
    );
    const url = run.draft.evidence[rowId]?.trim();
    const evidence = attachmentsToEvidence(run.draft.attachments?.[rowId] ?? []);
    if (url && !evidence.some(item => item.id === url))
        evidence.push({ id: url, type: ['Evidence'] });
    if (evidence.length) data.evidence = evidence;
    return data;
};

// Brain-client's RegExp input transformer serializes JSON into a string, then
// tRPC wraps that string in its single-operation batch envelope.
export const inboxBatchWireBytes = (body: IssueInboxCredentialBatch): number =>
    new TextEncoder().encode(JSON.stringify({ '0': JSON.stringify(body) })).length;

/** Failure-only retries never include newly added, unattempted rows. */
export const isSubmissionCandidate = (
    run: IssuanceRun,
    row: Recipient,
    retryFailed = false
): boolean =>
    (run.outcomes[recipientKey(row)]?.state ?? 'ready') === (retryFailed ? 'failed' : 'ready');

const validateSubmissionResults = (run: IssuanceRun, retryFailed = false): void => {
    for (const row of run.draft.recipients.filter(row =>
        isSubmissionCandidate(run, row, retryFailed)
    )) {
        const values = effectiveRowValues(
            row,
            Object.keys(run.scopes),
            run.scopes,
            run.shared,
            run.draft.values
        );
        if (getOverlongTextVariables(run.template, values).length)
            throw new SpreadsheetError('mapping');
        if (
            getResultValidationError(
                run.template,
                effectiveRowValues(
                    row,
                    Object.keys(run.scopes),
                    run.scopes,
                    run.shared,
                    run.draft.values
                )
            )
        )
            throw new SpreadsheetError('mapping');
    }
};

/** Freeze new attempt IDs only for rows proved unsent; accepted attempts are immutable. */
export const addSubmissionAttempts = (run: IssuanceRun, retryFailed = false): IssuanceRun => {
    const rows = run.draft.recipients.filter(
        row => row.kind === 'email' && isSubmissionCandidate(run, row, retryFailed)
    );
    const attempts = [...run.attempts];
    let current: SubmissionAttempt | undefined;
    const newAttempt = (): SubmissionAttempt => {
        const id = crypto.randomUUID();
        return {
            id,
            createdAt: Date.now(),
            submissionStartedAt: null,
            rowIds: [],
            body: { requestId: `${run.id}:${id}`, items: [] },
        };
    };
    for (const row of rows) {
        if (row.kind !== 'email') continue;
        const rowId = recipientKey(row);
        const item: IssueInboxCredentialBatch['items'][number] = {
            recipient: { type: 'email', value: row.email.trim().toLowerCase() },
            templateUri: run.templateUri!,
            idempotencyKey: `${run.templateUri}:${rowId}`,
            configuration: { templateData: rowTemplateData(run, rowId) },
        };
        current ??= newAttempt();
        if (inboxBatchWireBytes({ ...current.body, items: [item] }) > 3.5 * 1024 * 1024)
            throw new IssuanceRecoveryError('oversize');
        const candidate = { ...current.body, items: [...current.body.items, item] };
        if (candidate.items.length > 100 || inboxBatchWireBytes(candidate) > 3.5 * 1024 * 1024) {
            attempts.push(current);
            current = newAttempt();
        }
        current.body.items.push(item);
        current.rowIds.push(rowId);
    }
    if (current?.rowIds.length) attempts.push(current);
    const outcomes = { ...run.outcomes };
    for (const attempt of attempts.slice(run.attempts.length))
        for (const rowId of attempt.rowIds) outcomes[rowId] = { state: 'queued' };
    for (const attempt of attempts) IssueInboxCredentialBatchValidator.parse(attempt.body);
    return { ...run, attempts, outcomes };
};

/** Only one controller may admit work for a run, including another tab. */
export const executeIssuance = async (
    initial: IssuanceRun,
    transport: IssuanceTransport,
    options: {
        currentScope: () => IssuanceScope;
        onChange: (run: IssuanceRun) => void;
        retryFailed?: boolean;
        checkOnly?: boolean;
        save?: typeof saveIssuanceRun;
        read?: typeof readIssuanceRun;
    }
): Promise<IssuanceRun> => {
    const execute = async (): Promise<IssuanceRun> => {
        let run = structuredClone(initial);
        const stored = await (options.read ?? readIssuanceRun)(run.id, run.scope);
        if (stored && stored.updatedAt !== initial.updatedAt)
            throw new IssuanceRecoveryError('busy');
        const assertScope = (): void => {
            if (issuanceScopeKey(run.scope) !== issuanceScopeKey(options.currentScope()))
                throw new IssuanceRecoveryError('context');
        };
        const persist = async (): Promise<void> => {
            assertScope();
            const previousRevision = run.updatedAt;
            run.updatedAt = Math.max(Date.now(), previousRevision + 1);
            try {
                await (options.save ?? saveIssuanceRun)(run);
            } catch (error) {
                run.updatedAt = previousRevision;
                options.onChange(structuredClone(run));
                throw error;
            }
            options.onChange(structuredClone(run));
        };
        if (!options.checkOnly) validateSubmissionResults(run, options.retryFailed);
        await persist();
        if (!run.templateUri && !options.checkOnly) {
            assertScope();
            run.templateUri = await transport.createTemplate();
            await persist();
        }
        // Resume old attempts before admitting new work. Do not regenerate keys/body.
        const observe = async (attempt: SubmissionAttempt): Promise<void> => {
            assertScope();
            if (!attempt.batchId) {
                const firstSubmission = attempt.submissionStartedAt === null;
                // Legacy attempts have no proof that admission never started.
                const startedAt = attempt.submissionStartedAt ?? attempt.createdAt;
                if (!firstSubmission && Date.now() - startedAt >= 24 * 3_600_000) {
                    // Never replay past the server's idempotency window. Quarantine
                    // these rows while allowing unrelated ready/failed work to continue.
                    for (const rowId of attempt.rowIds) {
                        if (latestAttemptFor(run, rowId) !== attempt) continue;
                        run.outcomes[rowId] = {
                            ...run.outcomes[rowId],
                            state: 'confirming',
                            error: { code: 'UNCONFIRMED', reason: 'EXPIRED', message: '' },
                        };
                    }
                    await persist();
                    return;
                }
                if (firstSubmission) {
                    attempt.submissionStartedAt = Date.now();
                    await persist(); // A crash after this point may have admitted the request.
                }
                assertScope();
                let receipt: InboxBatchReceipt;
                try {
                    receipt = await transport.submit(attempt.body);
                } catch (error) {
                    const failure = error as {
                        code?: string;
                        message?: string;
                        data?: { code?: string };
                    };
                    const code = failure.data?.code ?? failure.code;
                    // Only a first call can prove rejection of this request. A replay
                    // may lose authorization after an earlier accepted call lost its reply.
                    if (
                        firstSubmission &&
                        code &&
                        ['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'TOO_MANY_REQUESTS'].includes(
                            code
                        )
                    ) {
                        attempt.done = true;
                        for (const rowId of attempt.rowIds)
                            run.outcomes[rowId] = {
                                state: 'failed',
                                error: { code, message: failure.message ?? '' },
                            };
                        await persist();
                        if (code === 'TOO_MANY_REQUESTS') throw error;
                        return;
                    }
                    throw error; // Lost acknowledgement: preserve the exact request.
                }
                attempt.batchId = receipt.batchId;
                attempt.admittedAt = Date.now();
                await persist();
            }
            const update = (status: InboxBatchStatus): void => {
                assertScope();
                attempt.status = status;
                attempt.done = status.done;
                for (const item of status.items) {
                    const rowId = attempt.rowIds[item.index];
                    if (rowId && latestAttemptFor(run, rowId) === attempt)
                        run.outcomes[rowId] = classifyInboxOutcome(item);
                }
                options.onChange(structuredClone(run));
            };
            const status = await transport.wait(attempt.batchId, update);
            update(status);
            await persist();
        };
        if (options.checkOnly) {
            for (const attempt of run.attempts)
                if (
                    attempt.batchId &&
                    attempt.rowIds.some(
                        rowId =>
                            run.outcomes[rowId]?.state === 'confirming' &&
                            latestAttemptFor(run, rowId) === attempt
                    )
                )
                    await observe(attempt);
            return run;
        }
        for (const attempt of run.attempts)
            if (
                !attempt.done &&
                !(options.retryFailed && !attempt.batchId && attempt.submissionStartedAt === null)
            )
                await observe(attempt);
        // Receipt polling can turn a confirming row into a retry candidate.
        // Validate the resulting candidates before creating any new requests.
        validateSubmissionResults(run, options.retryFailed);
        const previousAttempts = run.attempts.length;
        run = addSubmissionAttempts(run, options.retryFailed);
        await persist();
        for (const attempt of run.attempts.slice(previousAttempts))
            if (!attempt.done) await observe(attempt);
        for (const recipient of run.draft.recipients) {
            if (recipient.kind !== 'profile') continue;
            const id = recipientKey(recipient);
            if (!isSubmissionCandidate(run, recipient, options.retryFailed)) continue;
            // A crash/lost response must leave the profile row uncertain, never ready.
            const templateData = rowTemplateData(run, id);
            run.outcomes[id] = { state: 'confirming', templateData };
            await persist();
            assertScope();
            try {
                await transport.sendProfile(recipient.profileId, run.templateUri!, templateData);
                run.outcomes[id] = { state: 'sent', templateData };
            } catch (error) {
                // send() has no ordinary idempotency contract. Even a transport error
                // can follow a successful write; do not classify it as safe to retry.
                run.outcomes[id] = {
                    state: 'confirming',
                    templateData,
                    error: {
                        code: 'UNCONFIRMED',
                        message: error instanceof Error ? error.message : '',
                    },
                };
            }
            await persist();
        }
        return run;
    };
    if (!navigator.locks) throw new IssuanceRecoveryError('storage');
    return navigator.locks.request(
        `learncard-issuance:${initial.id}`,
        { ifAvailable: true },
        lock => {
            if (!lock) throw new IssuanceRecoveryError('busy');
            return execute();
        }
    );
};
