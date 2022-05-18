import vc from '@digitalbazaar/vc';

import { VerifyPresentation } from './types';

const verifyPresentation = ({ presentation, options }: VerifyPresentation) => {
  return vc.verify({
    presentation,
    ...options,
  });
};

export { verifyPresentation };
