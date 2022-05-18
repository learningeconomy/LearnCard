import vc from '@digitalbazaar/vc';
import { Ed25519Signature2018 } from '@digitalbazaar/ed25519-signature-2018';
import { Ed25519KeyPair } from '@transmute/did-key-ed25519';

import { IssueCredential } from './types';

const issue = async ({ credential, options }: IssueCredential) => {
  const signedVC = await vc.issue({
    credential,
    ...options,
  });
  return signedVC;
};

const issueUsingWalletSuite = async ({
  credential,
  options,
}: IssueCredential) => {
  const wallet = options?.wallet;
  const contents = JSON.parse(JSON.stringify(wallet.contents));
  const key = contents?.find(
    (c: { name: string }) => c?.name === 'Signing Key'
  );
  if (key) {
    const signingKey = Ed25519KeyPair.from(key);
    const suite = new Ed25519Signature2018({ key: signingKey });
    return wallet.issue({ credential, options: { suite, ...options } });
  }
};

export { issue, issueUsingWalletSuite };
