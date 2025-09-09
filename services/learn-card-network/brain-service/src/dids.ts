import Fastify, { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';
import _sodium from 'libsodium-wrappers';
import { base64url } from 'multiformats/bases/base64';
import { base58btc } from 'multiformats/bases/base58';

import { getEmptyLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { getDidWeb, getManagedDidWeb } from '@helpers/did.helpers';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getSigningAuthoritiesForUser } from '@accesslayer/signing-authority/relationships/read';
import {
    getDidDocForProfile,
    getDidDocForProfileManager,
    setDidDocForProfile,
    setDidDocForProfileManager,
} from '@cache/did-docs';
import { DidDocument, JWK } from '@learncard/types';
import { getProfilesThatManageAProfile } from '@accesslayer/profile/relationships/read';
import { getProfilesThatAdministrateAProfileManager } from '@accesslayer/profile-manager/relationships/read';
import { getDidMetadataForProfile } from '@accesslayer/did-metadata/relationships/read';
import { mergeWith, omit } from 'lodash';

const encodeKey = (key: Uint8Array) => {
    const bytes = new Uint8Array(key.length + 2);
    bytes[0] = 0xec;
    bytes[1] = 0x01;
    bytes.set(key, 2);
    return base58btc.encode(bytes);
};

// Extract Ed25519 public key bytes and a JWK from a verification method that may
// have either publicKeyJwk (2018) or publicKeyMultibase/Multikey (2020).
const extractEd25519FromVerificationMethod = (vm: any): { bytes: Uint8Array; jwk: JWK } => {
    // Prefer JWK if provided
    const jwk = vm?.publicKeyJwk as JWK | undefined;
    if (jwk?.x) {
        const bytes = base64url.decode(`u${jwk.x}`);
        return { bytes, jwk } as { bytes: Uint8Array; jwk: JWK };
    }

    // Handle Multikey / 2020 suite
    const mb = vm?.publicKeyMultibase as string | undefined;
    if (mb) {
        const decoded = base58btc.decode(mb);
        const bytes = decoded[0] === 0xed && decoded[1] === 0x01 ? decoded.slice(2) : decoded;
        const x = base64url.encode(bytes).slice(1);
        return { bytes, jwk: { kty: 'OKP', crv: 'Ed25519', x } as JWK };
    }

    // Fallback: legacy base58 without multibase prefix
    const b58 = vm?.publicKeyBase58 as string | undefined;
    if (b58) {
        const bytes = base58btc.baseDecode(b58);
        const x = base64url.encode(bytes).slice(1);
        return { bytes, jwk: { kty: 'OKP', crv: 'Ed25519', x } as JWK };
    }

    throw new Error('Unsupported verification method format: missing public key');
};

export const app = Fastify();

app.register(fastifyCors);

export const didFastifyPlugin: FastifyPluginAsync = async fastify => {
    fastify.options('/users/:profileId/did.json', async (_request, reply) => {
        reply.status(200);
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        reply.header('Access-Control-Allow-Headers', '*');
        return reply.send();
    });

    fastify.get('/users/:profileId/did.json', async (request, reply) => {
        const { profileId } = request.params as { profileId: string };

        const cachedResult = await getDidDocForProfile(profileId);

        if (cachedResult) return reply.send(cachedResult);

        await _sodium.ready;
        const sodium = _sodium;

        const learnCard = await getEmptyLearnCard();

        const profile = await getProfileByProfileId(profileId);

        if (!profile) return reply.status(404).send();

        const domainName: string = request.hostname || (request as any).requestContext.domainName;
        const _domain =
            !domainName || process.env.IS_OFFLINE
                ? `localhost%3A${process.env.PORT || 3000}`
                : domainName.replace(/:/g, '%3A');

        const domain = process.env.DOMAIN_NAME || _domain;

        const didDoc = await learnCard.invoke.resolveDid(profile.did);
        const key = profile.did.split(':')[2];
        const did = getDidWeb(domain, profile.profileId);

        const replacedDoc = JSON.parse(
            JSON.stringify(didDoc).replaceAll(profile.did, did).replaceAll(`#${key}`, '#owner')
        );

        let saDocs: Record<string, any>[] = [];
        try {
            console.log('Signing authorities get');
            const signingAuthorities = (await getSigningAuthoritiesForUser(profile)).filter(
                sa => !sa.relationship.did.includes('did:web')
            );
            console.log('Signing authorities', signingAuthorities);
            if (signingAuthorities) {
                saDocs = await Promise.all(
                    signingAuthorities.map(async (sa): Promise<Record<string, any>> => {
                        const _didDoc = await learnCard.invoke.resolveDid(sa.relationship.did);
                        const _key = sa.relationship.did.split(':')[2];

                        const _replacedDoc = JSON.parse(
                            JSON.stringify(_didDoc)
                                .replaceAll(sa.relationship.did, did)
                                .replaceAll(`#${_key}`, `#${sa.relationship.name}`)
                        );

                        _replacedDoc.verificationMethod[0].controller += `#${sa.relationship.name}`;

                        return _replacedDoc;
                    })
                );
            }
        } catch (e) {
            console.error(e);
        }

        let finalDoc = { ...replacedDoc, controller: profile.did };

        // Ensure the primary verification method is 2020 (publicKeyMultibase) only
        try {
            const vm0 = (finalDoc.verificationMethod?.[0] as any) || {};
            const { bytes: ed25519Bytes } = extractEd25519FromVerificationMethod(vm0);

            // Ensure the primary keyAgreement uses 2019 suite with publicKeyBase58
            const x25519PublicKeyBytes = sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519Bytes);
            const primaryKAId = `${did}#${encodeKey(x25519PublicKeyBytes)}`;
            const primaryKA = {
                id: primaryKAId,
                type: 'X25519KeyAgreementKey2019',
                controller: did,
                publicKeyBase58: base58btc.encode(x25519PublicKeyBytes).slice(1),
            } as const;

            const existingKA = ((finalDoc as any).keyAgreement as any[]) || [];
            (finalDoc as any).keyAgreement = [
                primaryKA,
                ...existingKA.filter(ka => ka?.id !== primaryKAId),
            ];
        } catch (e) {
            request.log?.warn({ err: e }, 'Failed to set 2020 VM on did:web document');
        }

        if (saDocs) {
            saDocs.map(sa => {
                (finalDoc.verificationMethod = [
                    ...(finalDoc.verificationMethod || []),
                    ...sa.verificationMethod,
                ]),
                    (finalDoc.authentication = [
                        ...(finalDoc.authentication || []),
                        ...sa.authentication,
                    ]),
                    (finalDoc.assertionMethod = [
                        ...(finalDoc.assertionMethod || []),
                        ...sa.assertionMethod,
                    ]),
                    (finalDoc.keyAgreement = [
                        ...(finalDoc.keyAgreement || []),
                        ...(sa.keyAgreement || []),
                    ]);
            });
        }

        try {
            const managers = await getProfilesThatManageAProfile(profileId);

            if (managers.length > 0) {
                await Promise.all(
                    managers.map(async manager => {
                        const targetDid = manager.did;
                        const targetKey = manager.did.split(':')[2];

                        const targetDidDoc = await learnCard.invoke.resolveDid(targetDid);
                        const vm = targetDidDoc.verificationMethod?.[0] as any;
                        const { jwk: targetJwk, bytes: ed25519Bytes } =
                            extractEd25519FromVerificationMethod(vm);

                        const _x25519PublicKeyBytes =
                            sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519Bytes);

                        const id = `${did}#${targetKey}`;

                        finalDoc.verificationMethod.unshift({
                            id,
                            type: 'Ed25519VerificationKey2018',
                            controller: id,
                            publicKeyJwk: targetJwk,
                        });
                        finalDoc.authentication.push(id);
                        finalDoc.assertionMethod.push(id);
                        finalDoc.keyAgreement.push({
                            id: `${did}#${encodeKey(_x25519PublicKeyBytes)}`,
                            type: 'X25519KeyAgreementKey2019',
                            controller: id,
                            publicKeyBase58: base58btc.encode(_x25519PublicKeyBytes).slice(1),
                        });
                    })
                );
            }
        } catch (error) {
            console.error(error);
        }

        const extraMetadata = await getDidMetadataForProfile(profileId);

        extraMetadata.forEach(metadata => {
            finalDoc = mergeWith(finalDoc, omit(metadata, 'id'), (src, dest) => {
                if (Array.isArray(src)) return src.concat(dest);

                return undefined;
            });
        });

        setDidDocForProfile(profileId, finalDoc);

        return reply.send(finalDoc);
    });

    fastify.options('/manager/:id/did.json', async (_request, reply) => {
        reply.status(200);
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        reply.header('Access-Control-Allow-Headers', '*');
        return reply.send();
    });

    fastify.get('/manager/:id/did.json', async (request, reply) => {
        const { id } = request.params as { id: string };

        const cachedResult = await getDidDocForProfileManager(id);

        if (cachedResult) return reply.send(cachedResult);

        await _sodium.ready;
        const sodium = _sodium;

        const learnCard = await getEmptyLearnCard();

        const domainName: string = request.hostname || (request as any).requestContext.domainName;
        const _domain =
            !domainName || process.env.IS_OFFLINE
                ? `localhost%3A${process.env.PORT || 3000}`
                : domainName.replace(/:/g, '%3A');

        const domain = process.env.DOMAIN_NAME || _domain;

        const did = getManagedDidWeb(domain, id);

        let finalDoc: DidDocument = {
            '@context': [
                'https://www.w3.org/ns/did/v1',
                {
                    'Ed25519VerificationKey2018':
                        'https://w3id.org/security#Ed25519VerificationKey2018',
                    'publicKeyJwk': {
                        '@id': 'https://w3id.org/security#publicKeyJwk',
                        '@type': '@json',
                    },
                },
            ],
            id: did,
            controller: did,
            keyAgreement: [],
            verificationMethod: [],
            authentication: [],
            assertionMethod: [],
        };

        const administrators = await getProfilesThatAdministrateAProfileManager(id);

        if (administrators.length > 0) {
            await Promise.all(
                administrators.map(async administrator => {
                    const targetDid = administrator.did;
                    const targetKey = administrator.did.split(':')[2];

                    const targetDidDoc = await learnCard.invoke.resolveDid(targetDid);
                    const vm = targetDidDoc.verificationMethod?.[0] as any;
                    const { jwk: targetJwk, bytes: ed25519Bytes } =
                        extractEd25519FromVerificationMethod(vm);

                    const _x25519PublicKeyBytes =
                        sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519Bytes);

                    const id = `${did}#${targetKey}`;

                    finalDoc.verificationMethod!.unshift({
                        id,
                        type: 'Ed25519VerificationKey2018',
                        controller: id,
                        publicKeyJwk: targetJwk,
                    });
                    finalDoc.authentication!.push(id);
                    finalDoc.assertionMethod!.push(id);
                    finalDoc.keyAgreement!.push({
                        id: `${did}#${encodeKey(_x25519PublicKeyBytes)}`,
                        type: 'X25519KeyAgreementKey2019',
                        controller: id,
                        publicKeyBase58: base58btc.encode(_x25519PublicKeyBytes).slice(1),
                    });
                })
            );
        }

        setDidDocForProfileManager(id, finalDoc);

        return reply.send(finalDoc);
    });

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
        const _domain =
            !domainName || process.env.IS_OFFLINE
                ? `localhost%3A${process.env.PORT || 3000}`
                : domainName.replace(/:/g, '%3A');

        const domain = process.env.DOMAIN_NAME || _domain;

        const did = learnCard.id.did();
        const didDoc = await learnCard.invoke.resolveDid(did);
        const key = did.split(':')[2];
        const didWeb = `did:web:${domain}`;

        const replacedDoc = JSON.parse(
            JSON.stringify(didDoc).replaceAll(did, didWeb).replaceAll(`#${key}`, '#owner')
        );

        const vm = replacedDoc.verificationMethod[0] as any;
        const { bytes: ed25519Bytes } = extractEd25519FromVerificationMethod(vm);
        const x25519PublicKeyBytes = sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519Bytes);

        const finalDoc = {
            ...(replacedDoc as any),
            keyAgreement: [
                {
                    id: `${didWeb}#${encodeKey(x25519PublicKeyBytes)}`,
                    type: 'X25519KeyAgreementKey2019',
                    controller: didWeb,
                    publicKeyBase58: base58btc.encode(x25519PublicKeyBytes).slice(1),
                },
                ...(((replacedDoc as any).keyAgreement as any[]) || []).filter(
                    (ka: any) => ka?.id !== `${didWeb}#${encodeKey(x25519PublicKeyBytes)}`
                ),
            ],
        } as any;

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
