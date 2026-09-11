import { environment } from '@environment';
import { RegistryService } from './registry.service';
import { WhitelistAdapter } from './adapters/whitelist.adapter';
import { DccIssuerRegistryAdapter } from './adapters/dcc-issuer-registry.adapter';

export const getRegistryService = (): RegistryService => {
    if (
        environment.NODE_ENV === 'test' ||
        environment.TRUSTED_ISSUERS_WHITELIST ||
        environment.IS_CI
    ) {
        return new WhitelistAdapter();
    }

    return new DccIssuerRegistryAdapter();
};
