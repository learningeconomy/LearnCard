import { issuePresentation as ip, keyToVerificationMethod } from 'didkit';

import { UnlockedWallet } from 'types/wallet';
import { VC } from './types';

export const issuePresentation = async (
    wallet: UnlockedWallet,
    credential: VC,
    _holder?: string
) => {
    const signingKey = wallet.contents?.find((c: { name: string }) => c?.name === 'Signing Key');

    let holder = _holder;

    if (!holder) {
        const did = signingKey?.controller;

        if (!did) throw new Error('Cannot create presentation: No holder key found');

        holder = did;
    }
    if (!signingKey?.privateKeyJwk) {
        throw new Error('Cannot issue credential: No signing key found');
    }

    const kp = JSON.stringify(signingKey.privateKeyJwk);
    const options = JSON.stringify({
        verificationMethod: await keyToVerificationMethod('key', kp),
        proofPurpose: 'assertionMethod',
    });

    const presentation = JSON.stringify({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        holder,
        verifiableCredential: credential,
    });

    return JSON.parse(await ip(presentation, options, kp));
};
