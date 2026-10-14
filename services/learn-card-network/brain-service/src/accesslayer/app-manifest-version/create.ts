import { BindParam, QueryBuilder } from 'neogma';
import { v4 as uuid } from 'uuid';

import { Integration, AppManifestVersion } from '@models';
import type { AppManifest } from '@learncard/types';

import type { AppManifestVersionType } from 'types/app-manifest';

import { readAppManifestVersionById } from './read';

export const createAppManifestVersion = async ({
    integrationId,
    version,
    manifestHash,
    manifest,
    status = 'draft',
}: {
    integrationId: string;
    version: number;
    manifestHash: string;
    manifest: AppManifest;
    status?: 'draft' | 'active' | 'superseded';
}): Promise<AppManifestVersionType> => {
    const id = uuid();
    const createdAt = new Date().toISOString();

    await new QueryBuilder(
        new BindParam({
            integrationId,
            params: {
                id,
                version,
                manifestHash,
                manifestJson: JSON.stringify(manifest),
                status,
                createdAt,
            },
        })
    )
        .match({ model: Integration, identifier: 'integration', where: { id: integrationId } })
        .create({ model: AppManifestVersion, identifier: 'manifestVersion' })
        .set('manifestVersion += $params')
        .create(
            `(integration)-[:${
                Integration.getRelationshipByAlias('hasManifestVersion').name
            }]->(manifestVersion)`
        )
        .run();

    const created = await readAppManifestVersionById(id);

    if (!created) {
        throw new Error('Failed to create app manifest version');
    }

    return created;
};
