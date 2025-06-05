import XAPI from '@xapi/xapi';
import jwtDecode from 'jwt-decode';
import Fastify, { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';

import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { areDidsEqual } from '@helpers/did.helpers';
import type { DidAuthVP } from 'types/vp';
import { createXapiFetchOptions } from '@helpers/request.helpers';
import { XAPI_ENDPOINT } from './constants/xapi';
import type { XAPIRequest } from 'types/xapi';
import { verifyDelegateCredential } from '@helpers/credential.helpers';
import { verifyVoidStatement } from '@helpers/xapi.helpers';
import { generateToken } from '@helpers/auth.helpers';

export const xapiFastifyPlugin: FastifyPluginAsync = async fastify => {
    fastify.all<XAPIRequest>('/xapi/*', async (request, reply) => {
        try {
            if (!XAPI_ENDPOINT || XAPI_ENDPOINT === 'false')
                return reply.status(500).send('xAPI Unavailable.');

            const vp = request.headers['x-vp'];
            if (typeof vp !== 'string') {
                return reply
                    .status(400)
                    .send('You must include a DID-Auth VP JWT in the X-VP Header');
            }

            const learnCard = await getEmptyLearnCard();
            const result = await learnCard.invoke.verifyPresentation(vp, { proofFormat: 'jwt' });

            if (
                result.warnings.length > 0 ||
                result.errors.length > 0 ||
                !result.checks.includes('JWS')
            ) {
                return reply.status(401).send('Invalid JWT in X-VP Header');
            }

            const decodedJwt = jwtDecode<DidAuthVP>(vp);
            let did = decodedJwt.vp.holder;

            if (!did) return reply.status(400).send('No valid holder DID Found in X-VP JWT');

            const targetDid =
                request.body && 'account' in request.body.actor
                    ? request.body.actor.account?.name
                    : JSON.parse(request.query?.agent ?? '{}')?.account?.name;

            if (!targetDid)
                return reply
                    .status(400)
                    .send('No valid target DID found in xAPI request (actor.account.name)');

            const delegateCredential = Array.isArray(decodedJwt.vp.verifiableCredential)
                ? decodedJwt.vp.verifiableCredential[0]
                : decodedJwt.vp.verifiableCredential;

            const isReadRequest =
                request.method === 'GET' ||
                (request.method === 'POST' && request.query?.method === 'GET');

            if (delegateCredential) {
                if (
                    !(await verifyDelegateCredential(delegateCredential, targetDid, isReadRequest))
                ) {
                    return reply.status(401).send('Invalid Delegate Credential');
                }

                const delegateIssuer =
                    typeof delegateCredential.issuer === 'string'
                        ? delegateCredential.issuer
                        : delegateCredential.issuer.id;

                const delegateSubject = Array.isArray(delegateCredential.credentialSubject)
                    ? delegateCredential.credentialSubject[0]?.id
                    : delegateCredential.credentialSubject.id;

                if (!delegateIssuer || !delegateSubject) {
                    return reply
                        .status(401)
                        .send('Delegate Credential missing valid issuer or subject DID.');
                }

                if (
                    !(await areDidsEqual(did, delegateSubject)) &&
                    !(await areDidsEqual(did, delegateIssuer))
                ) {
                    return reply
                        .status(401)
                        .send(
                            'Holder DID in JWT does not match either Delegate Subject or Delegate Issuer'
                        );
                }

                did = delegateSubject;
            } else {
                if (!(await areDidsEqual(targetDid, did ?? '')))
                    return reply.status(401).send('Actor DID does not match JWT DID.');
            }

            const targetPath = request.url.replace('/xapi', '');
            const targetUrl = new URL(`${XAPI_ENDPOINT}${targetPath}`);
            const auth = `Bearer ${await generateToken(did)}`;

            // Handle void statements
            if (targetPath === '/statements' && request.body?.verb?.id === XAPI.Verbs.VOIDED.id) {
                const statementId = (request.body?.object as any)?.id;

                if (!statementId)
                    return reply
                        .status(400)
                        .send('Missing valid statement ID in xAPI Voided Statement.');

                if (!(await verifyVoidStatement(targetDid, did ?? '', statementId, auth))) {
                    return reply.status(401).send('Voided Statement Invalid');
                }
            }

            const response = await fetch(
                targetUrl,
                createXapiFetchOptions(request, targetUrl, auth)
            );

            reply.code(response.status);

            response.headers.forEach((value, key) => {
                if (key !== 'transfer-encoding') reply.header(key, value);
            });

            return await response.text();
        } catch (error) {
            console.error(error);
            return reply.status(500).send('The server could not process that xAPI request.');
        }
    });
};

// App setup
export const app = Fastify();

app.register(fastifyCors);
app.register(xapiFastifyPlugin);

export default app;
