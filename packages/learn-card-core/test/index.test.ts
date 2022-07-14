import { walletFromKey } from '../src';

const getWallet = async () => walletFromKey('a'.repeat(64));

describe('walletFromKey', () => {
    it('should work', async () => {
        await expect(getWallet()).resolves.toBeDefined();
    });

    it('should determinstically create a did', async () => {
        const wallet = await getWallet();

        expect(wallet.did).toEqual('did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzii7Uh4aHoqH');
    });

    it('should determinstically create a keypair', async () => {
        const wallet = await getWallet();

        expect(wallet.keypair).toEqual({
            kty: 'OKP',
            crv: 'Ed25519',
            x: '5zTqbCtiV95yNV5HKqBaTEh-a0Y8Ap7TBt8vAbVja1g',
            d: 'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo',
        });
    });
});
