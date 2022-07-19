import type { DIDResolutionResult, Resolvable, VerificationMethod } from 'did-resolver';
import { EcdsaSignature } from './util';
export declare type Signer = (data: string | Uint8Array) => Promise<EcdsaSignature | string>;
export declare type SignerAlgorithm = (payload: string, signer: Signer) => Promise<string>;
export declare type ProofPurposeTypes = 'assertionMethod' | 'authentication' | 'capabilityDelegation' | 'capabilityInvocation';
export interface JWTOptions {
    issuer: string;
    signer: Signer;
    /**
     * @deprecated Please use `header.alg` to specify the JWT algorithm.
     */
    alg?: string;
    expiresIn?: number;
    canonicalize?: boolean;
}
export interface JWTVerifyOptions {
    /** @deprecated Please use `proofPurpose: 'authentication' instead` */
    auth?: boolean;
    audience?: string;
    callbackUrl?: string;
    resolver?: Resolvable;
    skewTime?: number;
    /** See https://www.w3.org/TR/did-spec-registries/#verification-relationships */
    proofPurpose?: ProofPurposeTypes;
}
export interface JWSCreationOptions {
    canonicalize?: boolean;
}
export interface DIDAuthenticator {
    authenticators: VerificationMethod[];
    issuer: string;
    didResolutionResult: DIDResolutionResult;
}
export interface JWTHeader {
    typ: 'JWT';
    alg: string;
    [x: string]: any;
}
export interface JWTPayload {
    iss?: string;
    sub?: string;
    aud?: string | string[];
    iat?: number;
    nbf?: number;
    exp?: number;
    rexp?: number;
    [x: string]: any;
}
export interface JWTDecoded {
    header: JWTHeader;
    payload: JWTPayload;
    signature: string;
    data: string;
}
export interface JWSDecoded {
    header: JWTHeader;
    payload: string;
    signature: string;
    data: string;
}
export interface JWTVerified {
    payload: Partial<JWTPayload>;
    didResolutionResult: DIDResolutionResult;
    issuer: string;
    signer: VerificationMethod;
    jwt: string;
}
export interface PublicKeyTypes {
    [name: string]: string[];
}
export declare const SUPPORTED_PUBLIC_KEY_TYPES: PublicKeyTypes;
export declare const SELF_ISSUED_V2 = "https://self-issued.me/v2";
export declare const SELF_ISSUED_V0_1 = "https://self-issued.me";
export declare const NBF_SKEW = 300;
/**  @module did-jwt/JWT */
/**
 *  Decodes a JWT and returns an object representing the payload
 *
 *  @example
 *  decodeJWT('eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1...')
 *
 *  @param    {String}            jwt                a JSON Web Token to verify
 *  @return   {Object}                               a JS object representing the decoded JWT
 */
export declare function decodeJWT(jwt: string): JWTDecoded;
/**
 *  Creates a signed JWS given a payload, a signer, and an optional header.
 *
 *  @example
 *  const signer = ES256KSigner(process.env.PRIVATE_KEY)
 *  const jws = await createJWS({ my: 'payload' }, signer)
 *
 *  @param    {Object}            payload           payload object
 *  @param    {Signer}            signer            a signer, see `ES256KSigner or `EdDSASigner`
 *  @param    {Object}            header            optional object to specify or customize the JWS header
 *  @param    {Object}            options           can be used to trigger automatic canonicalization of header and
 *                                                    payload properties
 *  @return   {Promise<string>}                     a Promise which resolves to a JWS string or rejects with an error
 */
