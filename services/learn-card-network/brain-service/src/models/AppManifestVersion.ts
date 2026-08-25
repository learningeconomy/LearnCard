import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

import { FlatAppManifestVersionType } from 'types/app-manifest';
import { Integration, IntegrationInstance } from './Integration';
import { AppStoreListing, AppStoreListingInstance } from './AppStoreListing';

export type AppManifestVersionRelationships = {
    integration: ModelRelatedNodesI<typeof Integration, IntegrationInstance>;
    listing: ModelRelatedNodesI<typeof AppStoreListing, AppStoreListingInstance>;
};

export type AppManifestVersionInstance = NeogmaInstance<
    FlatAppManifestVersionType,
    AppManifestVersionRelationships
>;

export const AppManifestVersion = ModelFactory<
    FlatAppManifestVersionType,
    AppManifestVersionRelationships
>(
    {
        label: 'AppManifestVersion',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            version: { type: 'number', required: true },
            manifestHash: { type: 'string', required: true },
            manifestJson: { type: 'string', required: true },
            status: { type: 'string', enum: ['draft', 'active', 'superseded'], required: true },
            createdAt: { type: 'string', required: true },
            activatedAt: { type: 'string', required: false },
        },
        relationships: {
            integration: { model: Integration, direction: 'in', name: 'HAS_MANIFEST_VERSION' },
            listing: { model: AppStoreListing, direction: 'in', name: 'USES_MANIFEST_VERSION' },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default AppManifestVersion;
