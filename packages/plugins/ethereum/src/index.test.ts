import { describe, expect, it } from 'vitest';
import { Buffer } from 'buffer';
import { ethers } from 'ethers';

import { getEthereumPlugin } from './index';

const d = Buffer.alloc(32, 7).toString('base64');
type InitLearnCard = Parameters<typeof getEthereumPlugin>[0];
type PluginLearnCard = Parameters<
    ReturnType<typeof getEthereumPlugin>['methods']['getEthereumAddress']
>[0];
const learnCard = { id: { keypair: () => ({ d }) } } as unknown as InitLearnCard;

describe('getEthereumPlugin', () => {
    it('derives the same address as an ethers Wallet (the wallet is now built on first use)', () => {
        const plugin = getEthereumPlugin(learnCard, {});
        const expected = new ethers.Wallet(Buffer.from(d, 'base64').toString('hex')).address;
        expect(plugin.methods.getEthereumAddress(learnCard as unknown as PluginLearnCard)).toBe(
            expected
        );
        expect(plugin.methods.getEthereumAddress(learnCard as unknown as PluginLearnCard)).toBe(
            expected
        );
    });
});
