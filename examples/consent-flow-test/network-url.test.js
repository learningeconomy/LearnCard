import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNetworkUrlResolver } from './network-url.js';

test('preserves defaults, local development, and operator-configured endpoints', () => {
    const resolve = createNetworkUrlResolver('https://custom.example/trpc');
    assert.equal(resolve(undefined), true);
    assert.equal(resolve('', 'https://api.learncard.com/trpc'), 'https://api.learncard.com/trpc');
    for (const endpoint of [
        'https://network.learncard.com/trpc',
        'http://localhost:4000/trpc',
        'https://custom.example/trpc',
    ]) {
        assert.equal(resolve(endpoint), endpoint);
    }
});

test('rejects untrusted hosts, ports, paths, credentials, and malformed input', () => {
    const resolve = createNetworkUrlResolver();
    for (const endpoint of [
        'http://169.254.169.254/latest/meta-data',
        'http://localhost:9999/trpc',
        'https://network.learncard.com.evil.example/trpc',
        'https://network.learncard.com@evil.example/trpc',
        'https://network.learncard.com/trpc?redirect=http://localhost',
        'https://network.learncard.com/admin',
        null,
        {},
        ['https://network.learncard.com/trpc'],
    ])
        assert.throws(() => resolve(endpoint), /not trusted/);
});
