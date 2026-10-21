import { randomUUID } from 'node:crypto';
import { BindParam, QueryBuilder } from 'neogma';
import { neogma } from '@instance';
import { CredentialSharePreview } from '@models';
import type {
    CredentialSharePreview as Preview,
    PublishCredentialSharePreview,
} from '@learncard/types';

export const createCredentialSharePreview = async (
    ownerProfileId: string,
    input: PublishCredentialSharePreview
): Promise<string | null> => {
    const id = input.id ?? randomUUID();
    const params = {
        id,
        ownerProfileId,
        name: input.name,
        issuer: input.issuer,
        shareUri: input.shareUri,
        image: input.image ?? null,
        createdAt: new Date().toISOString(),
    };
    const result = input.id
        ? await neogma.queryRunner.run(
              `MATCH (owner:Profile {profileId: $ownerProfileId})-[:PUBLISHED_CREDENTIAL_SHARE_PREVIEW]->(preview:CredentialSharePreview {id: $id})
               SET preview.name = $name, preview.issuer = $issuer, preview.shareUri = $shareUri, preview.image = $image
               RETURN preview.id AS id`,
              params
          )
        : await neogma.queryRunner.run(
              `MATCH (owner:Profile {profileId: $ownerProfileId})
               CREATE (preview:CredentialSharePreview {
                   id: $id, name: $name, issuer: $issuer, shareUri: $shareUri,
                   image: $image, createdAt: $createdAt
               })
               CREATE (owner)-[:PUBLISHED_CREDENTIAL_SHARE_PREVIEW]->(preview)
               RETURN preview.id AS id`,
              params
          );
    return result.records[0]?.get('id') ?? null;
};

export const getCredentialSharePreview = async (
    id: string,
    shareUri: string
): Promise<Preview | null> => {
    const result = await new QueryBuilder(new BindParam({ id, shareUri }))
        .match({ model: CredentialSharePreview, identifier: 'preview' })
        .where('preview.id = $id AND preview.shareUri = $shareUri')
        .return('preview')
        .limit(1)
        .run();
    const properties = result.records[0]?.get('preview').properties;
    if (!properties) return null;
    return {
        name: String(properties.name),
        issuer: String(properties.issuer),
        ...(typeof properties.image === 'string' ? { image: properties.image } : {}),
    };
};

export const deleteCredentialSharePreview = async (
    ownerProfileId: string,
    id: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (owner:Profile {profileId: $ownerProfileId})-[:PUBLISHED_CREDENTIAL_SHARE_PREVIEW]->(preview:CredentialSharePreview {id: $id})
         DETACH DELETE preview RETURN count(*) AS deleted`,
        { ownerProfileId, id }
    );
    return Number(result.records[0]?.get('deleted') ?? 0) > 0;
};
