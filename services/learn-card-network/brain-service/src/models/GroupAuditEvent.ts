import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

export type GroupAuditEventType = {
    id: string;
    action: string;
    actorProfileId: string;
    groupId: string;
    ecosystemId: string;
    timestamp: string;
    beforeSummary?: string;
    afterSummary?: string;
};

export type GroupAuditEventInstance = NeogmaInstance<GroupAuditEventType, Record<string, never>>;

export const GroupAuditEvent = ModelFactory<GroupAuditEventType, Record<string, never>>(
    {
        label: 'GroupAuditEvent',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            action: { type: 'string', required: true },
            actorProfileId: { type: 'string', required: true },
            groupId: { type: 'string', required: true },
            ecosystemId: { type: 'string', required: true },
            timestamp: { type: 'string', required: true },
            beforeSummary: { type: 'string', required: false },
            afterSummary: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default GroupAuditEvent;
