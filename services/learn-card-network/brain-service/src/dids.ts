import express from 'express';
import cors from 'cors';
import _sodium from 'libsodium-wrappers';
import { base64url } from 'multiformats/bases/base64';
import { base58btc } from 'multiformats/bases/base58';

import { getEmptyLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { TypedRequest } from '@helpers/types.helpers';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getDidDocForProfile, setDidDocForProfile } from '@cache/did-docs';

const encodeKey = (key: Uint8Array) => {
    const bytes = new Uint8Array(key.length + 2);
    bytes[0] = 0xec;
    bytes[1] = 0x01;
    bytes.set(key, 2);
    return base58btc.encode(bytes);
};

export const app = express();

app.use('/', cors());
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

        const finalDoc = {
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

        setDidDocForProfile(profileId, finalDoc);

        return res.json(finalDoc);
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
