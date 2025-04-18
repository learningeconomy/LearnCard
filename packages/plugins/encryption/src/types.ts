import { LearnCard, Plugin } from '@learncard/core';
import { JWE, JWKWithPrivateKey } from '@learncard/types';

export type EncryptionPluginMethods = {
    createJwe: (cleartext: string, recipients?: string[]) => Promise<JWE>;
    decryptJwe: (jwe: JWE, jwks?: JWKWithPrivateKey[]) => Promise<string>;
    createDagJwe: <T>(cleartext: T, recipients?: string[]) => Promise<JWE>;
    decryptDagJwe: <T>(jwe: JWE, jwks?: JWKWithPrivateKey[]) => Promise<T>;
};

export type EncryptionPluginDependentMethods = {
    createJwe: (cleartext: string, recipients: string[]) => Promise<JWE>;
    decryptJwe: (jwe: JWE, jwks: JWKWithPrivateKey[]) => Promise<string>;
    createDagJwe: <T>(cleartext: T, recipients: string[]) => Promise<JWE>;
    decryptDagJwe: <T>(jwe: JWE, jwks: JWKWithPrivateKey[]) => Promise<T>;
};

export type EncryptionPluginType = Plugin<
    'Encryption',
    any,
    EncryptionPluginMethods,
    'id',
    EncryptionPluginDependentMethods
>;

export type EncryptionDependentLearnCard = LearnCard<any, 'id', EncryptionPluginDependentMethods>;
