import Fastify, { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';
import _sodium from 'libsodium-wrappers';
import { base64url } from 'multiformats/bases/base64';
import { base58btc } from 'multiformats/bases/base58';

import { getEmptyLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { getDidDocForProfile, setDidDocForProfile } from '@cache/did-docs';

const encodeKey = (key: Uint8Array) => {
    const bytes = new Uint8Array(key.length + 2);
    bytes[0] = 0xec;
    bytes[1] = 0x01;
    bytes.set(key, 2);
    return base58btc.encode(bytes);
};

// Extract Ed25519 public key bytes from a verification method which may be JWK or Multikey
const extractEd25519FromVerificationMethod = (vm: any): Uint8Array => {
    if (vm?.publicKeyJwk?.x) return base64url.decode(`u${vm.publicKeyJwk.x}`);
    if (vm?.publicKeyMultibase) {
        const decoded = base58btc.decode(vm.publicKeyMultibase);
        return decoded[0] === 0xed && decoded[1] === 0x01 ? decoded.slice(2) : decoded;
    }
    if (vm?.publicKeyBase58) return base58btc.baseDecode(vm.publicKeyBase58);
    throw new Error('Unsupported verification method format: missing public key');
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
                : domainName.replace(/:/g, '%3A');

        const did = learnCard.id.did();
        const didDoc = await learnCard.invoke.resolveDid(did);
        const key = did.split(':')[2];
        const didWeb = `did:web:${domain}`;

        const replacedDoc = JSON.parse(
            JSON.stringify(didDoc).replaceAll(did, didWeb).replaceAll(`#${key}`, '#owner')
        );

        const vm = replacedDoc.verificationMethod[0] as any;
        const ed25519Bytes = extractEd25519FromVerificationMethod(vm);
        const x25519PublicKeyBytes = sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519Bytes);

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

    fastify.get('/test/clear-cache', async (_request, reply) => {
        if (!process.env.IS_OFFLINE) return reply.status(403).send();

        const learnCard = await getEmptyLearnCard();

        await learnCard.invoke.clearDidWebCache();

        return reply.status(200).send();
    });
};

app.register(didFastifyPlugin);

export default app;
