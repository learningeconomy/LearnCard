import type { Statement } from '@xapi/xapi';
import type { FastifyRequest } from 'fastify';

export interface XAPIRequestQuery {
    agent?: string;
    method?: string;
}

export interface XAPIRequest extends FastifyRequest {
    Querystring?: XAPIRequestQuery;
    Body?: Statement;
}
