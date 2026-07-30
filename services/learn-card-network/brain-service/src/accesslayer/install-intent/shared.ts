import { TRPCError } from '@trpc/server';

import {
    InstallIntentApprovalValidator,
    InstallIntentPlanValidator,
    InstallIntentProposalValidator,
    InstallIntentSpecValidator,
    InstallIntentSource,
    InstallIntentStatus,
} from '@learncard/types';
import { InstallIntent, Ecosystem } from '@models';
import { neogma } from '@instance';
import {
    FlatInstallIntentType,
    InstallIntentRecordType,
    InstallIntentRecordValidator,
    InstallIntentStatusRecordValidator,
} from 'types/install-intent';

const parseJson = <T>(
    value: string | undefined,
    parser: { parse: (input: unknown) => T }
): T | undefined => {
    if (value === undefined) return undefined;

    return parser.parse(JSON.parse(value));
};

export const inflateInstallIntent = (flat: FlatInstallIntentType): InstallIntentRecordType => {
    return InstallIntentRecordValidator.parse({
        ...flat,
        proposal: InstallIntentProposalValidator.parse(JSON.parse(flat.proposal)),
        approval: InstallIntentApprovalValidator.parse(JSON.parse(flat.approval)),
        plan: InstallIntentPlanValidator.parse(JSON.parse(flat.plan)),
        spec: parseJson(flat.spec, InstallIntentSpecValidator),
        status: parseJson(flat.status, InstallIntentStatusRecordValidator),
    });
};

export const getInstallIntentRecord = async (
    intentId: string
): Promise<InstallIntentRecordType | null> => {
    const flat = await InstallIntent.findOne({ where: { intentId }, plain: true });

    return flat ? inflateInstallIntent(flat as FlatInstallIntentType) : null;
};

export const requireInstallIntentRecord = async (
    intentId: string
): Promise<InstallIntentRecordType> => {
    const intent = await getInstallIntentRecord(intentId);

    if (!intent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `InstallIntent ${intentId} not found.` });
    }

    return intent;
};

export const serializeInstallIntentRecord = (
    record: InstallIntentRecordType
): FlatInstallIntentType => {
    return {
        ...record,
        proposal: JSON.stringify(record.proposal),
        approval: JSON.stringify(record.approval),
        plan: JSON.stringify(record.plan),
        spec: record.spec ? JSON.stringify(record.spec) : undefined,
        status: record.status ? JSON.stringify(record.status) : undefined,
    };
};

export const assertMutableProposalState = (record: InstallIntentRecordType): void => {
    if (record.spec || record.approval.state === 'APPROVED') {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Proposal fields are immutable after approval materializes spec.',
        });
    }
};

export const assertStatusWriterInput = (record: InstallIntentRecordType): void => {
    if (!record.spec) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Observed status cannot be written before approval materializes spec.',
        });
    }
};

export const writeInstallIntentNode = async (record: InstallIntentRecordType): Promise<void> => {
    const flat = serializeInstallIntentRecord(record);

    await neogma.queryRunner.run(
        `MATCH (intent:InstallIntent { intentId: $intentId })
         SET intent += $patch`,
        { intentId: record.intentId, patch: flat }
    );
};

const getSourceListingIds = (
    source: InstallIntentSource
): { listingId: string; versionId: string } => {
    if (source.type === 'CATALOG_LISTING') {
        return { listingId: source.listingId, versionId: source.versionId };
    }

    return { listingId: source.listingId, versionId: source.versionId };
};

export const createInstallIntentEdges = async (
    ecosystemId: string,
    intentId: string,
    source: InstallIntentSource
): Promise<void> => {
    const ecosystem = await Ecosystem.findOne({ where: { id: ecosystemId }, plain: true });

    if (!ecosystem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Ecosystem ${ecosystemId} not found.` });
    }

    const { listingId, versionId } = getSourceListingIds(source);

    await neogma.queryRunner.run(
        `MATCH (ecosystem:Ecosystem { id: $ecosystemId })
         MATCH (intent:InstallIntent { intentId: $intentId })
         MATCH (listing:AppStoreListing { listing_id: $listingId })
         MERGE (ecosystem)-[:HAS_INTENT]->(intent)
         MERGE (intent)-[:REALIZES]->(listing)`,
        { ecosystemId, intentId, listingId }
    );

    await neogma.queryRunner.run(
        `MATCH (intent:InstallIntent { intentId: $intentId })
         MATCH (version:ListingVersion { version_id: $versionId })
         MERGE (intent)-[:PINS_VERSION]->(version)`,
        { intentId, versionId }
    );
};

export const createSuspendedPolicyStatus = (
    statusRevision: number,
    observedAt: string,
    message?: string
): InstallIntentStatus => {
    return InstallIntentStatusRecordValidator.parse({
        apiVersion: 'lc.install-status/v1',
        phase: 'SUSPENDED',
        cause: 'POLICY',
        message,
        observedAt,
        statusRevision,
        retryCount: 0,
    });
};
