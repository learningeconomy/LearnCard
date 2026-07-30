import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

import { HttpBrainServiceTransport } from '@brain';

type Recorded = { method: string; url: string; auth?: string; body?: unknown };

let app: FastifyInstance;
let baseUrl: string;
const recorded: Recorded[] = [];

describe('HttpBrainServiceTransport (against a mock brain-service)', () => {
    beforeAll(async () => {
        app = Fastify();

        app.get('/api/challenges', async (req, reply) => {
            recorded.push({ method: 'GET', url: req.url, auth: req.headers.authorization });
            return reply.send(['challenge-from-server']);
        });

        app.post('/api/profile/create', async (req, reply) => {
            recorded.push({
                method: 'POST',
                url: req.url,
                auth: req.headers.authorization,
                body: req.body,
            });
            return reply.send('did:web:brain.example:users:p99');
        });

        app.post('/api/ecosystem/:id/members/provisioned', async (req, reply) => {
            recorded.push({
                method: 'POST',
                url: req.url,
                auth: req.headers.authorization,
                body: req.body,
            });
            return reply.send({ granted: true, role: (req.body as { role: string }).role });
        });

        await app.listen({ port: 0, host: '127.0.0.1' });
        const address = app.server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        baseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(async () => {
        await app?.close();
    });

    it('fetches a challenge with the bootstrap bearer', async () => {
        const transport = new HttpBrainServiceTransport({ baseUrl });

        const challenge = await transport.requestChallenge('bootstrap-jwt');

        expect(challenge).toBe('challenge-from-server');
        const call = recorded.find(r => r.url.startsWith('/api/challenges'));
        expect(call?.auth).toBe('Bearer bootstrap-jwt');
    });

    it('creates a profile with the bearer and defaults displayName to profileId', async () => {
        const transport = new HttpBrainServiceTransport({ baseUrl });

        await transport.createProfile('profile-jwt', { profileId: 'p99' });

        const call = recorded.find(r => r.url === '/api/profile/create');
        expect(call?.auth).toBe('Bearer profile-jwt');
        expect(call?.body).toEqual({ profileId: 'p99', displayName: 'p99' });
    });

    it('grants provisioned membership with id in the path and role/profileId in the body', async () => {
        const transport = new HttpBrainServiceTransport({ baseUrl });

        await transport.grantProvisionedMembership('service-jwt', {
            ecosystemId: 'eco_root',
            profileId: 'p99',
            role: 'MEMBER',
        });

        const call = recorded.find(r => r.url === '/api/ecosystem/eco_root/members/provisioned');
        expect(call?.auth).toBe('Bearer service-jwt');
        expect(call?.body).toEqual({ profileId: 'p99', role: 'MEMBER' });
    });

    it('throws on a non-ok response', async () => {
        const transport = new HttpBrainServiceTransport({ baseUrl: 'http://127.0.0.1:1' });

        await expect(transport.requestChallenge('x')).rejects.toThrow();
    });
});

describe('HttpBrainServiceTransport upstream error codes', () => {
    let errApp: FastifyInstance;
    let errBaseUrl: string;

    const trpcError = (code: string, message: string, httpStatus: number) => ({
        error: { message, code: -32603, data: { code, httpStatus } },
    });

    beforeAll(async () => {
        errApp = Fastify();

        errApp.get('/trpc/stale.query', async (_req, reply) =>
            reply
                .status(409)
                .send(trpcError('CONFLICT', 'Install intent status revision is stale.', 409))
        );
        errApp.post('/trpc/stale.mutation', async (_req, reply) =>
            reply
                .status(409)
                .send(trpcError('CONFLICT', 'Install intent status revision is stale.', 409))
        );
        errApp.post('/trpc/forbidden.mutation', async (_req, reply) =>
            reply
                .status(403)
                .send(trpcError('FORBIDDEN', 'Caller lacks the required ecosystem authority.', 403))
        );
        errApp.post('/trpc/uncoded.mutation', async (_req, reply) =>
            reply.status(500).send({ error: { message: 'boom', code: -32603, data: {} } })
        );

        await errApp.listen({ port: 0, host: '127.0.0.1' });
        const address = errApp.server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        errBaseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(async () => {
        await errApp?.close();
    });

    it('preserves CONFLICT from a mutation so a stale revision is not reported as a 500', async () => {
        const transport = new HttpBrainServiceTransport({ baseUrl: errBaseUrl });

        await expect(transport.trpcMutation('bearer', 'stale.mutation', {})).rejects.toMatchObject({
            code: 'CONFLICT',
            message: 'Install intent status revision is stale.',
        });
    });

    it('preserves CONFLICT from a query', async () => {
        const transport = new HttpBrainServiceTransport({ baseUrl: errBaseUrl });

        await expect(transport.trpcQuery('bearer', 'stale.query', {})).rejects.toMatchObject({
            code: 'CONFLICT',
        });
    });

    it('preserves FORBIDDEN so insufficient authority stays distinguishable', async () => {
        const transport = new HttpBrainServiceTransport({ baseUrl: errBaseUrl });

        await expect(
            transport.trpcMutation('bearer', 'forbidden.mutation', {})
        ).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Caller lacks the required ecosystem authority.',
        });
    });

    it('falls back to INTERNAL_SERVER_ERROR when upstream sends no usable code', async () => {
        const transport = new HttpBrainServiceTransport({ baseUrl: errBaseUrl });

        await expect(
            transport.trpcMutation('bearer', 'uncoded.mutation', {})
        ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR', message: 'boom' });
    });
});
