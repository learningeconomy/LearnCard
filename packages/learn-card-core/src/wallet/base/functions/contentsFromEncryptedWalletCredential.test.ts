import * as fixtures from '@transmute/universal-wallet-test-vectors';
import { exportContentsAsCredential } from './exportContentsAsCredential';
import { contentsFromEncryptedWalletCredential } from './contentsFromEncryptedWalletCredential';

it('contentsFromEncryptedWalletCredential', async () => {
  const contents = [{ foo: 1 }, { bar: 1 }];
  const encryptedWalletCredential = await exportContentsAsCredential(
    fixtures.password,
    contents
  );
  const recoveredContents: any = await contentsFromEncryptedWalletCredential(
    fixtures.password,
    encryptedWalletCredential
  );
  expect(recoveredContents).toEqual(contents);
});
