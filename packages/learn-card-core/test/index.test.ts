import { readFile } from 'fs/promises';

import { UnsignedVCValidator, VCValidator, VPValidator } from '@learncard/types';

import { walletFromKey } from '../src';
import { LearnCardWallet } from '../src/types/LearnCard';

let wallets: Record<string, LearnCardWallet> = {};

const getWallet = async (seed = 'a'.repeat(64)) => {
    if (!wallets[seed]) {
        const didkit = readFile(require.resolve('../src/didkit/pkg/didkit_wasm_bg.wasm'));

        const wallet = await walletFromKey(seed, { didkit });
        wallets[seed] = wallet;
    }

    return wallets[seed];
};

describe('LearnCard SDK', () => {
    describe('walletFromKey', () => {
        it('should work', async () => {
            await expect(getWallet()).resolves.toBeDefined();
        });

        it('should not allow an empty string for a seed', async () => {
            await expect(walletFromKey('')).rejects.toThrow();
        });

        it('should only allow hex strings for a seed', async () => {
            await expect(walletFromKey('z'.repeat(64))).rejects.toThrow();
        });

        it('should only allow strings that are 64 characters or less', async () => {
            await expect(walletFromKey('a'.repeat(65))).rejects.toThrow();
        });
    });

    describe('Identity', () => {
        it('should determinstically create a did', async () => {
            const wallet = await getWallet();

            expect(wallet.did()).toEqual(
                'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH'
            );
        });

        it('should determinstically create a keypair', async () => {
            const wallet = await getWallet();

            expect(wallet.keypair()).toEqual({
                kty: 'OKP',
                crv: 'Ed25519',
                x: '5zTqbCtiV95yNV5HKqBaTEh-a0Y8Ap7TBt8vAbVja1g',
                d: 'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo',
            });
        });

        describe('Did Methods Supported', () => {
            [
                'key',
                'tz',
                'ethr',
                'pkh:tz',
                'pkh:tezos',
                'pkh:sol',
                'pkh:solana',
                'pkh:eth',
                'pkh:celo',
                'pkh:poly',
                'pkh:btc',
                'pkh:doge',
                'pkh:eip155',
                'pkh:eip155:1',
                'pkh:eip155:42220',
                'pkh:eip155:137',
                'pkh:bip122',
                'pkh:bip122:000000000019d6689c085ae165831e93',
                'pkh:bip122:1a91e3dace36e2be3bf030a65679fe82',
            ].forEach(method =>
                it(method, async () => {
                    const wallet = await getWallet();

                    expect(() => wallet.did(method)).not.toThrow();
                })
            );
        });

        describe('Keypair Algorithms Supported', () => {
            ['ed25519', 'secp256k1'].forEach(algorithm =>
                it(algorithm, async () => {
                    const wallet = await getWallet();

                    expect(() => wallet.keypair(algorithm)).not.toThrow();
                })
            );
        });
    });

    describe('Credentials', () => {
        it('should be able to issue a credential', async () => {
            const wallet = await getWallet();

            const issuedVc = await wallet.issueCredential(wallet.getTestVc());

            await expect(VCValidator.parseAsync(issuedVc)).resolves.toBeDefined();
        });

        it('should be able to verify a credential', async () => {
            const wallet = await getWallet();

            const issuedVc = await wallet.issueCredential(wallet.getTestVc());
            const verificationResult = await wallet.verifyCredential(issuedVc);

            expect(verificationResult).not.toHaveLength(0);
            expect(verificationResult).toEqual(
                expect.arrayContaining([
                    expect.not.objectContaining({ status: 'Failed' }),
                    expect.objectContaining({ status: 'Success' }),
                ])
            );
        });

        it('should fail an invalid credential', async () => {
            const wallet = await getWallet();
            const otherWallet = await getWallet('b'.repeat(64));

            const issuedVc = await wallet.issueCredential(wallet.getTestVc());
            issuedVc.issuer = otherWallet.did();

            const verificationResult = await wallet.verifyCredential(issuedVc);

            expect(verificationResult).not.toHaveLength(0);
            expect(verificationResult).toEqual(
                expect.arrayContaining([expect.objectContaining({ status: 'Failed' })])
            );
        });

        it('should verify an unexpired credential', async () => {
            const wallet = await getWallet();

            const uvc = wallet.getTestVc();
            uvc.expirationDate = new Date(Date.now() + 3600).toISOString();

            const vc = await wallet.issueCredential(uvc);

            const verificationResult = await wallet.verifyCredential(vc);

            const expirationObject = verificationResult.find(
                result => result.check === 'expiration'
            );

            expect(expirationObject.status).toEqual('Success');
        });

        it('should fail an expired credential', async () => {
            const wallet = await getWallet();

            const uvc = wallet.getTestVc();
            uvc.expirationDate = new Date(Date.now() - 3600).toISOString();

            const vc = await wallet.issueCredential(uvc);

            const verificationResult = await wallet.verifyCredential(vc);

            const expirationObject = verificationResult.find(
                result => result.check === 'expiration'
            );

            expect(expirationObject.status).toEqual('Failed');
        });
    });

    describe('Presentations', () => {
        it('should be able to issue a presentation', async () => {
            const wallet = await getWallet();

            const issuedVc = await wallet.issueCredential(wallet.getTestVc());
            const issuedVp = await wallet.issuePresentation(issuedVc);

            await expect(VPValidator.parseAsync(issuedVp)).resolves.toBeDefined();
        });

        it('should be able to verify a presentation', async () => {
            const wallet = await getWallet();

            const issuedVc = await wallet.issueCredential(wallet.getTestVc());
            const issuedVp = await wallet.issuePresentation(issuedVc);
            const verificationResult = await wallet.verifyPresentation(issuedVp);

            expect(verificationResult.errors).toHaveLength(0);
            expect(verificationResult.checks).not.toHaveLength(0);
        });
    });

    describe('Persistence', () => {
        /* TODO: Need ability to delete credentials before testing persistence! */
    });

    describe('Testing', () => {
        it('should provide a test VC', async () => {
            const wallet = await getWallet();

            const testVc = wallet.getTestVc();

            await expect(UnsignedVCValidator.parseAsync(testVc)).resolves.toBeDefined();
        });
    });

    describe('Ethereum Plugin', () => {
        it('should generate a valid Ethereum address', async () => {
            const wallet = await getWallet();

            // eipDid is something like: "did:pkh:eip155:1:0x8fd379246834eac74B8419FfdA202CF8051F7A03"
            const eipDid: string = wallet._wallet.pluginMethods.getSubjectDid('pkh:eip155');
            const expectedPublicAddress = eipDid.substring(eipDid.lastIndexOf(':') + 1);

            const actualPublicAddress = wallet.getEthereumAddress();

            expect(actualPublicAddress).toEqual(expectedPublicAddress);
        });
        it("should know what network it's on", async () => {
            const wallet = await getWallet();

            const defaultNetwork = 'mainnet';
            expect(wallet.getCurrentNetwork()).toEqual(defaultNetwork);
        });
        it('should be able to change networks', async () => {
            const wallet = await getWallet();

            const defaultNetwork = 'mainnet';
            expect(wallet.getCurrentNetwork()).toEqual(defaultNetwork);

            const newNetwork = 'goerli';
            wallet.changeNetwork(newNetwork);
            expect(wallet.getCurrentNetwork()).toEqual(newNetwork);
        });
        it('should support adding an infura project ID', async () => {
            const wallet = await getWallet();

            // Don't think this can be tested more thoroughly without exposing the provider
            expect(() => wallet.addInfuraProjectId('1234')).not.toThrowError();
        });
        //it('test mocks', async () => {
        // at top of file...
        // // Mocks
        // import { ethers } from 'ethers';
        // jest.m0ck('ethers'); // won't compile event if this is commented out (when it's spelled correctly)

        //    const wallet = await getWallet();

        //   ethers.getDefaultProvider.mockResolvedValue({ getBalance: x => console.log(x) });

        //  wallet.getBalance();
        //  });
    });
});
