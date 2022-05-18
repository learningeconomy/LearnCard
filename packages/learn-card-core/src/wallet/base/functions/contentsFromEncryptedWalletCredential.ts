import { unlockContents } from './unlockContents';
export const contentsFromEncryptedWalletCredential = async (
  password: string,
  encryptedWalletCredential: any
) => {
  const unlockedContents = await unlockContents(password, [
    encryptedWalletCredential.credentialSubject.encryptedWalletContents,
  ]);
  return unlockedContents[0].contents;
};
