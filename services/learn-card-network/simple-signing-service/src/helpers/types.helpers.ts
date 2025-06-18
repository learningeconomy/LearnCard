import type Express from 'express';
import type { UnsignedVC, VC, UnsignedVP, VP, JWE } from '@learncard/types';

export type TypedRequest<
    Body extends Record<string, any> = {},
    Query extends Record<string, any> = {},
    Params extends Record<string, any> = {}
> = {
    body: Body;
    query: Query;
    params: Params;
} & Express.Request

export const isEncrypted = (item: UnsignedVC | VC | UnsignedVP | VP | JWE): item is JWE =>
    'ciphertext' in item;
