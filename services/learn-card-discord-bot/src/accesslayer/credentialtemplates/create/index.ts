import { randomUUID } from 'crypto';
import type { Context, CredentialTemplate } from 'src/types/index';

export const PREFIX = 'credentialtemplate:';

export const createCredentialTemplate = async (
    template: CredentialTemplate,
    context: Context,
    scope?: string
) => {
    if (!template._id) template._id = randomUUID();
    return context.cache.set(
        `${PREFIX}${scope || 'default'}:${template._id}`,
        JSON.stringify(template)
    );
};
