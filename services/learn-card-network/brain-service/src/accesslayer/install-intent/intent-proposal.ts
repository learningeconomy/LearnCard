import { TRPCError } from '@trpc/server';
import { v4 as uuid } from 'uuid';

import {
    InstallIntentApprovalValidator,
    InstallIntentPlan,
    InstallIntentPlanValidator,
    InstallIntentProposal,
    InstallIntentProposalValidator,
} from '@learncard/types';
import { InstallIntent } from '@models';
import { InstallIntentRecordType } from 'types/install-intent';

import {
    assertMutableProposalState,
    createInstallIntentEdges,
    getInstallIntentRecord,
    serializeInstallIntentRecord,
    writeInstallIntentNode,
} from './shared';
import { getCatalogPolicyRevision } from '@helpers/catalog-policy.helpers';

export type CreateInstallIntentProposalInput = {
    intentId?: string;
    ecosystemId: string;
    proposal: InstallIntentProposal;
    plan: InstallIntentPlan;
    approval?: Extract<
        InstallIntentRecordType['approval'],
        { state: 'PENDING_ADOPTION' | 'REJECTED' }
    >;
};

export const createInstallIntentProposal = async (
    input: CreateInstallIntentProposalInput
): Promise<InstallIntentRecordType> => {
    const intentId = input.intentId ?? `int_${uuid()}`;
    const now = new Date().toISOString();
    const proposal = InstallIntentProposalValidator.parse(input.proposal);
    const plan = InstallIntentPlanValidator.parse(input.plan);
    const policyRevision = await getCatalogPolicyRevision(input.ecosystemId);
    const approval = InstallIntentApprovalValidator.parse(
        input.approval ?? {
            apiVersion: 'lc.install-approval/v1',
            state: 'PENDING_ADOPTION',
        }
    );

    const record: InstallIntentRecordType = {
        apiVersion: 'lc.install-intent/v1',
        intentId,
        ecosystemId: input.ecosystemId,
        proposal,
        approval,
        plan,
        spec: undefined,
        status: undefined,
        specRevision: 0,
        statusRevision: 0,
        policyRevision,
        createdAt: now,
        updatedAt: now,
    };

    await InstallIntent.createOne(serializeInstallIntentRecord(record));
    await createInstallIntentEdges(record.ecosystemId, record.intentId, proposal.source);

    return record;
};

export const updateInstallIntentProposal = async (
    intentId: string,
    updates: {
        proposal?: InstallIntentProposal;
        plan?: InstallIntentPlan;
        approval?: Extract<
            InstallIntentRecordType['approval'],
            { state: 'PENDING_ADOPTION' | 'REJECTED' }
        >;
    }
): Promise<InstallIntentRecordType> => {
    const existing = await getInstallIntentRecord(intentId);

    if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `InstallIntent ${intentId} not found.` });
    }

    assertMutableProposalState(existing);
    const policyRevision = await getCatalogPolicyRevision(existing.ecosystemId);

    const updated: InstallIntentRecordType = {
        ...existing,
        proposal: updates.proposal
            ? InstallIntentProposalValidator.parse(updates.proposal)
            : existing.proposal,
        plan: updates.plan ? InstallIntentPlanValidator.parse(updates.plan) : existing.plan,
        approval: updates.approval
            ? InstallIntentApprovalValidator.parse(updates.approval)
            : existing.approval,
        policyRevision,
        updatedAt: new Date().toISOString(),
    };

    await writeInstallIntentNode(updated);

    return updated;
};
