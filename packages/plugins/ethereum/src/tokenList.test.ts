import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Buffer } from 'buffer';
import { ethers } from 'ethers';

// The token-list chunk, as the browser sees it: the next `failures` imports reject the way a stale
// chunk does after a deploy, then imports succeed with a one-token list.
const chunk = { failures: 0 };

const STALE_CHUNK = 'Failed to fetch dynamically imported module';
const d = Buffer.alloc(32, 7).toString('base64');

/** A fresh plugin module (the token list is cached per module) and a lookup through it. */
const loadPlugin = async () => {
    vi.resetModules();
    vi.doMock('@uniswap/default-token-list/build/uniswap-default.tokenlist.json', () => {
        if (chunk.failures > 0) {
            chunk.failures -= 1;
            throw new TypeError(`${STALE_CHUNK}: https://app.example/assets/tokenlist-abc123.js`);
        }
        return {
            default: {
                tokens: [
                    {
                        chainId: 1,
                        address: '0x0000000000000000000000000000000000000001',
                        name: 'Listed Token',
                        symbol: 'LISTED',
                        decimals: 18,
                    },
                ],
            },
        };
    });
    const { getEthereumPlugin } = await import('./index');
    const learnCard = { id: { keypair: () => ({ d }) } } as never;
    const plugin = getEthereumPlugin(learnCard, {});
    return () => plugin.methods.getBalance(learnCard, 'UNLISTED');
};

/** The rejection's message; vitest wraps a throwing mock factory, so the chunk's error is its cause. */
const failureOf = (call: Promise<unknown>) =>
    call.then(
        () => 'resolved',
        (error: { cause?: unknown }) => String(error?.cause ?? error)
    );

// The lookup searched a loaded list when it fails only because the symbol is not in it.
const SEARCHED_LIST = 'Unable to determine token address for "UNLISTED"';

describe('getEthereumPlugin token list', () => {
    beforeEach(() => {
        chunk.failures = 0;
        // A provider with a fixed network answers getNetwork without a request, which is all the
        // lookup needs before it searches the list.
        vi.spyOn(ethers, 'getDefaultProvider').mockReturnValue(
            new ethers.providers.StaticJsonRpcProvider('http://127.0.0.1:9', {
                chainId: 1,
                name: 'homestead',
            })
        );
    });

    it('retries a failed import once in place', async () => {
        chunk.failures = 1;
        const lookUp = await loadPlugin();

        await expect(lookUp()).rejects.toThrow(SEARCHED_LIST);
    });

    it('does not replay a failed load: the lookup rejects, and the next lookup loads the list', async () => {
        chunk.failures = 2;
        const lookUp = await loadPlugin();

        expect(await failureOf(lookUp())).toMatch(STALE_CHUNK);

        await expect(lookUp()).rejects.toThrow(SEARCHED_LIST);
    });
});
