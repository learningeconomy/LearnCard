import { describe, expectTypeOf, it } from 'vitest';
import type {
    DidWebNetworkLearnCardFromSeed,
    NetworkLearnCardFromApiKey,
    NetworkLearnCardFromSeed,
} from '../src/types/LearnCard';

describe('actAs is accepted by every network init config', () => {
    it('api key', () => {
        expectTypeOf<NetworkLearnCardFromApiKey['args']>().toMatchTypeOf<{ actAs?: string }>();
    });

    it('seed', () => {
        expectTypeOf<NetworkLearnCardFromSeed['args']>().toMatchTypeOf<{ actAs?: string }>();
    });

    it('seed + didWeb', () => {
        expectTypeOf<DidWebNetworkLearnCardFromSeed['args']>().toMatchTypeOf<{
            actAs?: string;
        }>();
    });
});
