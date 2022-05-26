import { issueCredential as ic, keyToVerificationMethod } from 'didkit';

import { UnlockedWallet } from 'types/wallet';
import { UnsignedVC } from './types';

export const issueCredential = async (wallet: UnlockedWallet, credential: UnsignedVC) => {
    const signingKey = wallet.contents?.find((c: { name: string }) => c?.name === 'Signing Key');

    if (!signingKey?.privateKeyJwk) {
        throw new Error('Cannot issue credential: No signing key found');
    }

    const kp = JSON.stringify(signingKey.privateKeyJwk);
    const options = JSON.stringify({
        verificationMethod: await keyToVerificationMethod('key', kp),
        proofPurpose: 'assertionMethod',
    });

    return JSON.parse(await ic(JSON.stringify(credential), options, kp));
};
