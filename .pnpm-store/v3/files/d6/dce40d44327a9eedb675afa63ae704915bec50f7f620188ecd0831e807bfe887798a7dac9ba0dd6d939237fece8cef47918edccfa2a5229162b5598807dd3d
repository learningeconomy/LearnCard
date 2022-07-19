import type { VerificationMethod } from 'did-resolver';
import { EcdsaSignature } from './util';
export declare function toSignatureObject(signature: string, recoverable?: boolean): EcdsaSignature;
export declare function verifyES256K(data: string, signature: string, authenticators: VerificationMethod[]): VerificationMethod;
export declare function verifyRecoverableES256K(data: string, signature: string, authenticators: VerificationMethod[]): VerificationMethod;
export declare function verifyEd25519(data: string, signature: string, authenticators: VerificationMethod[]): VerificationMethod;
declare type Verifier = (data: string, signature: string, authenticators: VerificationMethod[]) => VerificationMethod;
declare function VerifierAlgorithm(alg: string): Verifier;
declare namespace VerifierAlgorithm {
    var toSignatureObject: typeof import("./VerifierAlgorithm").toSignatureObject;
}
export default VerifierAlgorithm;
//# sourceMappingURL=VerifierAlgorithm.d.ts.map