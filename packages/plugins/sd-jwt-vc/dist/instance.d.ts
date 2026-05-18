import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import type { IssuerVerifier } from './signer';
export interface CreateInstanceOptions {
    verifier?: IssuerVerifier;
}
export declare const createSdJwtVcInstance: (options?: CreateInstanceOptions) => SDJwtVcInstance;
//# sourceMappingURL=instance.d.ts.map