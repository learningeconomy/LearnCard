import { RegistryService, IssuerLookupResult } from '../registry.service';

export class WhitelistAdapter implements RegistryService {
    private trustedIssuers: string[];

    constructor() {
        this.trustedIssuers = (process.env.TRUSTED_ISSUERS_WHITELIST || '').split(',').filter(Boolean);
    }

    async isTrusted(issuer: string): Promise<boolean> {
        return this.trustedIssuers.includes(issuer);
    }

    async getIssuer(issuer: string): Promise<IssuerLookupResult | null> {
        if (await this.isTrusted(issuer)) {
            return {
                matchingIssuers: [
                    {
                        issuer: {
                            federation_entity: {
                                organization_name: 'Whitelisted Issuer',
                                homepage_uri: '',
                                logo_uri: '',
                            },
                        },
                        registry: {
                            type: 'whitelist',
                            name: 'Local Whitelist',
                        },
                    },
                ],
                uncheckedRegistries: [],
            };
        }
        return null;
    }
}
