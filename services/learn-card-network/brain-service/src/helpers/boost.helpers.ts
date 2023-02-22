import { constructUri } from './uri.helpers';

export const getBoostUri = (id: string, domain: string): string =>
    constructUri('boost', id, domain);
