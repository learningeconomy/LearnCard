import { passwordToKey } from './passwordToKey';

import { X25519KeyPair } from '@transmute/did-key-x25519';
import { Cipher } from '@transmute/did-key-cipher';

export const lockContents = async (password: string, contents: any[]): Promise<any[]> => {
    const derivedKey = await passwordToKey(password);

    const kp = await X25519KeyPair.generate({
        secureRandom: () => {
            return derivedKey;
        },
    });
    kp.id = kp.controller + kp.id;
    const recipient = {
        header: {
            kid: kp.id,
            alg: 'ECDH-ES+A256KW',
        },
    };
    const recipients = [recipient];

    const keyResolver = ({ id }: any) => {
        if (kp.id === id) {
            return (kp as any).toJsonWebKeyPair(false);
        }
        throw new Error(`Key ${id} not found`);
    };

    const cipher = new Cipher(X25519KeyPair);

    const encryptedContents = await Promise.all(
        contents.map(async content => {
            // spreading to avoid mutation of function args.
            const jwe = await cipher.encryptObject({
                obj: { ...content },
                recipients: [...recipients],
                keyResolver,
            });
            return jwe;
        })
    );

    return encryptedContents;
};
