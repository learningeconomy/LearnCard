import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';

import { sha256Hasher } from './hasher';
import { randomSalt } from './salt';
import type { IssuerVerifier } from './signer';

export interface CreateInstanceOptions {
    verifier?: IssuerVerifier;
}

export const createSdJwtVcInstance = (options: CreateInstanceOptions = {}): SDJwtVcInstance => {
    return new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        verifier: options.verifier,
    });
};
