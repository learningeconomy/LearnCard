import Express from 'express';
import { Query } from 'express-serve-static-core';

export interface TypedRequest<T, U extends Query = {}> extends Express.Request {
    body: T;
    query: U;
}
