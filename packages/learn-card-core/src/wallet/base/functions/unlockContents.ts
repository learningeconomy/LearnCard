import { passwordToKey } from './passwordToKey';

import { X25519KeyPair } from '@transmute/did-key-x25519';
import { Cipher } from '@transmute/did-key-cipher';

export const unlockContents = async (
  password: string,
  contents: any[]
): Promise<any[]> => {
  const derivedKey = await passwordToKey(password);

  const kp = await X25519KeyPair.generate({
    secureRandom: () => {
      return derivedKey;
    },
  });
  kp.id = kp.controller + kp.id;

  const cipher = new Cipher(X25519KeyPair);
  let decryptedContents = [];
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i];
    const decryptedContent = await cipher.decryptObject({
      jwe: content,
      keyAgreementKey: kp,
    });
    decryptedContents.push(decryptedContent);
  }
  return decryptedContents;
};
