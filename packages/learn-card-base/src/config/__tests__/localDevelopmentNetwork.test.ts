import { afterEach, describe, expect, it } from 'vitest';
import {
    configureLocalDevelopmentNetwork,
    getLocalDevelopmentBoostRegistry,
    getLocalDevelopmentNetworkOrigin,
} from '../localDevelopmentNetwork';

const app = 'http://localhost:3000';
const network = 'http://localhost:4000/trpc';

afterEach(() => configureLocalDevelopmentNetwork(false, false, '', ''));

describe('local development network trust', () => {
    it.each([
        [app, network, 'http://localhost:4000'],
        ['http://127.0.0.1:3000', 'http://127.0.0.1:4000/trpc', 'http://127.0.0.1:4000'],
        ['http://[::1]:3000', 'http://[::1]:4000/trpc', 'http://[::1]:4000'],
        [app, 'https://localhost:4443/trpc', 'https://localhost:4443'],
    ])('allows loopback app %s with configured backend %s', (appUrl, backend, origin) => {
        configureLocalDevelopmentNetwork(true, true, appUrl, backend);
        expect(getLocalDevelopmentNetworkOrigin(true, true, appUrl, backend)).toBe(origin);
        const registry = getLocalDevelopmentBoostRegistry(backend)!;
        expect(JSON.parse(decodeURIComponent(registry.split(',')[1]!))).toEqual([
            {
                id: 'Local LearnCard Network',
                url: origin,
                did: `did:web:${encodeURIComponent(new URL(backend).host)}`,
            },
        ]);
    });

    it.each([
        [false, true, app, network],
        [true, false, app, network],
        [true, true, 'https://learncard.app', network],
        [true, true, app, 'https://network.learncard.com/trpc'],
        [true, true, app, 'http://10.0.0.1:4000/trpc'],
        [true, true, app, 'http://localhost.evil.example:4000/trpc'],
        [true, true, 'http://localhost.evil.example:3000', network],
        [true, true, app, 'http://localhost:4000@evil.example/trpc'],
        [true, true, app, 'http://user:pass@localhost:4000/trpc'],
        [true, true, 'http://user:pass@localhost:3000', network],
        [true, true, 'capacitor://localhost', network],
        [true, true, app, 'ftp://localhost:4000/trpc'],
        [true, true, app, 'invalid-url'],
    ])('clears trust for dev=%s enabled=%s app=%s backend=%s', (dev, enabled, appUrl, backend) => {
        configureLocalDevelopmentNetwork(true, true, app, network);
        configureLocalDevelopmentNetwork(dev, enabled, appUrl, backend);
        expect(getLocalDevelopmentNetworkOrigin(dev, enabled, appUrl, backend)).toBeUndefined();
        expect(getLocalDevelopmentBoostRegistry(network)).toBeUndefined();
        expect(getLocalDevelopmentBoostRegistry(backend)).toBeUndefined();
    });

    it('does not extend trust to another port, backend path, or the default network', () => {
        configureLocalDevelopmentNetwork(true, true, app, network);
        expect(getLocalDevelopmentBoostRegistry('http://localhost:5000/trpc')).toBeUndefined();
        expect(
            getLocalDevelopmentBoostRegistry('http://localhost:4000/other/trpc')
        ).toBeUndefined();
        expect(getLocalDevelopmentBoostRegistry(true)).toBeUndefined();
    });
});
