import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

export type EdlinkConnectionProps = {
    id: string;
    integrationId: string;
    sourceId: string;
    accessToken: string;
    provider: string;
    providerName: string;
    institutionName: string;
    status: string;
    connectedAt: string;
    // Auto-issuance fields
    ownerProfileId?: string;
    autoIssueCredentials?: boolean;
    lastPolledAt?: string;
};

export type EdlinkConnectionRelationships = Record<string, never>;

export type EdlinkConnectionInstance = NeogmaInstance<
    EdlinkConnectionProps,
    EdlinkConnectionRelationships
>;

export const EdlinkConnection = ModelFactory<EdlinkConnectionProps, EdlinkConnectionRelationships>(
    {
        label: 'EdlinkConnection',
        schema: {
            id: { type: 'string', required: true },
            integrationId: { type: 'string', required: true },
            sourceId: { type: 'string', required: true },
            accessToken: { type: 'string', required: true },
            provider: { type: 'string', required: true },
            providerName: { type: 'string', required: true },
            institutionName: { type: 'string', required: true },
            status: { type: 'string', required: true },
            connectedAt: { type: 'string', required: true },
            // Auto-issuance fields
            ownerProfileId: { type: 'string', required: false },
            autoIssueCredentials: { type: 'boolean', required: false },
            lastPolledAt: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default EdlinkConnection;
