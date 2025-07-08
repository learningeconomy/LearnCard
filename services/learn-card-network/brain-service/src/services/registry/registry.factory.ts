import { RegistryService } from './registry.service';
import { WhitelistAdapter } from './adapters/whitelist.adapter';
import { DccIssuerRegistryAdapter } from './adapters/dcc-issuer-registry.adapter';

export const getRegistryService = (): RegistryService => {
    if (process.env.NODE_ENV === 'test' || process.env.TRUSTED_ISSUERS_WHITELIST || process.env.IS_CI) {
        return new WhitelistAdapter();
    }

    return new DccIssuerRegistryAdapter();
};
