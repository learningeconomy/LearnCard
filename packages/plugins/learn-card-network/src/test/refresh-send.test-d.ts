/**
 * LC-2198 Task 3 — compile-time verification of the `sendBoost` return-shape opt-in
 * and the unified `send` refresh contract, exercised through the REAL plugin type
 * system (`LearnCard<...>['invoke']` composition).
 *
 * The package Vitest config enables typechecking, so `bun run test` checks
 * these assertions with the TypeScript compiler alongside the runtime tests.
 */
import { describe, expectTypeOf, it } from 'vitest';
import type { LearnCard, Plugin } from '@learncard/core';
import type { ManagedCredentialRefreshReceipt } from '@learncard/types';

import type {
    LearnCardNetworkPlugin,
    SendBoostNetworkOptions,
    SendBoostRefreshResult,
} from '../types';

/** Minimal host plugin so the network plugin is composed through the real machinery. */
declare const basePlugin: Plugin<'Minimal'>;

/**
 * The composed wallet type — identical to how `initLearnCard` / `addPlugin` derive
 * `learnCard.invoke` (`GetPluginMethods` → `UnionToIntersection` over the plugins'
 * declared methods).
 */
type NetworkLearnCard = LearnCard<[typeof basePlugin, LearnCardNetworkPlugin]>;
type NetworkInvoke = NetworkLearnCard['invoke'];

describe('learnCard.invoke.sendBoost return-shape opt-in', () => {
    const sendBoost = {} as NetworkInvoke['sendBoost'];

    it('keeps the legacy string result for omitted options', () => {
        expectTypeOf(sendBoost('userb', 'did:web:example:boost:1')).toEqualTypeOf<
            Promise<string>
        >();
    });

    it('keeps the legacy string result for legacy boolean options', () => {
        expectTypeOf(sendBoost('userb', 'did:web:example:boost:1', true)).toEqualTypeOf<
            Promise<string>
        >();
        expectTypeOf(sendBoost('userb', 'did:web:example:boost:1', false)).toEqualTypeOf<
            Promise<string>
        >();
    });

    it('keeps the legacy string result when enableRefresh is absent or false', () => {
        expectTypeOf(
            sendBoost('userb', 'did:web:example:boost:1', {
                encrypt: false,
                skipNotification: true,
            })
        ).toEqualTypeOf<Promise<string>>();
        expectTypeOf(
            sendBoost('userb', 'did:web:example:boost:1', { enableRefresh: false })
        ).toEqualTypeOf<Promise<string>>();
    });

    it('returns the refreshable issuance result for literal enableRefresh: true', () => {
        expectTypeOf(
            sendBoost('userb', 'did:web:example:boost:1', { enableRefresh: true })
        ).toEqualTypeOf<Promise<SendBoostRefreshResult>>();
        expectTypeOf(
            sendBoost('userb', 'did:web:example:boost:1', {
                enableRefresh: true,
                skipNotification: true,
            })
        ).toEqualTypeOf<Promise<SendBoostRefreshResult>>();
    });

    it('preserves the literal opt-in with status purposes and nested template data', () => {
        expectTypeOf(
            sendBoost('userb', 'did:web:example:boost:1', {
                enableRefresh: true,
                statusPurposes: ['revocation'],
                templateData: { grade: 'A' },
            })
        ).toEqualTypeOf<Promise<SendBoostRefreshResult>>();
    });

    it('degrades to the union for a dynamically typed enableRefresh boolean', () => {
        const dynamic: boolean = Math.random() > 0.5;

        expectTypeOf(
            sendBoost('userb', 'did:web:example:boost:1', { enableRefresh: dynamic })
        ).toEqualTypeOf<Promise<string | SendBoostRefreshResult>>();
    });

    it('degrades to the union when options are typed with an optional enableRefresh', () => {
        const options: SendBoostNetworkOptions = { enableRefresh: true };

        expectTypeOf(sendBoost('userb', 'did:web:example:boost:1', options)).toEqualTypeOf<
            Promise<string | SendBoostRefreshResult>
        >();
    });

    it('degrades to the union for boolean-or-object option variables', () => {
        const options = {} as boolean | SendBoostNetworkOptions;

        expectTypeOf(sendBoost('userb', 'did:web:example:boost:1', options)).toEqualTypeOf<
            Promise<string | SendBoostRefreshResult>
        >();
    });

    it('keeps the string result for object options that omit enableRefresh', () => {
        expectTypeOf(
            sendBoost('userb', 'did:web:example:boost:1', { encrypt: true, skipNotification: true })
        ).toEqualTypeOf<Promise<string>>();
    });

    it('returns a metadata-only receipt carrying the publication inputs', () => {
        expectTypeOf<
            SendBoostRefreshResult['refresh']
        >().toEqualTypeOf<ManagedCredentialRefreshReceipt>();

        // Required publication inputs (identity fields are mandatory; the exact
        // credentialStatus descriptor is optional because not every VC carries one).
        expectTypeOf<
            Pick<
                SendBoostRefreshResult['refresh'],
                'refreshId' | 'refreshService' | 'credentialId' | 'issuerDid' | 'holderDid'
            >
        >().toBeObject();
    });
});

describe('learnCard.invoke.send unified refresh contract', () => {
    const send = {} as NetworkInvoke['send'];

    it('accepts refresh: true on boost sends and may resolve with the receipt', async () => {
        const result = await send({
            type: 'boost',
            recipient: 'userb',
            templateUri: 'did:web:example:boost:1',
            refresh: true,
        });

        expectTypeOf(result).toMatchTypeOf<{
            uri: string;
            credentialUri: string;
            activityId: string;
        }>();
        expectTypeOf(result.refresh).toEqualTypeOf<ManagedCredentialRefreshReceipt | undefined>();
    });

    it('keeps the refresh flag optional on the unified send input', () => {
        expectTypeOf<Parameters<NetworkInvoke['send']>[0]['refresh']>().toEqualTypeOf<
            boolean | undefined
        >();
    });
});
