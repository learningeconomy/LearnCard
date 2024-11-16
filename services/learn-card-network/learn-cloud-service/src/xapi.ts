import type { UnsignedVP } from '@learncard/types';

import type { Statement } from '@xapi/xapi';
import jwtDecode from 'jwt-decode';
import Fastify, { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';

import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { areDidsEqual } from '@helpers/did.helpers';

const endpoint = process.env.XAPI_ENDPOINT;
const xapiUsername = process.env.XAPI_USERNAME;
const xapiPassword = process.env.XAPI_PASSWORD;

export type DidAuthVP = {
    iss: string;
    vp: UnsignedVP;
    nonce?: string;
};

export const app = Fastify();

app.register(fastifyCors);

export const xapiFastifyPlugin: FastifyPluginAsync = async fastify => {
    fastify.all<{ Querystring?: { agent?: string; method?: string }; Body?: Statement }>(
        '/xapi/*',
        async (request, reply) => {
            if (!endpoint || endpoint === 'false') return reply.status(500).send();

            const vp = request.headers['x-vp'];

            // TODO: Are there times we don't need a VP?

            if (typeof vp !== 'string') {
                return reply
                    .status(400)
                    .send('You must include a DID-Auth VP JWT in the X-VP Header');
            }

            const learnCard = await getEmptyLearnCard();

            const result = await learnCard.invoke.verifyPresentation(vp, { proofFormat: 'jwt' });

            if (
                result.warnings.length === 0 &&
                result.errors.length === 0 &&
                result.checks.includes('JWS')
            ) {
                const decodedJwt = jwtDecode<DidAuthVP>(vp);

                const did = decodedJwt.vp.holder;

                const targetDid: string | undefined =
                    request.body && 'account' in request.body.actor
                        ? request.body.actor.account?.name
                        : JSON.parse(request.query?.agent ?? '{}')?.account?.name;

                if (!targetDid) return reply.status(400).send();

                const delegateCredential = Array.isArray(decodedJwt.vp.verifiableCredential)
                    ? decodedJwt.vp.verifiableCredential[0]
                    : decodedJwt.vp.verifiableCredential;

                if (delegateCredential) {
                    const delegationVerification = await learnCard.invoke.verifyCredential(
                        delegateCredential
                    );

                    if (
                        delegationVerification.warnings.length > 0 ||
                        delegationVerification.errors.length > 0 ||
                        !delegationVerification.checks.includes('proof')
                    ) {
                        return reply.status(401).send();
                    }

                    const delegateIssuer =
                        typeof delegateCredential.issuer === 'string'
                            ? delegateCredential.issuer
                            : delegateCredential.issuer.id ?? '';

                    if (!(await areDidsEqual(delegateIssuer, targetDid))) {
                        return reply.status(401).send();
                    }

                    const isReadRequest =
                        request.method === 'GET' ||
                        (request.method === 'POST' && request.query?.method === 'GET');

                    if (
                        isReadRequest &&
                        !delegateCredential.permissions?.statementAccess?.includes('read')
                    ) {
                        return reply.status(401).send();
                    } else if (
                        !isReadRequest &&
                        !delegateCredential.permissions?.statementAccess?.includes('write')
                    ) {
                        return reply.status(401).send();
                    }
                } else {
                    if (!(await areDidsEqual(targetDid, did ?? ''))) {
                        return reply.status(401).send();
                    }
                }

                const targetPath = request.url.replace('/xapi', '');
                const targetUrl = new URL(`${endpoint}${targetPath}`);

                const fetchOptions: any = {
                    method: request.method,
                    headers: {
                        ...request.headers,
                        Authorization: `Basic ${btoa(`${xapiUsername}:${xapiPassword}`)}`,
                        host: targetUrl.host,
                    },
                };

                if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
                    fetchOptions.body = JSON.stringify(request.body);
                }

                const response = await fetch(targetUrl, fetchOptions);

                reply.code(response.status);

                for (const [key, value] of response.headers.entries()) {
                    // Don't accidentally include a chunked tranfer encoding
                    if (key === 'transfer-encoding') continue;

                    reply.header(key, value);
                }

                return response.text();
            } else {
                return reply.status(401).send();
            }
        }
    );
};

app.register(xapiFastifyPlugin);

export default app;
