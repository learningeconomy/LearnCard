import { TRPCError } from '@trpc/server';

import { InstallIntentStatusCause, InstallIntentStatusPhase } from '@learncard/types';
import { InstallIntentRecordType, InstallIntentStatusRecordValidator } from 'types/install-intent';

import {
    assertStatusWriterInput,
    createSuspendedPolicyStatus,
    getInstallIntentRecord,
    writeInstallIntentNode,
} from './shared';

export type WriteInstallIntentStatusInput = {
    intentId: string;
    expectedStatusRevision: number;
    phase: InstallIntentStatusPhase;
    cause?: InstallIntentStatusCause;
    message?: string;
    observedAt?: string;
    retryCount?: number;
    nextAttemptAt?: string;
};

export const writeInstallIntentStatus = async (
    input: WriteInstallIntentStatusInput
): Promise<InstallIntentRecordType> => {
    const existing = await getInstallIntentRecord(input.intentId);

    if (!existing) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `InstallIntent ${input.intentId} not found.`,
        });
    }

    assertStatusWriterInput(existing);

    if (existing.statusRevision !== input.expectedStatusRevision) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'InstallIntent status revision is stale.',
        });
    }

    const nextStatusRevision = existing.statusRevision + 1;
    const status = InstallIntentStatusRecordValidator.parse({
        apiVersion: 'lc.install-status/v1',
        phase: input.phase,
        cause: input.cause,
        message: input.message,
        observedAt: input.observedAt ?? new Date().toISOString(),
        statusRevision: nextStatusRevision,
        retryCount: input.retryCount ?? existing.status?.retryCount ?? 0,
        nextAttemptAt: input.nextAttemptAt,
    });

    const updated: InstallIntentRecordType = {
        ...existing,
        status,
        statusRevision: nextStatusRevision,
        updatedAt: new Date().toISOString(),
    };

    await writeInstallIntentNode(updated);

    return updated;
};

export const suspendInstallIntentForPolicy = async (
    intentId: string,
    expectedStatusRevision: number,
    message?: string
): Promise<InstallIntentRecordType> => {
    const existing = await getInstallIntentRecord(intentId);

    if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `InstallIntent ${intentId} not found.` });
    }

    assertStatusWriterInput(existing);

    if (existing.statusRevision !== expectedStatusRevision) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'InstallIntent status revision is stale.',
        });
    }

    const currentPhase = existing.status?.phase;
    if (currentPhase !== 'READY' && currentPhase !== 'APPLYING') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Policy suspension is only valid from READY or APPLYING.',
        });
    }

    const nextStatusRevision = existing.statusRevision + 1;
    const updated: InstallIntentRecordType = {
        ...existing,
        status: createSuspendedPolicyStatus(nextStatusRevision, new Date().toISOString(), message),
        statusRevision: nextStatusRevision,
        updatedAt: new Date().toISOString(),
    };

    await writeInstallIntentNode(updated);

    return updated;
};
