import { describe, expect, it, vi } from 'vitest';

import type { ShareContentRepository } from '@accesslayer/share-content';
import type { LearnCardLike, ReplayStore } from '@helpers/share-content-auth';

import { parseLearnCloudServiceEnvironment } from '@environment';
import {
    SHARE_CONTENT_MAX_REQUEST_BYTES,
    buildShareContentRuntime,
    getShareContentRawConfig,
    parseShareContentNamespaceBindings,
    resolveShareContentConfig,
} from '../src/share-content';

const AUDIENCE = 'did:web:cloud.learncard.com';
const SIGNER = 'did:web:brain.learncard.com';
const KID = `${SIGNER}#key-1`;
const NAMESPACE = 'learncard';

const fullConfig = (overrides: Record<string, unknown> = {}) => ({
    audience: AUDIENCE,
    serviceDids: SIGNER,
    verificationMethods: KID,
    namespaceBindings: JSON.stringify({ [SIGNER]: [NAMESPACE] }),
    ...overrides,
});

describe('share-content runtime configuration', () => {
    it('does no setup without service wiring', () => {
        expect(resolveShareContentConfig({}).status).toBe('disabled');
        expect(
            resolveShareContentConfig({
                audience: '',
                serviceDids: '',
                verificationMethods: '',
                namespaceBindings: '',
            }).status
        ).toBe('disabled');
        expect(resolveShareContentConfig(null).status).toBe('disabled');
    });

    it('is available without a rollout flag and ignores its retired value', () => {
        expect(resolveShareContentConfig(fullConfig()).status).toBe('enabled');
        expect(resolveShareContentConfig(fullConfig({ enabled: false })).status).toBe('enabled');
    });

    it('is invalid when an enabled configuration is incomplete (fail closed)', () => {
        for (const missing of [
            { audience: undefined },
            { serviceDids: undefined },
            { verificationMethods: undefined },
            { namespaceBindings: undefined },
        ]) {
            const result = resolveShareContentConfig(fullConfig(missing));

            expect(result.status).toBe('invalid');
        }

        expect(resolveShareContentConfig(fullConfig({ audience: '   ' })).status).toBe('invalid');
        expect(resolveShareContentConfig(fullConfig({ serviceDids: [] })).status).toBe('invalid');
        expect(resolveShareContentConfig(fullConfig({ verificationMethods: '' })).status).toBe(
            'invalid'
        );
        expect(resolveShareContentConfig(fullConfig({ namespaceBindings: '{}' })).status).toBe(
            'invalid'
        );
        expect(
            resolveShareContentConfig(fullConfig({ namespaceBindings: 'not-json' })).status
        ).toBe('invalid');
    });

    it('rejects bindings that do not exactly match the service DID allowlist', () => {
        const missingEntry = resolveShareContentConfig(
            fullConfig({
                serviceDids: `${SIGNER},did:web:brain2.learncard.com`,
                namespaceBindings: JSON.stringify({ [SIGNER]: [NAMESPACE] }),
            })
        );
        expect(missingEntry.status).toBe('invalid');

        const nonAllowlisted = resolveShareContentConfig(
            fullConfig({
                namespaceBindings: JSON.stringify({
                    [SIGNER]: [NAMESPACE],
                    'did:web:brain2.learncard.com': ['other'],
                }),
            })
        );
        expect(nonAllowlisted.status).toBe('invalid');
    });

    it('parses per-service bindings and enforces them per signer', () => {
        const result = resolveShareContentConfig(
            fullConfig({
                serviceDids: `${SIGNER},did:web:brain2.learncard.com`,
                verificationMethods: `${KID},did:web:brain2.learncard.com#key-2`,
                namespaceBindings: JSON.stringify({
                    [SIGNER]: [NAMESPACE],
                    'did:web:brain2.learncard.com': ['tenant-b', 'tenant-c'],
                }),
            })
        );

        expect(result.status).toBe('enabled');

        if (result.status !== 'enabled') throw new Error('expected enabled');

        expect(result.namespacePolicy.isAllowed(SIGNER, NAMESPACE)).toBe(true);
        expect(result.namespacePolicy.isAllowed(SIGNER, 'tenant-b')).toBe(false);
        expect(result.namespacePolicy.isAllowed('did:web:brain2.learncard.com', 'tenant-b')).toBe(
            true
        );
        expect(result.namespacePolicy.isAllowed('did:web:unknown', NAMESPACE)).toBe(false);
        expect(result.namespacePolicy.allowedNamespacesFor(SIGNER)).toEqual([NAMESPACE]);
    });

    it('parses bindings from a plain object as well as a JSON string', () => {
        expect(parseShareContentNamespaceBindings({ [SIGNER]: [NAMESPACE] })?.get(SIGNER)).toEqual([
            NAMESPACE,
        ]);
        expect(parseShareContentNamespaceBindings(`{"${SIGNER}":["${NAMESPACE}"]}`)?.size).toBe(1);
        expect(parseShareContentNamespaceBindings({ [SIGNER]: [] })).toBeNull();
        expect(parseShareContentNamespaceBindings([])).toBeNull();
    });
});

