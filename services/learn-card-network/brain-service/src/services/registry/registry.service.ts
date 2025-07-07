export interface MatchingIssuer {
    issuer: {
        federation_entity: {
            organization_name: string;
            homepage_uri?: string;
            logo_uri?: string;
            location?: string;
        };
        institution_additional_information?: {
            legal_name: string;
        };
        credential_registry_entity?: {
            ctid: string;
            ce_url: string;
        };
        ror_entity?: {
            rorid: string;
            ror_url: string;
        };
    };
    registry: {
        type: string;
        fetchEndpoint?: string;
        name: string;
        url?: string;
    };
}

export interface IssuerLookupResult {
    matchingIssuers: MatchingIssuer[];
    uncheckedRegistries: any[];
}

export interface RegistryService {
    isTrusted(issuer: string): Promise<boolean>;
    getIssuer(issuer: string): Promise<IssuerLookupResult | null>;
}
