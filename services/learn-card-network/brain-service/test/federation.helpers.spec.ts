import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@helpers/learnCard.helpers', () => ({ getLearnCard: vi.fn() }));

import { getLearnCard } from '@helpers/learnCard.helpers';

import {
    extractInboxServiceEndpoint,
    extractInboxServiceServiceDid,
    getServerDidFromUserDid,
    getOwningServiceDid,
} from '@helpers/federation.helpers';

const getLearnCardMock = vi.mocked(getLearnCard);

describe('federation.helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('extractInboxServiceEndpoint', () => {
        it('extracts the UniversalInboxService endpoint', () => {
            expect(
                extractInboxServiceEndpoint({
                    service: [
                        {
                            id: 'did:web:example.com:users:alice#universal-inbox',
                            type: 'UniversalInboxService',
                            serviceEndpoint: 'https://example.com/api/inbox/receive',
                        },
                    ],
                })
            ).toBe('https://example.com/api/inbox/receive');
        });

        it('returns null when the inbox service is missing', () => {
            expect(
                extractInboxServiceEndpoint({
                    service: [
                        {
                            id: 'did:web:example.com:users:alice#other',
                            type: 'OtherService',
                            serviceEndpoint: 'https://example.com/other',
                        },
                    ],
                })
            ).toBeNull();
        });
    });

    describe('extractInboxServiceServiceDid', () => {
        it('prefers explicit serviceDid metadata when present', () => {
            expect(
                extractInboxServiceServiceDid({
                    service: [
                        {
                            id: 'did:web:pr-123.preview.learncard.ai:brain:users:alice#universal-inbox',
                            type: 'UniversalInboxService',
                            serviceEndpoint:
                                'https://pr-123.preview.learncard.ai/brain/api/inbox/receive',
                            serviceDid: 'did:web:pr-123.preview.learncard.ai:brain',
                        },
                    ],
                })
            ).toBe('did:web:pr-123.preview.learncard.ai:brain');
        });

        it('returns null when serviceDid metadata is missing', () => {
            expect(
                extractInboxServiceServiceDid({
                    service: [
                        {
                            id: 'did:web:example.com:users:alice#universal-inbox',
                            type: 'UniversalInboxService',
                            serviceEndpoint: 'https://example.com/api/inbox/receive',
                        },
                    ],
                })
            ).toBeNull();
        });
    });

    describe('getServerDidFromUserDid', () => {
        it('preserves legacy inference for simple user did:web values', () => {
            expect(getServerDidFromUserDid('did:web:example.com:users:alice')).toBe(
                'did:web:example.com'
            );
        });

        it('infers preview service DIDs that include a service suffix', () => {
            expect(
                getServerDidFromUserDid('did:web:pr-123.preview.learncard.ai:brain:users:alice')
            ).toBe('did:web:pr-123.preview.learncard.ai:brain');
        });

        it('returns service DIDs unchanged when given a direct service DID', () => {
            expect(getServerDidFromUserDid('did:web:pr-123.preview.learncard.ai:brain')).toBe(
                'did:web:pr-123.preview.learncard.ai:brain'
            );
        });
    });

    describe('getOwningServiceDid', () => {
        it('prefers explicit serviceDid metadata from the resolved DID document', async () => {
            getLearnCardMock.mockResolvedValue({
                invoke: {
                    resolveDid: vi.fn().mockResolvedValue({
                        service: [
                            {
                                id: 'did:web:pr-123.preview.learncard.ai:brain:users:alice#universal-inbox',
                                type: 'UniversalInboxService',
                                serviceEndpoint:
                                    'https://pr-123.preview.learncard.ai/brain/api/inbox/receive',
                                serviceDid: 'did:web:pr-123.preview.learncard.ai:brain',
                            },
                        ],
                    }),
                },
            } as Awaited<ReturnType<typeof getLearnCard>>);

            await expect(
                getOwningServiceDid('did:web:pr-123.preview.learncard.ai:brain:users:alice')
            ).resolves.toBe('did:web:pr-123.preview.learncard.ai:brain');
        });

        it('falls back to inference when explicit serviceDid metadata is missing', async () => {
            getLearnCardMock.mockResolvedValue({
                invoke: {
                    resolveDid: vi.fn().mockResolvedValue({
                        service: [
                            {
                                id: 'did:web:pr-123.preview.learncard.ai:brain:users:alice#universal-inbox',
                                type: 'UniversalInboxService',
                                serviceEndpoint:
                                    'https://pr-123.preview.learncard.ai/brain/api/inbox/receive',
                            },
                        ],
                    }),
                },
            } as Awaited<ReturnType<typeof getLearnCard>>);

            await expect(
                getOwningServiceDid('did:web:pr-123.preview.learncard.ai:brain:users:alice')
            ).resolves.toBe('did:web:pr-123.preview.learncard.ai:brain');
        });

        it('falls back to inference when explicit serviceDid metadata mismatches the DID', async () => {
            getLearnCardMock.mockResolvedValue({
                invoke: {
                    resolveDid: vi.fn().mockResolvedValue({
                        service: [
                            {
                                id: 'did:web:pr-123.preview.learncard.ai:brain:users:alice#universal-inbox',
                                type: 'UniversalInboxService',
                                serviceEndpoint:
                                    'https://pr-123.preview.learncard.ai/brain/api/inbox/receive',
                                serviceDid: 'did:web:evil.example.com',
                            },
                        ],
                    }),
                },
            } as Awaited<ReturnType<typeof getLearnCard>>);

            await expect(
                getOwningServiceDid('did:web:pr-123.preview.learncard.ai:brain:users:alice')
            ).resolves.toBe('did:web:pr-123.preview.learncard.ai:brain');
        });
    });
});
