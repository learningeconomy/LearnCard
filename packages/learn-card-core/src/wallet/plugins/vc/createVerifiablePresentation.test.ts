import * as fixtures from '@transmute/universal-wallet-test-vectors';

import { Ed25519KeyPair } from '@transmute/did-key-ed25519';
import { Ed25519Signature2018 } from '@transmute/ed25519-signature-2018';
import { plugin } from './index';

const keypair = {
  ...fixtures.content[1],
  id: 'http://example.com/issuer/123#key-1',
};

it('should createVerifiablePresentation', async () => {
  const key = await Ed25519KeyPair.from(keypair);
  const suite = new Ed25519Signature2018({
    key,
    date: '2020-03-10T04:24:12.164Z',
  });

  const vp = await plugin.createVerifiablePresentation({
    verifiableCredential: [fixtures.credentials.ldp_vc],
    options: {
      challenge: 'nonce-123',
      domain: 'example.com',
      suite,
      documentLoader: fixtures.documentLoader,
    },
  });
  expect(vp).toEqual(fixtures.credentials.ldp_vp);
});