export declare function createJWS(payload: string | Partial<JWTPayload>, signer: Signer, header?: Partial<JWTHeader>, options?: JWSCreationOptions): Promise<string>;
/**
 *  Creates a signed JWT given an address which becomes the issuer, a signer, and a payload for which the signature is over.
 *
 *  @example
 *  const signer = ES256KSigner(process.env.PRIVATE_KEY)
 *  createJWT({address: '5A8bRWU3F7j3REx3vkJ...', signer}, {key1: 'value', key2: ..., ... }).then(jwt => {
 *      ...
 *  })
 *
 *  @param    {Object}            payload               payload object
 *  @param    {Object}            [options]             an unsigned credential object
 *  @param    {String}            options.issuer        The DID of the issuer (signer) of JWT
 *  @param    {String}            options.alg           [DEPRECATED] The JWT signing algorithm to use. Supports: [ES256K, ES256K-R, Ed25519, EdDSA], Defaults to: ES256K.
 *                                                      Please use `header.alg` to specify the algorithm
 *  @param    {Signer}            options.signer        a `Signer` function, Please see `ES256KSigner` or `EdDSASigner`
 *  @param    {boolean}           options.canonicalize  optional flag to canonicalize header and payload before signing
 *  @param    {Object}            header                optional object to specify or customize the JWT header
 *  @return   {Promise<Object, Error>}                  a promise which resolves with a signed JSON Web Token or rejects with an error
 */
export declare function createJWT(payload: Partial<JWTPayload>, { issuer, signer, alg, expiresIn, canonicalize }: JWTOptions, header?: Partial<JWTHeader>): Promise<string>;
/**
 *  Verifies given JWS. If the JWS is valid, returns the public key that was
 *  used to sign the JWS, or throws an `Error` if none of the `pubKeys` match.
 *
 *  @example
 *  const pubKey = verifyJWS('eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJyZXF1Z....', { publicKeyHex: '0x12341...' })
 *
 *  @param    {String}                          jws         A JWS string to verify
 *  @param    {Array<VerificationMethod> | VerificationMethod}    pubKeys     The public keys used to verify the JWS
 *  @return   {VerificationMethod}                       The public key used to sign the JWS
 */
export declare function verifyJWS(jws: string, pubKeys: VerificationMethod | VerificationMethod[]): VerificationMethod;
/**
 *  Verifies given JWT. If the JWT is valid, the promise returns an object including the JWT, the payload of the JWT,
 *  and the did doc of the issuer of the JWT.
 *
 *  @example
 *  verifyJWT('did:uport:eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJyZXF1Z....', {audience: '5A8bRWU3F7j3REx3vkJ...', callbackUrl: 'https://...'}).then(obj => {
 *      const did = obj.did // DID of signer
 *      const payload = obj.payload
 *      const doc = obj.doc // DID Document of signer
 *      const jwt = obj.jwt
 *      const signerKeyId = obj.signerKeyId // ID of key in DID document that signed JWT
 *      ...
 *  })
 *
 *  @param    {String}            jwt                a JSON Web Token to verify
 *  @param    {Object}            [options]           an unsigned credential object
 *  @param    {Boolean}           options.auth        Require signer to be listed in the authentication section of the DID document (for Authentication purposes)
 *  @param    {String}            options.audience    DID of the recipient of the JWT
 *  @param    {String}            options.callbackUrl callback url in JWT
 *  @return   {Promise<Object, Error>}               a promise which resolves with a response object or rejects with an error
 */
export declare function verifyJWT(jwt: string, options?: JWTVerifyOptions): Promise<JWTVerified>;
/**
 * Resolves relevant public keys or other authenticating material used to verify signature from the DID document of provided DID
 *
 *  @example
 *  resolveAuthenticator(resolver, 'ES256K', 'did:uport:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX').then(obj => {
 *      const payload = obj.payload
 *      const profile = obj.profile
 *      const jwt = obj.jwt
 *      ...
 *  })
 *
 *  @param    {String}            alg                a JWT algorithm
 *  @param    {String}            did                a Decentralized IDentifier (DID) to lookup
 *  @param    {Boolean}           auth               Restrict public keys to ones specifically listed in the 'authentication' section of DID document
 *  @return   {Promise<DIDAuthenticator>}               a promise which resolves with a response object containing an array of authenticators or if non exist rejects with an error
 */
export declare function resolveAuthenticator(resolver: Resolvable, alg: string, issuer: string, proofPurpose?: ProofPurposeTypes): Promise<DIDAuthenticator>;
//# sourceMappingURL=JWT.d.ts.map