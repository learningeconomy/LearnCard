import { TRPCError } from '@trpc/server';

import {
    ApprovalArtifact,
    ApprovalArtifactValidator,
    InstallIntentApprovalValidator,
    InstallIntentSpec,
    InstallIntentSpecValidator,
} from '@learncard/types';
import { InstallIntentRecordType, InstallIntentStatusRecordValidator } from 'types/install-intent';
import { getCatalogPolicyRevision } from '@helpers/catalog-policy.helpers';

import { getInstallIntentRecord, writeInstallIntentNode } from './shared';

export type ApproveInstallIntentInput = {
    intentId: string;
    spec: InstallIntentSpec;
    artifact: ApprovalArtifact;
};

export const approveInstallIntent = async (
    input: ApproveInstallIntentInput
): Promise<InstallIntentRecordType> => {
    const existing = await getInstallIntentRecord(input.intentId);

    if (!existing) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `InstallIntent ${input.intentId} not found.`,
        });
    }

    if (existing.spec || existing.approval.state === 'APPROVED') {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'InstallIntent approval is single-use; spec is already materialized.',
        });
    }

    const artifact = ApprovalArtifactValidator.parse(input.artifact);
    const spec = InstallIntentSpecValidator.parse(input.spec);

    if (
        artifact.planHash !== existing.plan.planHash ||
        artifact.planRevision !== existing.plan.planRevision
    ) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Approval artifact does not match the current rendered plan.',
        });
    }

    const currentPolicyRevision = await getCatalogPolicyRevision(existing.ecosystemId);

    // Approval rejects when the effective catalog policy changed since planning.
    if (currentPolicyRevision !== existing.policyRevision) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Catalog policy changed since the install plan was rendered.',
        });
    }

    const nextSpecRevision = existing.specRevision + 1;
    const nextStatusRevision = existing.statusRevision + 1;
    const observedAt = artifact.approvedAt;

    const updated: InstallIntentRecordType = {
        ...existing,
        approval: InstallIntentApprovalValidator.parse({
            apiVersion: 'lc.install-approval/v1',
            state: 'APPROVED',
            artifact,
        }),
        spec,
        status: InstallIntentStatusRecordValidator.parse({
            apiVersion: 'lc.install-status/v1',
            phase: 'PLANNED',
            observedAt,
            statusRevision: nextStatusRevision,
            retryCount: 0,
        }),
        specRevision: nextSpecRevision,
        statusRevision: nextStatusRevision,
        policyRevision: existing.policyRevision,
        updatedAt: new Date().toISOString(),
    };

    await writeInstallIntentNode(updated);

    return updated;
};
