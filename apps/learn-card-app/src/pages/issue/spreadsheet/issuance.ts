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

/** Freeze new attempt IDs only for rows proved unsent; accepted attempts are immutable. */
export const addSubmissionAttempts = (run: IssuanceRun, retryFailed = false): IssuanceRun => {
    const rows = run.draft.recipients.filter(
        row =>
            row.kind === 'email' &&
            (retryFailed ? ['ready', 'failed'] : ['ready']).includes(
                run.outcomes[recipientKey(row)]?.state ?? 'ready'
            )
    );
    const attempts = [...run.attempts];
    let current: SubmissionAttempt | undefined;
    const newAttempt = (): SubmissionAttempt => {
        const id = crypto.randomUUID();
        return {
            id,
            createdAt: Date.now(),
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
        await persist();
        if (!run.templateUri) {
            assertScope();
            run.templateUri = await transport.createTemplate();
            await persist();
        }
        // Resume old attempts before admitting new work. Do not regenerate keys/body.
        const observe = async (
            attempt: SubmissionAttempt,
            firstSubmission = false
        ): Promise<void> => {
            assertScope();
            if (!attempt.batchId) {
                if (Date.now() - attempt.createdAt >= 24 * 3_600_000)
                    throw new IssuanceRecoveryError('expired');
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
                    if (rowId) run.outcomes[rowId] = classifyInboxOutcome(item);
                }
                options.onChange(structuredClone(run));
            };
            const status = await transport.wait(attempt.batchId, update);
            update(status);
            await persist();
        };
        for (const attempt of run.attempts) if (!attempt.done) await observe(attempt);
        const previousAttempts = run.attempts.length;
        run = addSubmissionAttempts(run, options.retryFailed);
        await persist();
        for (const attempt of run.attempts.slice(previousAttempts))
            if (!attempt.done) await observe(attempt, true);
        for (const recipient of run.draft.recipients) {
            if (recipient.kind !== 'profile') continue;
            const id = recipientKey(recipient);
            if (
                !(options.retryFailed ? ['ready', 'failed'] : ['ready']).includes(
                    run.outcomes[id]?.state ?? 'ready'
                )
            )
                continue;
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
