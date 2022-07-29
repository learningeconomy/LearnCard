import { randomUUID } from 'crypto';
import { CredentialTemplate } from 'src/types/index';
import { Context } from 'src/types/index';

export const PREFIX = 'credentialtemplate:';

export const createCredentialTemplate = async (template: CredentialTemplate, context: Context) => {
    if (!template._id) template._id = randomUUID();
    return context.cache.set(`${PREFIX}${template._id}`, JSON.stringify(template));
};
