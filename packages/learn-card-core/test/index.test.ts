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

import { getTestStorage, initLearnCard } from '../src';
import { LearnCardFromSeed } from '../src/types/LearnCard';
import { getTestIndex } from '@wallet/plugins/test-index';

let learnCards: Record<
    string,
    {
        learnCard: LearnCardFromSeed['returnValue'];
        persistenceMocks: Partial<LearnCardFromSeed['returnValue']>;
    }
> = {};

const getLearnCard = async (seed = 'a'.repeat(64), mockPersistence = false) => {
    if (!learnCards[seed]) {
        const didkit = readFile(require.resolve('../src/didkit/pkg/didkit_wasm_bg.wasm'));

        const learnCard = await initLearnCard({ seed, didkit });

        learnCards[seed] = { learnCard: learnCard, persistenceMocks: persistenceMocks() as any };
    }

    return {
        ...learnCards[seed].learnCard,
        ...(mockPersistence ? learnCards[seed].persistenceMocks : {}),
    };
};

describe('LearnCard SDK', () => {
    describe('emptyLearnCard', () => {
        it('should work', async () => {
            await expect(initLearnCard()).resolves.toBeDefined();
        });

        it('should allow verifying a credential', async () => {
            const learnCard = await getLearnCard();
            const emptyLearnCard = await initLearnCard();

            const issuedVc = await learnCard.invoke.issueCredential(learnCard.invoke.getTestVc());
            const verificationResult = await emptyLearnCard.invoke.verifyCredential(
                issuedVc,
                {},
                true
            );

            expect(verificationResult).not.toHaveLength(0);
            expect(verificationResult).toEqual(
                expect.arrayContaining([
                    expect.not.objectContaining({ status: 'Failed' }),
                    expect.objectContaining({ status: 'Success' }),
                ])
            );
        });

        it('should allow verifying a presentation', async () => {
            const learnCard = await getLearnCard();
            const emptyLearnCard = await initLearnCard();

            const issuedVp = await learnCard.invoke.issuePresentation(
                await learnCard.invoke.getTestVp()
            );
            const verificationResult = await emptyLearnCard.invoke.verifyPresentation(issuedVp);

            expect(verificationResult.errors).toHaveLength(0);
            expect(verificationResult.checks).not.toHaveLength(0);
        });

        it('should only allow a subset of methods', async () => {
            const learnCard = await getLearnCard();
            const emptyLearnCard = await initLearnCard();

            expect(Object.keys(emptyLearnCard.invoke).length).toBeLessThan(
                Object.keys(learnCard.invoke).length
            );
        });
    });

    describe('learnCardFromKey', () => {
        it('should work', async () => {
            await expect(getLearnCard()).resolves.toBeDefined();
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
            const learnCard = await getLearnCard();

            expect(learnCard.id.did()).toEqual(
                'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH'
            );
        });

        it('should make different dids', async () => {
            const learnCard = await getLearnCard();

            expect(learnCard.id.did()).not.toEqual(learnCard.id.did('pkh:eip155:1'));
        });

        it('should determinstically create a keypair', async () => {
            const learnCard = await getLearnCard();

            expect(learnCard.id.keypair()).toEqual({
                kty: 'OKP',
                crv: 'Ed25519',
                x: '5zTqbCtiV95yNV5HKqBaTEh-a0Y8Ap7TBt8vAbVja1g',
                d: 'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo',
            });
        });

        it('should be able to resolve dids', async () => {
            const learnCard = await getLearnCard();
            const otherLearnCard = await getLearnCard('b'.repeat(64));

            await expect(learnCard.invoke.resolveDid(learnCard.id.did())).resolves.toBeDefined();
            await expect(
                learnCard.invoke.resolveDid(otherLearnCard.id.did())
            ).resolves.toBeDefined();
            await expect(
                learnCard.invoke.resolveDid(learnCard.id.did('pkh:eip155:1'))
            ).resolves.not.toEqual(await learnCard.invoke.resolveDid(learnCard.id.did()));
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
                    const learnCard = await getLearnCard();

                    expect(() => learnCard.id.did(method as any)).not.toThrow();
                })
            );
        });

        describe('Keypair Algorithms Supported', () => {
            ['ed25519', 'secp256k1'].forEach(algorithm =>
                it(algorithm, async () => {
                    const learnCard = await getLearnCard();

                    expect(() => learnCard.id.keypair(algorithm as any)).not.toThrow();
                })
            );
        });
    });

    describe('Credentials', () => {
        it('should be able to issue a credential', async () => {
            const learnCard = await getLearnCard();

            const issuedVc = await learnCard.invoke.issueCredential(learnCard.invoke.getTestVc());

            await expect(VCValidator.parseAsync(issuedVc)).resolves.toBeDefined();
        });

        it('should be able to verify a credential', async () => {
            const learnCard = await getLearnCard();

            const issuedVc = await learnCard.invoke.issueCredential(learnCard.invoke.getTestVc());
            const verificationResult = await learnCard.invoke.verifyCredential(issuedVc, {}, true);

            expect(verificationResult).not.toHaveLength(0);
            expect(verificationResult).toEqual(
                expect.arrayContaining([
                    expect.not.objectContaining({ status: 'Failed' }),
                    expect.objectContaining({ status: 'Success' }),
                ])
            );
        });

        it('should fail an invalid credential', async () => {
            const learnCard = await getLearnCard();
            const otherLearnCard = await getLearnCard('b'.repeat(64));

            const issuedVc = await learnCard.invoke.issueCredential(learnCard.invoke.getTestVc());
            issuedVc.issuer = otherLearnCard.id.did();

            const verificationResult = await learnCard.invoke.verifyCredential(issuedVc, {}, true);

            expect(verificationResult).not.toHaveLength(0);
            expect(verificationResult).toEqual(
                expect.arrayContaining([expect.objectContaining({ status: 'Failed' })])
            );
        });

        it('should verify an unexpired credential', async () => {
            const learnCard = await getLearnCard();

            const uvc = learnCard.invoke.getTestVc();
            uvc.expirationDate = new Date(Date.now() + 3600).toISOString();

            const vc = await learnCard.invoke.issueCredential(uvc);

            const verificationResult = await learnCard.invoke.verifyCredential(vc, {}, true);

            const expirationObject = verificationResult.find(
                result => result.check === 'expiration'
            );

            expect(expirationObject?.status).toEqual('Success');
        });

        it('should fail an expired credential', async () => {
            const learnCard = await getLearnCard();

            const uvc = learnCard.invoke.getTestVc();
            uvc.expirationDate = new Date(Date.now() - 3600).toISOString();

            const vc = await learnCard.invoke.issueCredential(uvc);

            const verificationResult = await learnCard.invoke.verifyCredential(vc, {}, true);

            const expirationObject = verificationResult.find(
                result => result.check === 'expiration'
            );

            expect(expirationObject?.status).toEqual('Failed');
        });
    });

    describe('Presentations', () => {
        it('should be able to issue a presentation', async () => {
            const learnCard = await getLearnCard();

            const issuedVp = await learnCard.invoke.issuePresentation(
                await learnCard.invoke.getTestVp()
            );

            await expect(VPValidator.parseAsync(issuedVp)).resolves.toBeDefined();
        });

        it('should be able to verify a presentation', async () => {
            const learnCard = await getLearnCard();

            const issuedVp = await learnCard.invoke.issuePresentation(
                await learnCard.invoke.getTestVp()
            );
            const verificationResult = await learnCard.invoke.verifyPresentation(issuedVp);

            expect(verificationResult.errors).toHaveLength(0);
            expect(verificationResult.checks).not.toHaveLength(0);
        });
    });

    // We are skipping persistence tests because they will slam our Ceramic node if we don't...
    describe.skip('Persistence', () => {
        // Empty out index prior to testing
        beforeEach(async () => {
            const learnCard = await getLearnCard();

            const credentials = await learnCard.index.all.get();

            await Promise.all(
                credentials.map(async credential => {
                    return learnCard.index.IDX.remove(credential.id);
                })
            );
        }, 30000);

        it('should start with an empty index', async () => {
            const learnCard = await getLearnCard();

            const credentials = await learnCard.index.all.get();

            expect(credentials).toHaveLength(0);
        });

        it('should be able to publish a credential', async () => {
            const learnCard = await getLearnCard();

            const uvc = learnCard.invoke.getTestVc();
            const vc = await learnCard.invoke.issueCredential(uvc);
            const uri = await learnCard.store.Ceramic.upload(vc);

            expect(uri).toBeTruthy();
        }, 20000);

        it('should be able to read a published credential', async () => {
            const learnCard = await getLearnCard();

            const uvc = learnCard.invoke.getTestVc();
            const vc = await learnCard.invoke.issueCredential(uvc);
            const uri = await learnCard.store.Ceramic.upload(vc);

            const readVc = await learnCard.read.get(uri);

            expect(readVc).toEqual(vc);
        }, 20000);

        it('should be able to add a credential', async () => {
            const learnCard = await getLearnCard();

            const uvc = learnCard.invoke.getTestVc();
            const vc = await learnCard.invoke.issueCredential(uvc);
            const uri = await learnCard.store.Ceramic.upload(vc);

            await learnCard.index.IDX.add({ uri, id: 'test' });

            const credentials = await learnCard.index.all.get();

            expect(credentials).toHaveLength(1);
            expect(credentials).toEqual(
                expect.arrayContaining([expect.objectContaining({ id: 'test' })])
            );
        }, 20000);

        it('should be able to get a credential', async () => {
            const learnCard = await getLearnCard();

            const uvc = learnCard.invoke.getTestVc();
            const vc = await learnCard.invoke.issueCredential(uvc);
            const uri = await learnCard.store.Ceramic.upload(vc);

            await learnCard.index.IDX.add({ uri, id: 'test' });

            const retrievedObject = await learnCard.index.IDX.get({ id: 'test' });

            const credential = await learnCard.read.get(retrievedObject[0].uri);

            expect(credential).toEqual(vc);
        }, 20000);

        it('should be able to list credential ids', async () => {
            const learnCard = await getLearnCard();

            const addNewCredential = async (vc: VC, id: string) => {
                const uri = await learnCard.store.Ceramic.upload(vc);

                await learnCard.index.IDX.add({ uri, id });
            };

            const uvc = learnCard.invoke.getTestVc();
            const vc = await learnCard.invoke.issueCredential(uvc);

            await Promise.all([
                addNewCredential(vc, 'test'),
                addNewCredential(vc, 'test2'),
                addNewCredential(vc, 'test3'),
            ]);

            const credentialsList = await learnCard.index.all.get();

            expect(credentialsList).toHaveLength(3);
            expect(credentialsList).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ id: 'test' }),
                    expect.objectContaining({ id: 'test2' }),
                    expect.objectContaining({ id: 'test3' }),
                ])
            );
        }, 20000);

        it('should be able to list credentials', async () => {
            const learnCard = await getLearnCard();

            const addNewCredential = async (vc: VC, id: string) => {
                const uri = await learnCard.store.Ceramic.upload(vc);

                await learnCard.index.IDX.add({ id, uri });
            };

            const uvc = learnCard.invoke.getTestVc();
            const vc = await learnCard.invoke.issueCredential(uvc);

            await Promise.all([
                addNewCredential(vc, 'test'),
                addNewCredential(vc, 'test2'),
                addNewCredential(vc, 'test3'),
            ]);

            const credentials = await learnCard.index.IDX.get();

            expect(credentials).toHaveLength(3);
            expect(credentials).toEqual(expect.arrayContaining([vc]));
        }, 20000);

        it('should be able to remove a credential', async () => {
            const learnCard = await getLearnCard();

            const uvc = learnCard.invoke.getTestVc();
            const vc = await learnCard.invoke.issueCredential(uvc);
            const uri = await learnCard.store.Ceramic.upload(vc);

            await learnCard.index.IDX.add({ uri, id: 'test' });

            const credentials = await learnCard.index.IDX.get();

            expect(credentials).toHaveLength(1);
            expect(credentials).toEqual(
                expect.arrayContaining([expect.objectContaining({ id: 'test' })])
            );

            await learnCard.index.IDX.remove('test');

            const emptyCredentials = await learnCard.index.IDX.get();

            expect(emptyCredentials).toHaveLength(0);
        }, 30000);
    });

    describe('Testing', () => {
        it('should provide a test VC', async () => {
            const learnCard = await getLearnCard();

            const testVc = learnCard.invoke.getTestVc();

            await expect(UnsignedVCValidator.parseAsync(testVc)).resolves.toBeDefined();
        });

        it('should provide a test VP', async () => {
            const learnCard = await getLearnCard();

            const testVc = await learnCard.invoke.getTestVp();

            await expect(UnsignedVPValidator.parseAsync(testVc)).resolves.toBeDefined();
        });
    });

    // We are skipping Ceramic persistence tests because they will slam our Ceramic node if we don't...
    describe.skip('Ceramic Plugin', () => {
        it('should be able to upload & get encrypted credential', async () => {
            const learnCard = await getLearnCard();
            const malicious = await getLearnCard('b'.repeat(64));

            const uvc = learnCard.invoke.getTestVc();
            const vc = await learnCard.invoke.issueCredential(uvc);
            const uri = await learnCard.store.Ceramic.uploadEncrypted(vc);

            // Should properly retrieve credential!  ✅
            const credential = await learnCard.read.get(uri);
            expect(credential).toEqual(vc);

            // Should error -  Could not decrypt credential - DID not authorized. ❌
            expect(await malicious.read.get(uri)).toBeUndefined();
        }, 20000);

        it('should be able to upload & get a shared encrypted credential', async () => {
            const learnCard = await getLearnCard();
            const malicious = await getLearnCard('b'.repeat(64));
            const friend = await getLearnCard('c'.repeat(64));

            const uvc = learnCard.invoke.getTestVc();
            const vc = await learnCard.invoke.issueCredential(uvc);
            const uri = await learnCard.store.Ceramic.uploadEncrypted(vc, {
                recipients: [friend.id.did()],
            });

            // Should properly retrieve credential!  ✅
            const credential = await learnCard.read.get(uri);
            expect(credential).toEqual(vc);

            // Should properly retrieve credential!  ✅
            const friendCredential = await friend.read.get(uri);
            expect(friendCredential).toEqual(vc);

            // Should error -  Could not decrypt credential - DID not authorized. ❌
            expect(await malicious.read.get(uri)).toBeUndefined();
        }, 20000);

        it('should be able to upload & get a one-way encrypted credential', async () => {
            const learnCard = await getLearnCard();
            const malicious = await getLearnCard('b'.repeat(64));
            const friend = await getLearnCard('c'.repeat(64));

            const uvc = learnCard.invoke.getTestVc();
            const vc = await learnCard.invoke.issueCredential(uvc);
            const uri = await learnCard.invoke.publishContentToCeramic(vc, {
                encrypt: true,
                controllersCanDecrypt: false,
                recipients: [friend.id.did()],
            });

            // Should properly retrieve credential!  ✅
            const friendCredential = await friend.read.get(uri);
            expect(friendCredential).toEqual(vc);

            // Should error -  Could not decrypt credential - DID not authorized. ❌
            expect(await learnCard.read.get(uri)).toBeUndefined();

            // Should error -  Could not decrypt credential - DID not authorized. ❌
            expect(await malicious.read.get(uri)).toBeUndefined();
        }, 20000);
    });

    describe('Ethereum Plugin', () => {
        it('should generate a valid Ethereum address', async () => {
            const learnCard = await getLearnCard();

            // eipDid is something like: "did:pkh:eip155:1:0x8fd379246834eac74B8419FfdA202CF8051F7A03"
            const eipDid = learnCard.id.did('pkh:eip155');
            const expectedPublicAddress = eipDid.substring(eipDid.lastIndexOf(':') + 1);

            const actualPublicAddress = learnCard.invoke.getEthereumAddress();

            expect(actualPublicAddress).toEqual(expectedPublicAddress);
        });
        it("should know what network it's on", async () => {
            const learnCard = await getLearnCard();

            const defaultNetwork = 'mainnet';
            expect(learnCard.invoke.getCurrentNetwork()).toEqual(defaultNetwork);
        });
        it('should be able to change networks', async () => {
            const learnCard = await getLearnCard();

            const defaultNetwork = 'mainnet';
            expect(learnCard.invoke.getCurrentNetwork()).toEqual(defaultNetwork);

            const newNetwork = 'goerli';
            learnCard.invoke.changeNetwork(newNetwork);
            expect(learnCard.invoke.getCurrentNetwork()).toEqual(newNetwork);
        });
        it('should support adding an infura project ID', async () => {
            const learnCard = await getLearnCard();

            // Don't think this can be tested more thoroughly without exposing the provider
            expect(() => learnCard.invoke.addInfuraProjectId('1234')).not.toThrowError();
        });
        //it('test mocks', async () => {
        // at top of file...
        // // Mocks
        // import { ethers } from 'ethers';
        // jest.m0ck('ethers'); // won't compile event if this is commented out (when it's spelled correctly)

        //    const learnCard = await getLearnCard();

        //   ethers.getDefaultProvider.mockResolvedValue({ getBalance: x => console.log(x) });

        //  learnCard.getBalance();
        //  });
    });

    describe('VPQR Plugin', () => {
        it('should generate a base-64 QR code image for a Verifiable Presentation', async () => {
            const learnCard = await getLearnCard();

            const image = await learnCard.invoke.vpToQrCode(
                await learnCard.invoke.issuePresentation(await learnCard.invoke.getTestVp())
            );
            expect(image).toContain('data:image');
        });
        it('should decode a Verifiable Presentation embedded in a QR code', async () => {
            const learnCard = await getLearnCard();

            const qrImageText =
                'VP1-B3ECQDJABQEIRQ5MBDBXBQ6ECDECACWBC5UA6UIU5YZY6FFIVGNU3ZTNM2TIC5WTH3N4HK26LJ2MHJZ2F5ODT35YYPSTQDAIRDBYIEALYDRSXQYLNOBWGKLTPOJTS6Y3SMVSGK3TUNFQWY4ZPGM3TGMIYOKSRQ5AYNAMJVAQ2MMB7J3QZAKKRRIDYSBSXSSTIMJDWG2KPNFFEMWSFKJKFCU2JONEW2TTZMFMFC2KPNRZWSWLKLEYES3BQONEW2SJSJZBUSNS2NVDHGYZSKY4S4LTXJF5DOM3JMIZVG3CWLBUE44LIGZKXG6KGMIWWC3SHMY4DO5DQIVGXUNSQNUYVO5CFGQ3VAVDCO5LWSYKKKRSFMNSOOVXEQZLJMVYVUT2FGRES2MKGJIZTE4CBIRDUO3TZMRBXCQLHDCSBRKQYVCBRSBABLARO2APKEKO4M4PCSUKTG2N4ZWWNJUBO3JT5W6DVNPFU5GDU45C6XBZ565MCF3IB5IRJ3RTR4KKRKM3JXTG2ZVGQF3NGPW3YOVV4WTUYOTTUL24HHX3RQ5MBDBWBRAVBDBYHQJ3ENFSDUZLYMFWXA3DFHJSDEM3EMQ3DQN3BG5SGGNRXHA3TMNBWMYZGKYRZHBSDAGEIDJPT3HE6DCGIEGIEAFMCF3IB5IRJ3RTR4KKRKM3JXTG2ZVGQF3NGPW3YOVV4WTUYOTTUL24HHX3Q';
            const verifiablePresentation = await learnCard.invoke.vpFromQrCode(qrImageText);
            expect(verifiablePresentation).toHaveProperty('@context');
        });
        it('should generate a base-64 QR code image and be able to decode it back into a Verifiable Presentation', done => {
            new Promise(async (resolve, reject) => {
                const learnCard = await getLearnCard();

                const verifiablePresentation = await learnCard.invoke.issuePresentation(
                    await learnCard.invoke.getTestVp()
                );
                const imageString = await learnCard.invoke.vpToQrCode(verifiablePresentation);

                const base64Image = imageString.split(';base64,').pop();
                const buffer = Buffer.from(base64Image ?? '', 'base64');

                const image = await Jimp.read(buffer);

                const qrcode = new (QrCode as any)() as any;
                qrcode.callback = async (err: any, value: any) => {
                    try {
                        const qrImageText = value.result;
                        const decodedVerifiablePresentation = await learnCard.invoke.vpFromQrCode(
                            qrImageText
                        );
                        expect(decodedVerifiablePresentation).toEqual(verifiablePresentation);
                        done();
                    } catch (e) {
                        console.warn('Failed reading QR code!', e);
                        done();
                    }
                };
                qrcode.decode(image.bitmap);
            });
        });
    });

    describe('Control Planes', () => {
        it('should be able to store/read with multiple planes', async () => {
            const learnCard = await getLearnCard();

            const multiPlaneLearnCard = await learnCard.addPlugin(getTestStorage());

            const vc = await multiPlaneLearnCard.invoke.issueCredential(
                multiPlaneLearnCard.invoke.getTestVc()
            );

            const uri = await multiPlaneLearnCard.store['Test Storage'].upload(vc);

            const resolvedVc = await multiPlaneLearnCard.read.get(uri);

            expect(resolvedVc).toEqual(vc);
        });

        it('should dedupe records with same id in different index providers', async () => {
            const signer = await getLearnCard();
            const _learnCard = await initLearnCard();

            const storageLearnCard = await _learnCard.addPlugin(getTestStorage());

            const learnCard = await storageLearnCard.addPlugin(getTestIndex());

            const vc = await signer.invoke.issueCredential(signer.invoke.getTestVc());

            const uri = await learnCard.store['Test Storage'].upload(vc);

            await learnCard.index['Test Storage'].add({ id: 'test', uri });
            await learnCard.index['Test Index'].add({ id: 'test', uri });

            const dedupedRecords = await learnCard.index.all.get();

            expect(dedupedRecords).toHaveLength(1);
        });
    });
});
