import * as Factory from 'factory.ts';

import { Wallet, walletFactory, walletDefaults } from './wallet';
import * as fixtures from '@transmute/universal-wallet-test-vectors';

interface TestWallet extends Wallet {}

const testWalletFactory = Factory.Sync.makeFactory<TestWallet>({
    ...walletDefaults,
}).combine(walletFactory);

it('can build test wallet factory', async () => {
    const wallet = testWalletFactory.build();
    expect(wallet.status).toBe('UNLOCKED');
    expect(wallet.contents).toEqual([]);
});

it('can add and remove', async () => {
    const wallet = testWalletFactory.build({
        contents: [...fixtures.content],
    });
    expect(wallet.contents.length).toBe(3);
    const removed = wallet.remove(fixtures.content[1].id);
    expect(removed).toEqual(fixtures.content[1]);
    expect(wallet.contents.length).toBe(2);
});

it('can lock and unlock', async () => {
    const wallet = testWalletFactory.build();
    wallet.add(fixtures.credentials.ldp_vc);
    await wallet.lock('123');
    expect(wallet.contents[0].ciphertext).toBeDefined();
    await wallet.unlock('123');
    expect(wallet.contents).toEqual([fixtures.credentials.ldp_vc]);
});

it('can export and import', async () => {
    const wallet = testWalletFactory.build();
    wallet.add(fixtures.credentials.ldp_vc);
    const vcTemplate = await wallet.export('123');
    expect(vcTemplate.credentialSubject.encryptedWalletContents).toBeDefined();
    // exporting does not mutate wallet state...
    expect(wallet.contents).toEqual([fixtures.credentials.ldp_vc]);
    const newWallet = testWalletFactory.build();
    await newWallet.import(vcTemplate, '123');
    expect(newWallet.contents).toEqual([fixtures.credentials.ldp_vc]);
});
