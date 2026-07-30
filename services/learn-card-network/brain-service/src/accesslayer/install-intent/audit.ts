import { v4 as uuid } from 'uuid';

import { neogma } from '@instance';

import {
    FlatInstallIntentAuditEventType,
    InstallIntentAuditEventType,
} from 'types/install-intent-audit';

type AuditSummary = Record<string, unknown> | undefined;

export type CreateInstallIntentAuditEventInput = {
    action: string;
    ecosystemId: string;
    actorProfileId?: string;
    actorDid?: string;
    intentId?: string;
    bindingId?: string;
    authorityChangesSummary?: string;
    beforeSummary?: AuditSummary;
    afterSummary?: AuditSummary;
};

export const createInstallIntentAuditEvent = async (
    input: CreateInstallIntentAuditEventInput
): Promise<void> => {
    await neogma.queryRunner.run(
        `CREATE (:InstallIntentAuditEvent {
            id: $id,
            action: $action,
            actorProfileId: $actorProfileId,
            actorDid: $actorDid,
            intentId: $intentId,
            bindingId: $bindingId,
            ecosystemId: $ecosystemId,
            authorityChangesSummary: $authorityChangesSummary,
            timestamp: $timestamp,
            beforeSummary: $beforeSummary,
            afterSummary: $afterSummary
        })`,
        {
            id: `install_intent_audit_${uuid()}`,
            action: input.action,
            actorProfileId: input.actorProfileId ?? null,
            actorDid: input.actorDid ?? null,
            intentId: input.intentId ?? null,
            bindingId: input.bindingId ?? null,
            ecosystemId: input.ecosystemId,
            authorityChangesSummary: input.authorityChangesSummary ?? null,
            timestamp: new Date().toISOString(),
            beforeSummary: input.beforeSummary ? JSON.stringify(input.beforeSummary) : null,
            afterSummary: input.afterSummary ? JSON.stringify(input.afterSummary) : null,
        }
    );
};

const parseSummary = (summary?: string): Record<string, unknown> | undefined => {
    if (!summary) return undefined;

    try {
        return JSON.parse(summary) as Record<string, unknown>;
    } catch {
        return undefined;
    }
};

const inflateAuditEvent = (
    event: FlatInstallIntentAuditEventType
): InstallIntentAuditEventType => ({
    ...event,
    actorProfileId: event.actorProfileId ?? undefined,
    actorDid: event.actorDid ?? undefined,
    intentId: event.intentId ?? undefined,
    bindingId: event.bindingId ?? undefined,
    authorityChangesSummary: event.authorityChangesSummary ?? undefined,
    beforeSummary: parseSummary(event.beforeSummary),
    afterSummary: parseSummary(event.afterSummary),
});

export const getInstallIntentAuditEvents = async (params: {
    intentId?: string;
    bindingId?: string;
    ecosystemId?: string;
}): Promise<InstallIntentAuditEventType[]> => {
    const conditions: string[] = [];
    const queryParams: Record<string, string> = {};

    if (params.intentId) {
        conditions.push('event.intentId = $intentId');
        queryParams.intentId = params.intentId;
    }
    if (params.bindingId) {
        conditions.push('event.bindingId = $bindingId');
        queryParams.bindingId = params.bindingId;
    }
    if (params.ecosystemId) {
        conditions.push('event.ecosystemId = $ecosystemId');
        queryParams.ecosystemId = params.ecosystemId;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await neogma.queryRunner.run(
        `MATCH (event:InstallIntentAuditEvent)
         ${whereClause}
         RETURN event
         ORDER BY event.timestamp ASC`,
        queryParams
    );

    return result.records.map(record =>
        inflateAuditEvent(record.get('event').properties as FlatInstallIntentAuditEventType)
    );
};
