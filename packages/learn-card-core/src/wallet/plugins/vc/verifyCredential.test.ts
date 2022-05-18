import * as fixtures from '@transmute/universal-wallet-test-vectors';

import { Ed25519Signature2018 } from '@transmute/ed25519-signature-2018';
import { plugin } from './index';

const suite = new Ed25519Signature2018();

it('should verifyCredential', async () => {
  const verification = await plugin.verifyCredential({
    credential: fixtures.credentials.ldp_vc,
    options: {
      suite,
      documentLoader: fixtures.documentLoader,
    },
  });
  expect(verification.verified).toBe(true);
});
