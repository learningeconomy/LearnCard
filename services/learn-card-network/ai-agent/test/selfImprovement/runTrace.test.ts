import { describe, expect, it } from 'vitest';

import { buildRunTrace } from '../../src/selfImprovement/runTrace';

describe('buildRunTrace', () => {
    it('stores ConsentFlow summaries without raw personal values or credential payloads', () => {
        const trace = buildRunTrace({
            ownerDid: 'did:key:user',
            model: 'test-model',
            inputMessages: [{ role: 'user', content: 'What do you know about me?' }],
            maxTraceChars: 24_000,
            result: {
                runId: 'run-1',
                message: 'You shared one credential.',
                messages: [],
                toolRuns: [
                    {
                        id: 'call-1',
                        name: 'getConsentedUserData',
                        arguments: {},
                        result: {
                            did: 'did:key:user',
                            contract: { uri: 'contract-uri', source: 'configured', created: false },
                            records: [
                                {
                                    date: '2026-05-20T00:00:00Z',
                                    contractUri: 'contract-uri',
                                    personal: {
                                        name: 'Sensitive Name',
                                    },
                                    credentials: [
                                        {
                                            category: 'Achievement',
                                            uri: 'lc:credential:1',
                                            content: {
                                                secret: 'raw credential payload',
                                            },
                                        },
                                    ],
                                },
                            ],
                            summary: {
                                recordCount: 1,
                                personalKeys: ['name'],
                                credentialCount: 1,
                                hydratedCredentialCount: 1,
                            },
                            paging: { hasMore: false },
                        },
                    },
                ],
            },
        });
        const serialized = JSON.stringify(trace);

        expect(serialized).toContain('personalKeys');
        expect(serialized).toContain('lc:credential:1');
        expect(serialized).not.toContain('Sensitive Name');
        expect(serialized).not.toContain('raw credential payload');
    });
});
