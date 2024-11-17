import XAPI from '@xapi/xapi';
import jwtDecode from 'jwt-decode';
import Fastify, { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';

import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { areDidsEqual } from '@helpers/did.helpers';
import type { DidAuthVP } from 'types/vp';
import { createBasicAuth, createXapiFetchOptions } from '@helpers/request.helpers';
import { XAPI_ENDPOINT, XAPI_PASSWORD, XAPI_USERNAME } from './constants/xapi';
import type { XAPIRequest } from 'types/xapi';
import { verifyDelegateCredential } from '@helpers/credential.helpers';
import { verifyVoidStatement } from '@helpers/xapi.helpers';

export const xapiFastifyPlugin: FastifyPluginAsync = async fastify => {
    fastify.get('/xapi/extensions/author', async (_request, reply) => {
        return reply
            .status(200)
            .send(
                'The Author extension is the did that ultimately created the statement. ' +
                'This may be the same as the actor, or it may be someone that the actor has delegated with a write credential'
            );
    });

    fastify.all<XAPIRequest>('/xapi/*', async (request, reply) => {
        if (!XAPI_ENDPOINT || XAPI_ENDPOINT === 'false') return reply.status(500).send();

        const vp = request.headers['x-vp'];
        if (typeof vp !== 'string') {
            return reply.status(400).send('You must include a DID-Auth VP JWT in the X-VP Header');
        }

        const learnCard = await getEmptyLearnCard();
        const result = await learnCard.invoke.verifyPresentation(vp, { proofFormat: 'jwt' });

        if (
            result.warnings.length > 0 ||
            result.errors.length > 0 ||
            !result.checks.includes('JWS')
        ) {
            return reply.status(401).send();
        }

        const decodedJwt = jwtDecode<DidAuthVP>(vp);
        const did = decodedJwt.vp.holder;

        const targetDid =
            request.body && 'account' in request.body.actor
                ? request.body.actor.account?.name
                : JSON.parse(request.query?.agent ?? '{}')?.account?.name;

        if (!targetDid) return reply.status(400).send();

        const delegateCredential = Array.isArray(decodedJwt.vp.verifiableCredential)
            ? decodedJwt.vp.verifiableCredential[0]
            : decodedJwt.vp.verifiableCredential;

        const isReadRequest =
            request.method === 'GET' ||
            (request.method === 'POST' && request.query?.method === 'GET');

        if (delegateCredential) {
            if (!(await verifyDelegateCredential(delegateCredential, targetDid, isReadRequest))) {
                return reply.status(401).send();
            }
        } else {
            if (!(await areDidsEqual(targetDid, did ?? ''))) return reply.status(401).send();
        }

        const targetPath = request.url.replace('/xapi', '');
        const targetUrl = new URL(`${XAPI_ENDPOINT}${targetPath}`);
        const auth = createBasicAuth(XAPI_USERNAME!, XAPI_PASSWORD!);

        // Handle void statements
        if (targetPath === '/statements' && request.body?.verb?.id === XAPI.Verbs.VOIDED.id) {
            const statementId = (request.body?.object as any)?.id;

            if (!statementId) return reply.status(400).send();

            if (!(await verifyVoidStatement(targetDid, did ?? '', statementId, auth))) {
                return reply.status(401).send();
            }
        }

        const response = await fetch(targetUrl, createXapiFetchOptions(request, targetUrl, did));

        reply.code(response.status);

        for (const [key, value] of response.headers.entries()) {
            if (key !== 'transfer-encoding') reply.header(key, value);
        }

        return response.text();
    });
};

// App setup
export const app = Fastify();

app.register(fastifyCors);
app.register(xapiFastifyPlugin);

export default app;
