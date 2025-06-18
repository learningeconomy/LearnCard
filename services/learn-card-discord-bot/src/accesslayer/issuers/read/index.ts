import { PREFIX } from '../create/index';
import type { Context, IssuerConfig } from 'src/types/index';

export const getIssuerConfigs = async (
    context: Context,
    scope?: string
): Promise<IssuerConfig[]> => {
    const issuerConfigKeys = await context.cache.keys(`${PREFIX}${scope ? scope + ':' : ''}*`);
    if (!issuerConfigKeys) return [];
    const issuers = await Promise.all(
        issuerConfigKeys.map(async key => {
            const value = await context.cache.get(key);
            return JSON.parse(value);
        })
    );
    return issuers;
};

export const getIssuerConfigById = async (
    id: string,
    context: Context,
    scope?: string
): Promise<IssuerConfig> => {
    const issuerJSON = await context.cache.get(`${PREFIX}${scope || 'default'}:${id}`);
    return issuerJSON && JSON.parse(issuerJSON);
};
