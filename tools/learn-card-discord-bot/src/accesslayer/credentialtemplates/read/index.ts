import { PREFIX } from '../create/index';
import { Context, CredentialTemplate } from 'src/types/index';

export const getCredentialTemplates = async (context: Context): CredentialTemplate[] => {
    const templateKeys = await context.cache.keys(`${PREFIX}*`);
    if (!templateKeys) return [];
    const templates = await Promise.all(
        templateKeys.map(async key => {
            const value = await context.cache.get(key);
            return JSON.parse(value);
        })
    );
    return templates;
};

export const getCredentialTemplateById = async (
    id: string,
    context: Context
): Promise<CredentialTemplate> => {
    const templateJSON = await context.cache.get(`${PREFIX}${id}`);
    return templateJSON ? JSON.parse(templateJSON) : null;
};
