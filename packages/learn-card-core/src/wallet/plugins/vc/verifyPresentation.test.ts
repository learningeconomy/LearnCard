import * as fixtures from '@transmute/universal-wallet-test-vectors';

import { Ed25519Signature2018 } from '@transmute/ed25519-signature-2018';
import { plugin } from './index';

const suite = new Ed25519Signature2018();

it('should verifyPresentation', async () => {
  const verification = await plugin.verifyPresentation({
    presentation: fixtures.credentials.ldp_vp,
    options: {
      challenge: 'nonce-123',
      domain: 'example.com',
      suite,
      documentLoader: fixtures.documentLoader,
    },
  });
  expect(verification.verified).toBe(true);
});
