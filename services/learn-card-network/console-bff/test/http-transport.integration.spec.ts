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
