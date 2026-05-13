import { ModelFactory, NeogmaInstance } from 'neogma';
import type { BitstringStatusPurpose } from '@learncard/types';

import { neogma } from '@instance';

export type StatusListPurpose = BitstringStatusPurpose;

export type StatusListType = {
    id: string;
    ownerProfileId: string;
    statusPurpose: StatusListPurpose;
    statusListCredential: string;
    size: number;
    nextIndex: number;
    encodedList: string;
    credential: string;
    created: string;
    updated: string;
    closed?: boolean;
};

export type StatusListInstance = NeogmaInstance<StatusListType, Record<string, never>>;

export const StatusList = ModelFactory<StatusListType, Record<string, never>>(
    {
        label: 'BitstringStatusList',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            ownerProfileId: { type: 'string', required: true },
            statusPurpose: {
                type: 'string',
                required: true,
                enum: ['revocation', 'suspension'],
            },
            statusListCredential: { type: 'string', required: true },
            size: { type: 'number', required: true },
            nextIndex: { type: 'number', required: true },
            encodedList: { type: 'string', required: true },
            credential: { type: 'string', required: true },
            created: { type: 'string', required: true },
            updated: { type: 'string', required: true },
            closed: { type: 'boolean', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default StatusList;
