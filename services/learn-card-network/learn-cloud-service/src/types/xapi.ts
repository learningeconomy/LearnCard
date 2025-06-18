import type { Statement } from '@xapi/xapi';
import type { FastifyRequest } from 'fastify';

export type XAPIRequestQuery = {
    agent?: string;
    method?: string;
}

export type XAPIRequest = {
    Querystring?: XAPIRequestQuery;
    Body?: Statement;
} & FastifyRequest
