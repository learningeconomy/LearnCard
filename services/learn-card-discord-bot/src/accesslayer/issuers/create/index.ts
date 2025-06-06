import { randomUUID } from 'crypto';
import { IssuerConfig } from 'src/types/index';
import { Context } from 'src/types/index';

export const PREFIX = 'issuer:';

export const createIssuerConfig = async (
    issuerConfig: IssuerConfig,
    context: Context,
    scope?: string
) => {
    if (!issuerConfig._id) issuerConfig._id = randomUUID();
    return context.cache.set(
        `${PREFIX}${scope || 'default'}:${issuerConfig._id}`,
        JSON.stringify(issuerConfig)
    );
};
