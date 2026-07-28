import { v4 as uuid } from 'uuid';

import { neogma } from '@instance';

type GroupAuditSummary = Record<string, unknown> | undefined;

export type CreateGroupAuditEventInput = {
    actorProfileId: string;
    action: string;
    groupId: string;
    ecosystemId: string;
    beforeSummary?: GroupAuditSummary;
    afterSummary?: GroupAuditSummary;
};

export const createGroupAuditEvent = async (input: CreateGroupAuditEventInput): Promise<void> => {
    await neogma.queryRunner.run(
        `CREATE (:GroupAuditEvent {
            id: $id,
            action: $action,
            actorProfileId: $actorProfileId,
            groupId: $groupId,
            ecosystemId: $ecosystemId,
            timestamp: $timestamp,
            beforeSummary: $beforeSummary,
            afterSummary: $afterSummary
        })`,
        {
            id: `group_audit_${uuid()}`,
            action: input.action,
            actorProfileId: input.actorProfileId,
            groupId: input.groupId,
            ecosystemId: input.ecosystemId,
            timestamp: new Date().toISOString(),
            beforeSummary: input.beforeSummary ? JSON.stringify(input.beforeSummary) : null,
            afterSummary: input.afterSummary ? JSON.stringify(input.afterSummary) : null,
        }
    );
};

export type GroupAuditEventRecord = {
    id: string;
    action: string;
    actorProfileId: string;
    groupId: string;
    ecosystemId: string;
    timestamp: string;
    beforeSummary?: Record<string, unknown>;
    afterSummary?: Record<string, unknown>;
};

const parseSummary = (summary?: string): Record<string, unknown> | undefined => {
    if (!summary) return undefined;

    try {
        return JSON.parse(summary) as Record<string, unknown>;
    } catch {
        return undefined;
    }
};

export const getGroupAuditEvents = async (groupId: string): Promise<GroupAuditEventRecord[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (event:GroupAuditEvent { groupId: $groupId })
         RETURN event
         ORDER BY event.timestamp ASC`,
        { groupId }
    );

    return result.records.map(record => {
        const event = record.get('event').properties as {
            id: string;
            action: string;
            actorProfileId: string;
            groupId: string;
            ecosystemId: string;
            timestamp: string;
            beforeSummary?: string;
            afterSummary?: string;
        };

        return {
            id: event.id,
            action: event.action,
            actorProfileId: event.actorProfileId,
            groupId: event.groupId,
            ecosystemId: event.ecosystemId,
            timestamp: event.timestamp,
            beforeSummary: parseSummary(event.beforeSummary),
            afterSummary: parseSummary(event.afterSummary),
        };
    });
};
