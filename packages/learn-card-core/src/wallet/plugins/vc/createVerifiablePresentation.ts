import vc from '@digitalbazaar/vc';

import { PresentCredentials } from './types';

const createVerifiablePresentation = ({
  verifiableCredential,
  options,
}: PresentCredentials) => {
  const presentation = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    holder: options.holder,
    verifiableCredential,
  };

  return vc.signPresentation({
    presentation,
    suite: options.suite,
    challenge: options.challenge,
    domain: options.domain,
    documentLoader: options.documentLoader,
  });
};

export { createVerifiablePresentation };
