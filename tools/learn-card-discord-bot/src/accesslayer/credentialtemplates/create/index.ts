import { randomUUID } from 'crypto';
import { CredentialTemplate } from 'src/types/index';
import { Context } from 'src/types/index';

export const PREFIX = 'credentialtemplate-';

export const createCredentialTemplate = async (template: CredentialTemplate, context: Context) => {
    return context.cache.set(`${PREFIX}${randomUUID()}`, JSON.stringify(template));
};
