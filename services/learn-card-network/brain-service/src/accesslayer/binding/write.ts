import { TRPCError } from '@trpc/server';
import { v4 as uuid } from 'uuid';

import { BindingValidator } from '@learncard/types';
import { Binding } from '@models';
import { BindingRecordType } from 'types/binding';

import {
    createBindingEdges,
    requireBindingRecord,
    serializeBindingRecord,
    writeBindingRecord,
} from './shared';

export const createBinding = async (
    input: Omit<
        BindingRecordType,
        'bindingId' | 'revision' | 'createdAt' | 'updatedAt' | 'revisions'
    > & {
        bindingId?: string;
        policyRevision?: string;
    }
): Promise<BindingRecordType> => {
    const now = new Date().toISOString();
    const binding = BindingValidator.parse({
        apiVersion: input.apiVersion,
        bindingId: input.bindingId ?? `bind_${uuid()}`,
        ecosystemId: input.ecosystemId,
        capability: input.capability,
        provider: input.provider,
        consumer: input.consumer,
        status: input.status,
        approvedBy: input.approvedBy,
        approvedAt: input.approvedAt,
        revisions: { bindingRevision: 0, policyRevision: input.policyRevision },
    });

    const record: BindingRecordType = {
        ...binding,
        revision: 0,
        createdAt: now,
        updatedAt: now,
    };

    await Binding.createOne(serializeBindingRecord(record));
    await createBindingEdges(record);

    return record;
};

const assertExpectedRevision = (binding: BindingRecordType, expectedRevision: number): void => {
    if (binding.revision !== expectedRevision) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Binding revision is stale.' });
    }
};

export const approveBinding = async (
    bindingId: string,
    expectedRevision: number,
    approvedBy: string,
    approvedAt = new Date().toISOString()
): Promise<BindingRecordType> => {
    const existing = await requireBindingRecord(bindingId);
    assertExpectedRevision(existing, expectedRevision);

    if (existing.status !== 'PROPOSED') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only PROPOSED bindings can be approved.',
        });
    }

    const updated: BindingRecordType = {
        ...existing,
        status: 'APPROVED',
        approvedBy,
        approvedAt,
        revisions: {
            ...existing.revisions,
            bindingRevision: existing.revisions.bindingRevision + 1,
        },
        revision: existing.revision + 1,
        updatedAt: new Date().toISOString(),
    };

    await writeBindingRecord(updated);

    return updated;
};

export const revokeBinding = async (
    bindingId: string,
    expectedRevision: number
): Promise<BindingRecordType> => {
    const existing = await requireBindingRecord(bindingId);
    assertExpectedRevision(existing, expectedRevision);

    if (existing.status === 'REVOKED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Binding is already revoked.' });
    }

    const updated: BindingRecordType = {
        ...existing,
        status: 'REVOKED',
        revisions: {
            ...existing.revisions,
            bindingRevision: existing.revisions.bindingRevision + 1,
        },
        revision: existing.revision + 1,
        updatedAt: new Date().toISOString(),
    };

    await writeBindingRecord(updated);

    return updated;
};

export const activateBinding = async (
    bindingId: string,
    expectedRevision: number
): Promise<BindingRecordType> => {
    const existing = await requireBindingRecord(bindingId);
    assertExpectedRevision(existing, expectedRevision);

    if (existing.status !== 'APPROVED') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only APPROVED bindings can be activated.',
        });
    }

    const updated: BindingRecordType = {
        ...existing,
        status: 'ACTIVE',
        revisions: {
            ...existing.revisions,
            bindingRevision: existing.revisions.bindingRevision + 1,
        },
        revision: existing.revision + 1,
        updatedAt: new Date().toISOString(),
    };

    await writeBindingRecord(updated);

    return updated;
};
