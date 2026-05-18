import { type JWK } from 'jose';
export type IssuerVerifier = (data: string, sig: string) => Promise<boolean>;
export declare const createJoseVerifier: (publicJwk: JWK, alg: string) => Promise<IssuerVerifier>;
export declare const decodeJoseHeader: (jwt: string) => Record<string, unknown>;
//# sourceMappingURL=signer.d.ts.map