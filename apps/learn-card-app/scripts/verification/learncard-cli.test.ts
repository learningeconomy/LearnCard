import { describe, expect, it } from 'bun:test';

import { stackEndpoints } from './constants';
import { cliEnvironment, localizeCliArgs } from './learncard-cli';

const stack = stackEndpoints({
    app: 33001,
    brain: 33002,
    cloud: 33003,
    api: 33004,
    neo4j: 33005,
    mongo: 33006,
    partner: 33007,
});

const otherStack = stackEndpoints({ ...stack.ports, brain: 34002 });

describe('verification CLI service boundaries', () => {
    it('pins each owned stack rather than a fixed local port', () => {
        expect(localizeCliArgs(['init', '--yes'], stack)).toEqual([
            'init',
            '--yes',
            '--network',
            stack.brain,
        ]);
        expect(localizeCliArgs(['init', '--yes'], otherStack)).toEqual([
            'init',
            '--yes',
            '--network',
            otherStack.brain,
        ]);
        expect(localizeCliArgs(['open', '--no-browser'], stack)).toEqual([
            'open',
            '--no-browser',
            '--app-url',
            stack.app,
            '--network',
            stack.brain,
        ]);
    });

    it('does not mistake option values for networkless commands', () => {
        expect(localizeCliArgs(['init', '--name', 'help'], stack)).toContain(stack.brain);
        expect(localizeCliArgs(['send', 'verify'], stack)).toContain(stack.brain);
        expect(() => localizeCliArgs(['--json', 'init'], stack)).toThrow('subcommand before');
    });

    it('accepts only one exact owned endpoint in either option spelling', () => {
        for (const [flag, value] of [
            ['--network', stack.brain],
            ['--app-url', stack.app],
            ['--lca-url', stack.lcaApi],
        ]) {
            expect(() => localizeCliArgs(['open', flag!], stack)).toThrow('requires');
            expect(() =>
                localizeCliArgs(['open', flag!, value!, `${flag}=${value}`], stack)
            ).toThrow('Duplicate');
            for (const unsafe of [
                'https://network.learncard.com/trpc',
                otherStack.brain,
                `${value}/`,
                `${value}?redirect=https://example.org`,
            ]) {
                expect(() => localizeCliArgs(['open', `${flag}=${unsafe}`], stack)).toThrow();
            }
        }
    });

    it('rejects separator and external callback/signing overrides', () => {
        expect(() => localizeCliArgs(['init', '--', '--network', stack.brain], stack)).toThrow(
            'separators'
        );
        for (const flag of ['--endpoint', '--webhook-url', '--url']) {
            expect(() => localizeCliArgs(['init', flag, stack.app], stack)).toThrow(
                'unprovisioned'
            );
            expect(() => localizeCliArgs(['init', `${flag}=${stack.app}`], stack)).toThrow(
                'unprovisioned'
            );
        }
    });

    it('supports confined verify and refuses commands with unconfined service access', () => {
        expect(localizeCliArgs(['verify', 'credential.json', '--json'], stack)).toEqual([
            'verify',
            'credential.json',
            '--json',
        ]);
        for (const command of ['demo', 'repl']) {
            expect(() => localizeCliArgs([command], stack)).toThrow('lc verify script');
        }
        for (const command of ['promote', 'webhook']) {
            expect(() => localizeCliArgs([command], stack)).toThrow('outside the owned');
        }
        expect(localizeCliArgs(['help'], stack)).toEqual(['help']);
        expect(localizeCliArgs(['--version'], stack)).toEqual(['--version']);
    });

    it('drops inherited credentials, endpoint overrides, proxy and runtime injection variables', () => {
        const env = cliEnvironment(stack, {
            PATH: '/usr/bin',
            HOME: '/tmp/disposable-home',
            TMPDIR: '/tmp',
            SECURE_SEED: 'real-secret',
            LEARNCARD_ISSUER_SEED: 'real-secret',
            LEARNCARD_CLI_SEED: 'real-secret',
            NETWORK_URL: 'https://network.learncard.com/trpc',
            CLOUD_URL: 'https://cloud.learncard.com/trpc',
            LCA_API_URL: 'https://api.learncard.app/trpc',
            NODE_OPTIONS: '--require /tmp/injected.js',
            BUN_OPTIONS: '--preload /tmp/injected.js',
            HTTP_PROXY: 'http://remote-proxy.invalid',
            HTTPS_PROXY: 'http://remote-proxy.invalid',
        });
        expect(env).toEqual({
            NODE_ENV: 'development',
            PATH: '/usr/bin',
            HOME: '/tmp/disposable-home',
            TMPDIR: '/tmp',
            NO_COLOR: '1',
            CI: '1',
            NETWORK_URL: stack.brain,
            CLOUD_URL: stack.cloud,
            LCA_API_URL: stack.lcaApi,
        });
        expect(cliEnvironment(otherStack, {}).NETWORK_URL).toBe(otherStack.brain);
    });
});
