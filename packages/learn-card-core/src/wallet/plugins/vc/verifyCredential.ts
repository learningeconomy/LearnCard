import vc from '@digitalbazaar/vc';

import { VerifyCredential } from './types';

const verifyCredential = ({ credential, options }: VerifyCredential) => {
  return vc.verifyCredential({
    credential,
    suite: options.suite,
    documentLoader: options.documentLoader,
  });
};

export { verifyCredential };
