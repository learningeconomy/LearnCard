import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { ListingVersionType } from 'types/listing-version';

export type ListingVersionRelationships = Record<string, never>;

export type ListingVersionInstance = NeogmaInstance<
    ListingVersionType,
    ListingVersionRelationships
>;

export const ListingVersion = ModelFactory<ListingVersionType, ListingVersionRelationships>(
    {
        label: 'ListingVersion',
        schema: {
            version_id: { type: 'string', required: true, uniqueItems: true },
            version: { type: 'string', required: true },
            status: { type: 'string', required: true },
            manifest_json: { type: 'string', required: false },
            manifest_hash: { type: 'string', required: false },
            publisher_did: { type: 'string', required: false },
            signature: { type: 'string', required: false },
            review_snapshot_json: { type: 'string', required: false },
            created_at: { type: 'string', required: true },
        } as any,
        primaryKeyField: 'version_id',
    },
    neogma
);

export default ListingVersion;
