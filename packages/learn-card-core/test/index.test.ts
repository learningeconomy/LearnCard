import { readFile } from 'fs/promises';

import QrCode from 'qrcode-reader';
import Jimp from 'jimp';

import {
    UnsignedVCValidator,
    VC,
    VCValidator,
    UnsignedVPValidator,
    VPValidator,
} from '@learncard/types';

import { persistenceMocks } from './mocks/persistence';

import { initLearnCard } from '../src';
import { LearnCard } from '../src/types/LearnCard';

let wallets: Record<string, { wallet: LearnCard; persistenceMocks: Partial<LearnCard> }> = {};

const getWallet = async (seed = 'a'.repeat(64), mockPersistence = true) => {
    if (!wallets[seed]) {
        const didkit = readFile(require.resolve('../src/didkit/pkg/didkit_wasm_bg.wasm'));

        const wallet = await initLearnCard({ seed, didkit });

        wallets[seed] = { wallet, persistenceMocks: persistenceMocks() };
    }

    return { ...wallets[seed].wallet, ...(mockPersistence ? wallets[seed].persistenceMocks : {}) };
};

describe('LearnCard SDK', () => {
    describe('emptyWallet', () => {
        it('should work', async () => {
            await expect(initLearnCard()).resolves.toBeDefined();
        });

        it('should allow verifying a credential', async () => {
            const wallet = await getWallet();
            const emptyWallet = await initLearnCard();

            const issuedVc = await wallet.issueCredential(wallet.getTestVc());
            const verificationResult = await emptyWallet.verifyCredential(issuedVc);

            expect(verificationResult).not.toHaveLength(0);
            expect(verificationResult).toEqual(
                expect.arrayContaining([
                    expect.not.objectContaining({ status: 'Failed' }),
                    expect.objectContaining({ status: 'Success' }),
                ])
            );
        });

        it('should allow verifying a presentation', async () => {
            const wallet = await getWallet();
            const emptyWallet = await initLearnCard();

            const issuedVp = await wallet.issuePresentation(await wallet.getTestVp());
            const verificationResult = await emptyWallet.verifyPresentation(issuedVp);

            expect(verificationResult.errors).toHaveLength(0);
            expect(verificationResult.checks).not.toHaveLength(0);
        });

        it('should only allow a subset of methods', async () => {
            const emptyWallet = await initLearnCard();
            const { _wallet, ...methods } = emptyWallet;
            const {
                verifyCredential,
                verifyPresentation,
                resolveDid,
                installChapiHandler,
                activateChapiHandler,
                receiveChapiEvent,
                storePresentationViaChapi,
                storeCredentialViaChapiDidAuth,
            } = emptyWallet;

            expect(methods).toEqual({
                verifyCredential,
                verifyPresentation,
                resolveDid,
                installChapiHandler,
                activateChapiHandler,
                receiveChapiEvent,
                storePresentationViaChapi,
                storeCredentialViaChapiDidAuth,
            });
        });
    });

    describe('walletFromKey', () => {
        it('should work', async () => {
            await expect(getWallet()).resolves.toBeDefined();
        });

        it('should not allow an empty string for a seed', async () => {
            await expect(initLearnCard({ seed: '' })).rejects.toThrow();
        });

        it('should only allow hex strings for a seed', async () => {
            await expect(initLearnCard({ seed: 'z'.repeat(64) })).rejects.toThrow();
        });

        it('should only allow strings that are 64 characters or less', async () => {
            await expect(initLearnCard({ seed: 'a'.repeat(65) })).rejects.toThrow();
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

        it('should be able to resolve dids', async () => {
            const wallet = await getWallet();
            const otherWallet = await getWallet('b'.repeat(64));

            await expect(wallet.resolveDid(wallet.did())).resolves.toBeDefined();
            await expect(wallet.resolveDid(otherWallet.did())).resolves.toBeDefined();
            await expect(wallet.resolveDid(wallet.did('pkh:eip155:1'))).resolves.not.toEqual(
                await wallet.resolveDid(wallet.did())
            );
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

                    expect(() => wallet.did(method as any)).not.toThrow();
                })
            );
        });

        describe('Keypair Algorithms Supported', () => {
            ['ed25519', 'secp256k1'].forEach(algorithm =>
                it(algorithm, async () => {
                    const wallet = await getWallet();

                    expect(() => wallet.keypair(algorithm as any)).not.toThrow();
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

            expect(expirationObject?.status).toEqual('Success');
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

            expect(expirationObject?.status).toEqual('Failed');
        });
    });

    describe('Presentations', () => {
        it('should be able to issue a presentation', async () => {
            const wallet = await getWallet();

            const issuedVp = await wallet.issuePresentation(await wallet.getTestVp());

            await expect(VPValidator.parseAsync(issuedVp)).resolves.toBeDefined();
        });

        it('should be able to verify a presentation', async () => {
            const wallet = await getWallet();

            const issuedVp = await wallet.issuePresentation(await wallet.getTestVp());
            const verificationResult = await wallet.verifyPresentation(issuedVp);

            expect(verificationResult.errors).toHaveLength(0);
            expect(verificationResult.checks).not.toHaveLength(0);
        });
    });

    describe('Persistence', () => {
        // Empty out wallet prior to testing
        beforeEach(async () => {
            const wallet = await getWallet();

            const credentials = await wallet.getCredentialsList();

            await Promise.all(
                credentials.map(async credential => {
                    return wallet.removeCredential(credential.title);
                })
            );
        }, 30000);

        it('should start with an empty wallet', async () => {
            const wallet = await getWallet();

            const credentials = await wallet.getCredentialsList();

            expect(credentials).toHaveLength(0);
        });

        it('should be able to publish a credential', async () => {
            const wallet = await getWallet();

            const uvc = wallet.getTestVc();
            const vc = await wallet.issueCredential(uvc);
            const id = await wallet.publishCredential(vc);

            expect(id).toBeTruthy();
        }, 20000);

        it('should be able to read a published credential', async () => {
            const wallet = await getWallet();

            const uvc = wallet.getTestVc();
            const vc = await wallet.issueCredential(uvc);
            const id = await wallet.publishCredential(vc);

            const readVc = await wallet.readFromCeramic(id);

            expect(readVc).toEqual(vc);
        }, 20000);

        it('should be able to add a credential', async () => {
            const wallet = await getWallet();

            const uvc = wallet.getTestVc();
            const vc = await wallet.issueCredential(uvc);
            const id = await wallet.publishCredential(vc);

            await wallet.addCredential({ id, title: 'test' });

            const credentials = await wallet.getCredentialsList();

            expect(credentials).toHaveLength(1);
            expect(credentials).toEqual(
                expect.arrayContaining([expect.objectContaining({ title: 'test' })])
            );
        }, 20000);

        it('should be able to get a credential', async () => {
            const wallet = await getWallet();

            const uvc = wallet.getTestVc();
            const vc = await wallet.issueCredential(uvc);
            const id = await wallet.publishCredential(vc);

            await wallet.addCredential({ id, title: 'test' });

            const credential = await wallet.getCredential('test');

            expect(credential).toEqual(vc);
        }, 20000);

        it('should be able to list credential ids', async () => {
            const addNewCredential = async (vc: VC, title: string) => {
                const id = await wallet.publishCredential(vc);

                await wallet.addCredential({ id, title });
            };

            const wallet = await getWallet();

            const uvc = wallet.getTestVc();
            const vc = await wallet.issueCredential(uvc);

            await Promise.all([
                addNewCredential(vc, 'test'),
                addNewCredential(vc, 'test2'),
                addNewCredential(vc, 'test3'),
            ]);

            const credentialsList = await wallet.getCredentialsList();

            expect(credentialsList).toHaveLength(3);
            expect(credentialsList).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ title: 'test' }),
                    expect.objectContaining({ title: 'test2' }),
                    expect.objectContaining({ title: 'test3' }),
                ])
            );
        }, 20000);

        it('should be able to list credentials', async () => {
            const addNewCredential = async (vc: VC, title: string) => {
                const id = await wallet.publishCredential(vc);

                await wallet.addCredential({ id, title });
            };

            const wallet = await getWallet();

            const uvc = wallet.getTestVc();
            const vc = await wallet.issueCredential(uvc);

            await Promise.all([
                addNewCredential(vc, 'test'),
                addNewCredential(vc, 'test2'),
                addNewCredential(vc, 'test3'),
            ]);

            const credentialsList = await wallet.getCredentials();

            expect(credentialsList).toHaveLength(3);
            expect(credentialsList).toEqual(expect.arrayContaining([vc]));
        }, 20000);

        it('should be able to remove a credential', async () => {
            const wallet = await getWallet();

            const uvc = wallet.getTestVc();
            const vc = await wallet.issueCredential(uvc);
            const id = await wallet.publishCredential(vc);

            await wallet.addCredential({ id, title: 'test' });

            const credentials = await wallet.getCredentialsList();

            expect(credentials).toHaveLength(1);
            expect(credentials).toEqual(
                expect.arrayContaining([expect.objectContaining({ title: 'test' })])
            );

            await wallet.removeCredential('test');

            const emptyCredentials = await wallet.getCredentialsList();

            expect(emptyCredentials).toHaveLength(0);
        }, 30000);
    });

    describe('Testing', () => {
        it('should provide a test VC', async () => {
            const wallet = await getWallet();

            const testVc = wallet.getTestVc();

            await expect(UnsignedVCValidator.parseAsync(testVc)).resolves.toBeDefined();
        });

        it('should provide a test VP', async () => {
            const wallet = await getWallet();

            const testVc = await wallet.getTestVp();

            await expect(UnsignedVPValidator.parseAsync(testVc)).resolves.toBeDefined();
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

    describe('VPQR Plugin', () => {
        it('should generate a base-64 QR code image for a Verifiable Presentation', async () => {
            const wallet = await getWallet();

            const image = await wallet.vpToQrCode(
                await wallet.issuePresentation(await wallet.getTestVp())
            );
            expect(image).toContain('data:image');
        });
        it('should decode a Verifiable Presentation embedded in a QR code', async () => {
            const wallet = await getWallet();

            const qrImageText =
                'VP1-B3ECQDJABQEIRQ5MBDBXBQ6ECDECACWBC5UA6UIU5YZY6FFIVGNU3ZTNM2TIC5WTH3N4HK26LJ2MHJZ2F5ODT35YYPSTQDAIRDBYIEALYDRSXQYLNOBWGKLTPOJTS6Y3SMVSGK3TUNFQWY4ZPGM3TGMIYOKSRQ5AYNAMJVAQ2MMB7J3QZAKKRRIDYSBSXSSTIMJDWG2KPNFFEMWSFKJKFCU2JONEW2TTZMFMFC2KPNRZWSWLKLEYES3BQONEW2SJSJZBUSNS2NVDHGYZSKY4S4LTXJF5DOM3JMIZVG3CWLBUE44LIGZKXG6KGMIWWC3SHMY4DO5DQIVGXUNSQNUYVO5CFGQ3VAVDCO5LWSYKKKRSFMNSOOVXEQZLJMVYVUT2FGRES2MKGJIZTE4CBIRDUO3TZMRBXCQLHDCSBRKQYVCBRSBABLARO2APKEKO4M4PCSUKTG2N4ZWWNJUBO3JT5W6DVNPFU5GDU45C6XBZ565MCF3IB5IRJ3RTR4KKRKM3JXTG2ZVGQF3NGPW3YOVV4WTUYOTTUL24HHX3RQ5MBDBWBRAVBDBYHQJ3ENFSDUZLYMFWXA3DFHJSDEM3EMQ3DQN3BG5SGGNRXHA3TMNBWMYZGKYRZHBSDAGEIDJPT3HE6DCGIEGIEAFMCF3IB5IRJ3RTR4KKRKM3JXTG2ZVGQF3NGPW3YOVV4WTUYOTTUL24HHX3Q';
            const verifiablePresentation = await wallet.vpFromQrCode(qrImageText);
            expect(verifiablePresentation).toHaveProperty('@context');
        });
        it('should generate a base-64 QR code image and be able to decode it back into a Verifiable Presentation', done => {
            new Promise(async (resolve, reject) => {
                const wallet = await getWallet();

                const verifiablePresentation = await wallet.issuePresentation(
                    await wallet.getTestVp()
                );
                const imageString = await wallet.vpToQrCode(verifiablePresentation);

                const base64Image = imageString.split(';base64,').pop();
                const buffer = Buffer.from(base64Image ?? '', 'base64');

                const image = await Jimp.read(buffer);

                const qrcode = new (QrCode as any)() as any;
                qrcode.callback = async (err: any, value: any) => {
                    try {
                        const qrImageText = value.result;
                        const decodedVerifiablePresentation = await wallet.vpFromQrCode(
                            qrImageText
                        );
                        expect(decodedVerifiablePresentation).toEqual(verifiablePresentation);
                        done();
                    } catch (e) {
                        done(e);
                    }
                };
                qrcode.decode(image.bitmap);
            });
        });
    });
});
