export declare type Extensible = Record<string, any>;
export interface DIDResolutionResult {
    '@context'?: 'https://w3id.org/did-resolution/v1' | string | string[];
    didResolutionMetadata: DIDResolutionMetadata;
    didDocument: DIDDocument | null;
    didDocumentMetadata: DIDDocumentMetadata;
}
export interface DIDResolutionOptions extends Extensible {
    accept?: string;
}
export interface DIDResolutionMetadata extends Extensible {
    contentType?: string;
    error?: 'invalidDid' | 'notFound' | 'representationNotSupported' | 'unsupportedDidMethod' | string;
}
export interface DIDDocumentMetadata extends Extensible {
    created?: string;
    updated?: string;
    deactivated?: boolean;
    versionId?: string;
    nextUpdate?: string;
    nextVersionId?: string;
    equivalentId?: string;
    canonicalId?: string;
}
export declare type KeyCapabilitySection = 'authentication' | 'assertionMethod' | 'keyAgreement' | 'capabilityInvocation' | 'capabilityDelegation';
export declare type DIDDocument = {
    '@context'?: 'https://www.w3.org/ns/did/v1' | string | string[];
    id: string;
    alsoKnownAs?: string[];
    controller?: string | string[];
    verificationMethod?: VerificationMethod[];
    service?: ServiceEndpoint[];
    /**
     * @deprecated
     */
    publicKey?: VerificationMethod[];
} & {
    [x in KeyCapabilitySection]?: (string | VerificationMethod)[];
};
export interface ServiceEndpoint {
    id: string;
    type: string;
    serviceEndpoint: string;
    description?: string;
}
/**
 * Encapsulates a JSON web key type that includes only the public properties that
 * can be used in DID documents.
 *
 * The private properties are intentionally omitted to discourage the use
 * (and accidental disclosure) of private keys in DID documents.
 */
export interface JsonWebKey extends Extensible {
    alg?: string;
    crv?: string;
    e?: string;
    ext?: boolean;
    key_ops?: string[];
    kid?: string;
    kty: string;
    n?: string;
    use?: string;
    x?: string;
    y?: string;
}
export interface VerificationMethod {
    id: string;
    type: string;
    controller: string;
    publicKeyBase58?: string;
    publicKeyBase64?: string;
    publicKeyJwk?: JsonWebKey;
    publicKeyHex?: string;
    publicKeyMultibase?: string;
    blockchainAccountId?: string;
    ethereumAddress?: string;
}
export interface Params {
    [index: string]: string;
}
export interface ParsedDID {
    did: string;
    didUrl: string;
    method: string;
    id: string;
    path?: string;
    fragment?: string;
    query?: string;
    params?: Params;
}
export declare type DIDResolver = (did: string, parsed: ParsedDID, resolver: Resolvable, options: DIDResolutionOptions) => Promise<DIDResolutionResult>;
export declare type WrappedResolver = () => Promise<DIDResolutionResult>;
export declare type DIDCache = (parsed: ParsedDID, resolve: WrappedResolver) => Promise<DIDResolutionResult>;
export declare type LegacyDIDResolver = (did: string, parsed: ParsedDID, resolver: Resolvable) => Promise<DIDDocument>;
export declare type ResolverRegistry = Record<string, DIDResolver>;
export interface LegacyResolverRegistry {
    [index: string]: LegacyDIDResolver;
}
export interface ResolverOptions {
    cache?: DIDCache | boolean | undefined;
    legacyResolvers?: LegacyResolverRegistry;
}
export declare function inMemoryCache(): DIDCache;
export declare function noCache(parsed: ParsedDID, resolve: WrappedResolver): Promise<DIDResolutionResult>;
export declare function parse(didUrl: string): ParsedDID | null;
export declare function wrapLegacyResolver(resolve: LegacyDIDResolver): DIDResolver;
export interface Resolvable {
    resolve: (didUrl: string, options?: DIDResolutionOptions) => Promise<DIDResolutionResult>;
}
export declare class Resolver implements Resolvable {
    private registry;
    private cache;
    constructor(registry?: ResolverRegistry, options?: ResolverOptions);
    resolve(didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult>;
}
//# sourceMappingURL=resolver.d.ts.map