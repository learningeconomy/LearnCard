import * as fixtures from '@transmute/universal-wallet-test-vectors';
import { exportContentsAsCredential } from './exportContentsAsCredential';

it('exportContentsAsCredential', async () => {
  const contents = [{ foo: 1 }, { bar: 1 }];
  const encryptedWalletCredential = await exportContentsAsCredential(
    fixtures.password,
    contents
  );

  expect(encryptedWalletCredential.type).toEqual([
    'VerifiableCredential',
    'EncryptedWallet',
  ]);
});
