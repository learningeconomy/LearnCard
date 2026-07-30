import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { FlatInstallIntentAuditEventType } from 'types/install-intent-audit';

export type InstallIntentAuditEventRelationships = Record<string, never>;

export type InstallIntentAuditEventInstance = NeogmaInstance<
    FlatInstallIntentAuditEventType,
    InstallIntentAuditEventRelationships
>;

export const InstallIntentAuditEvent = ModelFactory<
    FlatInstallIntentAuditEventType,
    InstallIntentAuditEventRelationships
>(
    {
        label: 'InstallIntentAuditEvent',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            action: { type: 'string', required: true },
            actorProfileId: { type: 'string', required: false },
            actorDid: { type: 'string', required: false },
            intentId: { type: 'string', required: false },
            bindingId: { type: 'string', required: false },
            ecosystemId: { type: 'string', required: true },
            authorityChangesSummary: { type: 'string', required: false },
            timestamp: { type: 'string', required: true },
            beforeSummary: { type: 'string', required: false },
            afterSummary: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default InstallIntentAuditEvent;
