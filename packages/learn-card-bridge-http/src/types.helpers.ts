import type Express from 'express';
import type { Query } from 'express-serve-static-core';

export type TypedRequest<T, U extends Query = {}> = {
    body: T;
    query: U;
} & Express.Request
