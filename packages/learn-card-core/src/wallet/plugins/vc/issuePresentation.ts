import { issuePresentation as ip, keyToVerificationMethod } from 'didkit';
import { VC } from 'learn-card-types';

import { UnlockedWallet } from 'types/wallet';

export const issuePresentation = async (
    wallet: UnlockedWallet<
        any,
        { getSubjectDid: () => string; getSubjectKeypair: () => Record<string, string> },
        any
    >,
    credential: VC
) => {
    const did = wallet.pluginMethods.getSubjectDid();

    if (!did) throw new Error('Cannot create presentation: No holder key found');

    const holder = did;

    const _kp = wallet.pluginMethods.getSubjectKeypair();

    if (!_kp) throw new Error('Cannot issue credential: Could not get subject keypair');

    const kp = JSON.stringify(_kp);
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
