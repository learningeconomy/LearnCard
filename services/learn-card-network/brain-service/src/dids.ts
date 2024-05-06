import express from 'express';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import _sodium from 'libsodium-wrappers';
import { base64url } from 'multiformats/bases/base64';
import { base58btc } from 'multiformats/bases/base58';

import { getEmptyLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { TypedRequest } from '@helpers/types.helpers';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getSigningAuthoritiesForUser } from '@accesslayer/signing-authority/relationships/read';
import { getDidDocForProfile, setDidDocForProfile } from '@cache/did-docs';
import Profile from './models/Profile';
import { JWK } from '@learncard/types';

const encodeKey = (key: Uint8Array) => {
    const bytes = new Uint8Array(key.length + 2);
    bytes[0] = 0xec;
    bytes[1] = 0x01;
    bytes.set(key, 2);
    return base58btc.encode(bytes);
};

export const app = express();

app.use(cors());

app.options(
    '/users/:profileId/did.json',
    async (_: TypedRequest<{}, {}, { profileId: string }>, res) => {
        res.sendStatus(200);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
    }
);

app.get(
    '/users/:profileId/did.json',
    async (req: TypedRequest<{}, {}, { profileId: string }>, res) => {
        const { profileId } = req.params;

        const cachedResult = await getDidDocForProfile(profileId);

        if (cachedResult) return res.json(cachedResult);

        await _sodium.ready;
        const sodium = _sodium;

        const learnCard = await getEmptyLearnCard();

        const profile = await getProfileByProfileId(profileId);

        if (!profile) return res.sendStatus(404);

        const domainName: string = (req as any).requestContext.domainName;
        const domain =
            !domainName || process.env.IS_OFFLINE
                ? `localhost%3A${process.env.PORT || 3000}`
                : domainName;

        const didDoc = await learnCard.invoke.resolveDid(profile.did);
        const key = profile.did.split(':')[2];
        const did = getDidWeb(domain, profile.profileId);

        const replacedDoc = JSON.parse(
            JSON.stringify(didDoc).replaceAll(profile.did, did).replaceAll(`#${key}`, '#owner')
        );

        const jwk = replacedDoc.verificationMethod[0].publicKeyJwk;

        const decodedJwk = base64url.decode(`u${jwk.x}`);
        const x25519PublicKeyBytes = sodium.crypto_sign_ed25519_pk_to_curve25519(decodedJwk);

        let saDocs: Record<string, any>[] = [];
        try {
            console.log('SIgning authorities get');
            const signingAuthorities = (await getSigningAuthoritiesForUser(profile)).filter(
                sa => !sa.relationship.did.includes('did:web')
            );
            console.log('SIgning authorities', signingAuthorities);
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

                        const _jwk = _replacedDoc.verificationMethod[0].publicKeyJwk;

                        const _decodedJwk = base64url.decode(`u${_jwk.x}`);
                        const _x25519PublicKeyBytes =
                            sodium.crypto_sign_ed25519_pk_to_curve25519(_decodedJwk);

                        _replacedDoc.verificationMethod[0].controller += `#${sa.relationship.name}`;

                        return {
                            ..._replacedDoc,
                            keyAgreement: [
                                {
                                    id: `${did}#${encodeKey(_x25519PublicKeyBytes)}`,
                                    type: 'X25519KeyAgreementKey2019',
                                    controller: _replacedDoc.verificationMethod[0].controller,
                                    publicKeyBase58: base58btc
                                        .encode(_x25519PublicKeyBytes)
                                        .slice(1),
                                },
                            ],
                        };

                        //return _replacedDoc;
                        // TODO: Add keyagreement
                        // const _didDoc = await learnCard.invoke.resolveDid(sa.relationship.did);
                        // const _key = sa.relationship.did.split(':')[2];

                        // const _replacedDoc = JSON.parse(
                        //     JSON.stringify(_didDoc).replaceAll(sa.relationship.did, did).replaceAll(`#${_key}`, `#${sa.relationship.name}`)
                        // );

                        // const _jwk = _replacedDoc.verificationMethod[0].publicKeyJwk;

                        // const _decodedJwk = base64url.decode(`u${_jwk.x}`);
                        // const _x25519PublicKeyBytes = sodium.crypto_sign_ed25519_pk_to_curve25519(_decodedJwk);

                        // return {
                        //     ..._replacedDoc,
                        //     keyAgreement: [
                        //         {
                        //             id: `${did}#${encodeKey(_x25519PublicKeyBytes)}`,
                        //             type: 'X25519KeyAgreementKey2019',
                        //             controller: sa.relationship.did,
                        //             publicKeyBase58: base58btc.encode(_x25519PublicKeyBytes).slice(1),
                        //         },
                        //     ],
                        // };
                    })
                );
            }
        } catch (e) {
            console.error(e);
        }

        let finalDoc = {
            controller: profile.did,
            ...replacedDoc,
            keyAgreement: [
                {
                    id: `${did}#${encodeKey(x25519PublicKeyBytes)}`,
                    type: 'X25519KeyAgreementKey2019',
                    controller: did,
                    publicKeyBase58: base58btc.encode(x25519PublicKeyBytes).slice(1),
                },
            ],
        };

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

        const managedRelationships = await Profile.findRelationships({
            alias: 'managedBy',
            where: { source: { profileId } },
        });

        if (managedRelationships.length > 0) {
            finalDoc.controller = profile.did;

            await Promise.all(
                managedRelationships.map(async managedRelationship => {
                    const { target } = managedRelationship;

                    const targetDid = target.did;

                    const targetDidDoc = await learnCard.invoke.resolveDid(targetDid);
                    const targetJwk = (targetDidDoc.verificationMethod?.[0] as any)
                        .publicKeyJwk as JWK;

                    const _decodedJwk = base64url.decode(`u${targetJwk.x}`);
                    const _x25519PublicKeyBytes =
                        sodium.crypto_sign_ed25519_pk_to_curve25519(_decodedJwk);

                    const id = `${did}#${uuid()}`;

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

        setDidDocForProfile(profileId, finalDoc);

        return res.json(finalDoc);
    }
);

app.options(
    '/.well-known/did.json',
    async (_: TypedRequest<{}, {}, { profileId: string }>, res) => {
        res.sendStatus(200);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
    }
);

app.get('/.well-known/did.json', async (req: TypedRequest<{}, {}, {}>, res) => {
    const cachedResult = await getDidDocForProfile('::root::');

    if (cachedResult) return res.json(cachedResult);

    await _sodium.ready;
    const sodium = _sodium;

    const learnCard = await getLearnCard();

    const domainName: string = (req as any).requestContext.domainName;
    const domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName;

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

    return res.json(finalDoc);
});

export default app;
