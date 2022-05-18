import { passwordToKey } from './passwordToKey';
import { lockContents } from './lockContents';

import { X25519KeyPair } from '@transmute/did-key-x25519';

export const exportContentsAsCredential = async (
    password: string,
    contents: any[]
): Promise<any> => {
    const derivedKey = await passwordToKey(password);

    const kp = await X25519KeyPair.generate({
        secureRandom: () => {
            return derivedKey;
        },
    });
    kp.id = kp.controller + kp.id;

    // we don't want to leak number of wallet contents...
    // so we push them into a single object before encrypting.
    const lockedContents = await lockContents(password, [{ contents }]);
    const encryptedWallet = {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'http://w3id.org/wallet/v1'],
        // consider using content id of ciphertext here...
        id: kp.controller + '#encrypted-wallet',
        type: ['VerifiableCredential', 'EncryptedWallet'],
        issuer: kp.controller,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            id: kp.controller,
            encryptedWalletContents: lockedContents[0],
        },
    };
    return encryptedWallet;
};
