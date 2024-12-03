import Fastify, { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';
import { generateJwk } from '@helpers/auth.helpers';

const ISSUER = process.env.SERVER_URL || 'http://localhost:4100';

const openidConfiguration = {
    issuer: ISSUER,
    jwks_uri: `${ISSUER}/oidc/jwks`,
    response_types_supported: ['id_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    grant_types_supported: ['client_credentials'],
    scopes_supported: ['openid', 'lrs:all', 'lrs:read', 'lrs:write'],
    claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'did'],
};

export const oidcFastifyPlugin: FastifyPluginAsync = async fastify => {
    // OIDC discovery endpoints
    fastify.get('/.well-known/openid-configuration', async (_request, reply) => {
        return reply.send(openidConfiguration);
    });

    fastify.get('/oidc/jwks', async (_request, reply) => {
        // For HS256, we don't need to expose the key
        return reply.send({ keys: [generateJwk()] });
    });
};

// App setup
export const app = Fastify();

app.register(fastifyCors);
app.register(oidcFastifyPlugin);

export default app;
