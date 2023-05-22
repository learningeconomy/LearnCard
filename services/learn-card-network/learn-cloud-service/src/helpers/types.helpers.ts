import Express from 'express';

export interface TypedRequest<
    Body extends Record<string, any> = {},
    Query extends Record<string, any> = {},
    Params extends Record<string, any> = {}
> extends Express.Request {
    body: Body;
    query: Query;
    params: Params;
}
