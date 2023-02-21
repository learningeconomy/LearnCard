import Express from 'express';
import { UnsignedVC, VC, UnsignedVP, VP, JWE } from '@learncard/types';

export interface TypedRequest<
    Body extends Record<string, any> = {},
    Query extends Record<string, any> = {},
    Params extends Record<string, any> = {}
> extends Express.Request {
    body: Body;
    query: Query;
    params: Params;
}

export const isEncrypted = (item: UnsignedVC | VC | UnsignedVP | VP | JWE): item is JWE =>
    'cipherText' in item;