describe('share-content runtime boot order and disabled side effects', () => {
    const makeDependencies = (order: string[]) => {
        const repository = {
            initialize: vi.fn(async () => {
                order.push('initialize');
            }),
        } as unknown as ShareContentRepository;

        const replayStore = {
            consumeOnce: vi.fn(async () => true),
        } as unknown as ReplayStore;

        const getLearnCard = vi.fn(
            async () => ({ invoke: { verifyPresentation: vi.fn() } }) as unknown as LearnCardLike
        );
        const createReplayStore = vi.fn(() => {
            order.push('replay');

            return { store: replayStore, close: vi.fn(async () => {}) };
        });
        const getRepository = vi.fn(async () => {
            order.push('repository');

            return repository;
        });

        return { getLearnCard, createReplayStore, getRepository };
    };

    it('performs no repository or Redis side effects while disabled', async () => {
        const order: string[] = [];
        const dependencies = makeDependencies(order);

        const runtime = await buildShareContentRuntime({ enabled: false }, dependencies);

        expect(runtime.enabled).toBe(false);
        expect(dependencies.getRepository).not.toHaveBeenCalled();
        expect(dependencies.createReplayStore).not.toHaveBeenCalled();
        expect(dependencies.getLearnCard).not.toHaveBeenCalled();
        expect(order).toEqual([]);
    });

    it('fails explicitly on an invalid enabled configuration without opening resources', async () => {
        const order: string[] = [];
        const dependencies = makeDependencies(order);

        await expect(
            buildShareContentRuntime({ audience: AUDIENCE }, dependencies)
        ).rejects.toThrow(/Invalid LC-2187 share-content configuration/);

        expect(dependencies.getRepository).not.toHaveBeenCalled();
        expect(dependencies.createReplayStore).not.toHaveBeenCalled();
        expect(order).toEqual([]);
    });

    it('awaits repository initialization before building the verifier and replay store', async () => {
        const order: string[] = [];
        const dependencies = makeDependencies(order);

        const runtime = await buildShareContentRuntime(fullConfig(), dependencies);

        expect(runtime.enabled).toBe(true);
        expect(order).toEqual(['repository', 'initialize', 'replay']);
        expect(runtime.enabled && runtime.pluginOptions.maxRequestBytes).toBe(
            SHARE_CONTENT_MAX_REQUEST_BYTES
        );

        if (runtime.enabled) await runtime.close();
    });
});

describe('share-content environment schema', () => {
    it('defaults to disabled and does not require any share-content values', () => {
        const environment = parseLearnCloudServiceEnvironment({ NODE_ENV: 'test' }, 'test');

        expect(getShareContentRawConfig(environment)).toEqual({
            audience: undefined,
            serviceDids: undefined,
            verificationMethods: undefined,
            namespaceBindings: undefined,
        });
    });

    it('requires all trust fields when any are supplied', () => {
        expect(() =>
            parseLearnCloudServiceEnvironment(
                { NODE_ENV: 'test', SHARE_CONTENT_SERVICE_DIDS: SIGNER },
                'test'
            )
        ).toThrow(/SHARE_CONTENT_AUDIENCE/);

        const environment = parseLearnCloudServiceEnvironment(
            {
                NODE_ENV: 'test',
                SHARE_CONTENT_AUDIENCE: AUDIENCE,
                SHARE_CONTENT_SERVICE_DIDS: SIGNER,
                SHARE_CONTENT_VERIFICATION_METHODS: KID,
                SHARE_CONTENT_NAMESPACE_BINDINGS: JSON.stringify({ [SIGNER]: [NAMESPACE] }),
            },
            'test'
        );

        expect(resolveShareContentConfig(getShareContentRawConfig(environment)).status).toBe(
            'enabled'
        );
    });
});

describe('share-content environment wiring refuses absent Redis', () => {
    it('fails the boot when the real replay store cannot be created', async () => {
        const repository = {
            initialize: vi.fn(async () => {}),
        } as unknown as ShareContentRepository;

        await expect(
            buildShareContentRuntime(fullConfig(), {
                getLearnCard: async () =>
                    ({ invoke: { verifyPresentation: vi.fn() } }) as unknown as LearnCardLike,
                getRepository: async () => repository,
                createReplayStore: () => {
                    throw new Error('Redis endpoint missing');
                },
            })
        ).rejects.toThrow(/Redis endpoint missing/);
    });
});
