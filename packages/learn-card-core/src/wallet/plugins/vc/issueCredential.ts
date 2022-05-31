import { issueCredential as ic, keyToVerificationMethod } from 'didkit';

import { UnlockedWallet } from 'types/wallet';
import { UnsignedVC } from './types';

export const issueCredential = async (
    wallet: UnlockedWallet<any, { getSubjectKeypair: () => Record<string, string> }, any>,
    credential: UnsignedVC
) => {
    const _kp = wallet.pluginMethods.getSubjectKeypair();

    if (!_kp) throw new Error('Cannot issue credential: Could not get subject keypair');

    const kp = JSON.stringify(_kp);

    const options = JSON.stringify({
        verificationMethod: await keyToVerificationMethod('key', kp),
        proofPurpose: 'assertionMethod',
    });

    return JSON.parse(await ic(JSON.stringify(credential), options, kp));
};
