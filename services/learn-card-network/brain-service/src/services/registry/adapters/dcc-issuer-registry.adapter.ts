import { RegistryClient } from '@digitalcredentials/issuer-registry-client';
import { RegistryService, IssuerLookupResult } from '../registry.service';

export class DccIssuerRegistryAdapter implements RegistryService {
    private registryClient: RegistryClient;
    private isInitialized = false;

    constructor() {
        this.registryClient = new RegistryClient();
    }

    private async initialize() {
        if (this.isInitialized) return;

        const knownRegistriesUrl = process.env.DCC_KNOWN_REGISTRIES_URL || 'https://registries.learncard.com/known-did-registries.json';

        try {
            const response = await fetch(knownRegistriesUrl);
            const knownRegistries = await response.json();
            await this.registryClient.use({ registries: knownRegistries });
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize DCC Issuer Registry Client:', error);
            throw new Error('Could not initialize DCC Issuer Registry Client.');
        }
    }

    async isTrusted(issuer: string): Promise<boolean> {
        const result = await this.getIssuer(issuer);
        return result ? result.matchingIssuers.length > 0 : false;
    }

    async getIssuer(issuer: string): Promise<IssuerLookupResult | null> {
        await this.initialize();
        try {
            const results = await this.registryClient.lookupIssuersFor(issuer);
            return results as IssuerLookupResult;
        } catch (error) {
            console.error(`Error looking up issuer ${issuer}:`, error);
            return null;
        }
    }
}
