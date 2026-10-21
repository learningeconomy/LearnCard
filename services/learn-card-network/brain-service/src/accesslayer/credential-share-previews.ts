import { BindParam, QueryBuilder } from 'neogma';
import { CredentialSharePreview } from '@models';
import type { CredentialSharePreview as Preview } from '@learncard/types';

export const createCredentialSharePreview = async (id: string, preview: Preview): Promise<void> => {
    await new QueryBuilder(new BindParam({ params: { id, ...preview } }))
        .create({ model: CredentialSharePreview, identifier: 'preview' })
        .set('preview += $params')
        .return('preview')
        .run();
};

export const getCredentialSharePreview = async (id: string): Promise<Preview | null> => {
    const result = await new QueryBuilder(new BindParam({ id }))
        .match({ model: CredentialSharePreview, identifier: 'preview' })
        .where('preview.id = $id')
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
