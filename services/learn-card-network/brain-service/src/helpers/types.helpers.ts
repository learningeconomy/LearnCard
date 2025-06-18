import type Express from 'express';

export type TypedRequest<
    Body extends Record<string, any> = {},
    Query extends Record<string, any> = {},
    Params extends Record<string, any> = {}
> = {
    body: Body;
    query: Query;
    params: Params;
} & Express.Request
