import Fastify, { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';
import _sodium from 'libsodium-wrappers';
import { base64url } from 'multiformats/bases/base64';
import { base58btc } from 'multiformats/bases/base58';

import { getLearnCard } from '@helpers/learnCard.helpers';
import { getDidDocForProfile, setDidDocForProfile } from '@cache/did-docs';

const encodeKey = (key: Uint8Array) => {
    const bytes = new Uint8Array(key.length + 2);
    bytes[0] = 0xec;
    bytes[1] = 0x01;
    bytes.set(key, 2);
    return base58btc.encode(bytes);
};

export const app = Fastify();

app.register(fastifyCors);

export const didFastifyPlugin: FastifyPluginAsync = async fastify => {
    fastify.options('/.well-known/did.json', async (_request, reply) => {
        reply.status(200);
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        reply.header('Access-Control-Allow-Headers', '*');
        return reply.send();
    });

    fastify.get('/.well-known/did.json', async (request, reply) => {
        const cachedResult = await getDidDocForProfile('::root::');

        if (cachedResult) return reply.send(cachedResult);

        await _sodium.ready;
        const sodium = _sodium;

        const learnCard = await getLearnCard();

        const domainName: string = request.hostname || (request as any).requestContext.domainName;
        const domain =
            !domainName || process.env.IS_OFFLINE
                ? `localhost%3A${process.env.PORT || 3000}`
                : domainName.replace(':', '%3A');

        const did = learnCard.id.did();
        const didDoc = await learnCard.invoke.resolveDid(did);
        const key = did.split(':')[2];
        const didWeb = `did:web:${domain}`;

        const replacedDoc = JSON.parse(
            JSON.stringify(didDoc).replaceAll(did, didWeb).replaceAll(`#${key}`, '#owner')
        );

        const jwk = replacedDoc.verificationMethod[0].publicKeyJwk;

        const decodedJwk = base64url.decode(`u${jwk.x}`);
        const x25519PublicKeyBytes = sodium.crypto_sign_ed25519_pk_to_curve25519(decodedJwk);

        const finalDoc = {
            ...replacedDoc,
            keyAgreement: [
                {
                    id: `${didWeb}#${encodeKey(x25519PublicKeyBytes)}`,
                    type: 'X25519KeyAgreementKey2019',
                    controller: didWeb,
                    publicKeyBase58: base58btc.encode(x25519PublicKeyBytes).slice(1),
                },
            ],
        };

        setDidDocForProfile('::root::', finalDoc);

        return reply.send(finalDoc);
    });
};

app.register(didFastifyPlugin);

export default app;
