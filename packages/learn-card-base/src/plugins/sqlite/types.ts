import { Plugin } from '@learncard/core';
import { JWE, JWKWithPrivateKey } from '@learncard/types';

export type SQLitePluginDependentMethods = {
    createDagJwe: <T>(cleartext: T, recipients?: string[]) => Promise<JWE>;
    decryptDagJwe: <T>(jwe: JWE, jwks?: JWKWithPrivateKey[]) => Promise<T>;
};

export type SQLitePlugin = Plugin<
    'SQLite',
    'read' | 'store' | 'index' | 'cache',
    Record<never, never>,
    'id',
    SQLitePluginDependentMethods
>;
