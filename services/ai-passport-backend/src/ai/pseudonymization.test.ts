import { privacyFailureDetails } from './privacy-diagnostics';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createHmac } from 'node:crypto';
import { describe, expect, test } from 'bun:test';

import { createIdentifierMappingService } from './pseudonymization';
import type { EncryptedIdentifierMapping } from './pseudonymization';
import { MAX_GUARDRAIL_TEXT_LENGTH } from './bedrock-guardrails';

const NOW = new Date('2026-08-27T00:00:00.000Z');
const OWNER = 'did:example:owner';
const OTHER = 'did:example:other';
const KEYS = {
    encryption: Buffer.alloc(32, 17),
    reference: Buffer.alloc(32, 29),
};
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

// Synthetic masking isolates mapping behavior; this is not AWS detection evidence.
const mask = async (text: string) => text.replaceAll('Unlisted Visitor', '{NAME}');

const setup = (
    options: {
        mask?: (text: string, source: 'INPUT' | 'OUTPUT') => Promise<string>;
        personalFields?: Record<string, string>;
        credentialUris?: string[];
        retain?: (mapping: EncryptedIdentifierMapping) => Promise<EncryptedIdentifierMapping>;
        lookup?: () => Promise<EncryptedIdentifierMapping[]>;
    } = {}
) => {
    const context = new AsyncLocalStorage<string>();
    const mappings = new Map<string, EncryptedIdentifierMapping>();
    let clock = NOW.getTime();
    const service = createIdentifierMappingService({
        currentSubject: () => context.getStore(),
        subjectReference: did => createHmac('sha256', KEYS.reference).update(did).digest('hex'),
        keys: () => KEYS,
        mask: options.mask ?? mask,
        credentialUris: () => options.credentialUris ?? [],
        personalFields: () =>
            options.personalFields ?? {
                fullName: 'Taylor Beeston',
                givenName: 'María García',
                familyName: '王小明',
            },
        retain:
            options.retain ??
            (async candidate => {
                const key = `${candidate.subjectRef}:${candidate.valueRef}`;
                const previous = mappings.get(key);
                if (previous && previous.expiresAt.getTime() > clock) return previous;
                mappings.set(key, candidate);
                return candidate;
            }),
        lookup:
            options.lookup ??
            (async (subjectRef, tokens) =>
                [...mappings.values()].filter(
                    mapping => mapping.subjectRef === subjectRef && tokens.includes(mapping.token)
                )),
        remove: async subjectRef => {
            let deleted = 0;
            for (const [key, mapping] of mappings) {
                if (mapping.subjectRef === subjectRef) {
                    mappings.delete(key);
                    deleted += 1;
                }
            }
            return deleted;
        },
        now: () => new Date(clock),
    });
    return {
        ...service,
        mappings,
        as: <Value>(subject: string, callback: () => Value) => context.run(subject, callback),
        advance: (milliseconds: number) => {
            clock += milliseconds;
        },
    };
};

const onlyMapping = (mappings: Map<string, EncryptedIdentifierMapping>) => {
    const mapping = mappings.values().next().value;
    if (!mapping) throw new Error('Expected a retained mapping');
    return mapping;
};

describe('owner-scoped provider pseudonymization', () => {
    test('redacts multilingual names and deterministic identifiers while retaining learning facts', async () => {
        const fixture = setup();
        const input =
            'Taylor Beeston and María García study algebra with 王小明. Email taylor@example.com; call +1 (555) 123-4567. Subject did:web:example.com:users:taylor uses lc:network:private-credential and https://example.org/credentials/abc123. Lives at 123 Maple Street; DOB: 1990-01-02.';
        const output = await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(input));
        for (const identifier of [
            'Taylor Beeston',
            'María García',
            '王小明',
            'taylor@example.com',
            '+1 (555) 123-4567',
            'did:web:example.com:users:taylor',
            'lc:network:private-credential',
            'https://example.org/credentials/abc123',
            '123 Maple Street',
            '1990-01-02',
        ])
            expect(output).not.toContain(identifier);
        expect(output).toContain('study algebra');
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(output))).toBe(input);
        expect(JSON.stringify([...fixture.mappings.values()])).not.toContain('Taylor Beeston');
        expect(JSON.stringify([...fixture.mappings.values()])).not.toContain(OWNER);
    });

    test('redacts explicitly labelled unspaced birth dates without redacting learning completion dates', async () => {
        const fixture = setup();
        const input =
            '出生日期1990年1月2日。生年月日2000-03-04. Completed Calculus in May 2025; grade A.';
        const output = await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(input));
        expect(output).not.toContain('1990年1月2日');
        expect(output).not.toContain('2000-03-04');
        expect(output).toContain('Completed Calculus in May 2025; grade A.');
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(output))).toBe(input);
    });

    test('reuses live mappings only within an owner and never extends their retention', async () => {
        const fixture = setup();
        const text =
            'Taylor Beeston taylor@example.com +1 (555) 123-4567 did:web:example.com:users:taylor lc:network:abc';
        const first = await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(text));
        const firstExpiry = onlyMapping(fixture.mappings).expiresAt.getTime();
        fixture.advance(24 * 60 * 60 * 1000);
        expect(await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(text))).toBe(first);
        expect(onlyMapping(fixture.mappings).expiresAt.getTime()).toBe(firstExpiry);
        const other = await fixture.as(OTHER, () => fixture.pseudonymizeProviderInput(text));
        expect(other).not.toBe(first);
        expect(await fixture.as(OTHER, () => fixture.restoreProviderOutput(first))).toBe(first);
        expect(await fixture.as(OTHER, () => fixture.restoreProviderOutput(other))).toBe(text);
        const records = [...fixture.mappings.values()];
        expect(new Set(records.map(mapping => mapping.iv)).size).toBe(records.length);
        expect(new Set(records.map(mapping => mapping.ciphertext)).size).toBe(records.length);
    });

    test('rejects oversized aggregate input before AWS rather than splitting identifiers', async () => {
        let calls = 0;
        const fixture = setup({
            mask: async text => {
                calls += 1;
                return text;
            },
        });
        await expect(
            fixture.as(OWNER, () =>
                fixture.pseudonymizeProviderInput('A'.repeat(MAX_GUARDRAIL_TEXT_LENGTH))
            )
        ).rejects.toThrow('Privacy text size limit exceeded');
        expect(calls).toBe(0);
    });

    test('protects authorized storage URLs without masking ordinary learning links', async () => {
        const uri = 'https://storage.example.org/private/file-9';
        const fixture = setup({ credentialUris: [uri] });
        const input = `Use ${uri}; learn at https://school.example.org/course/algebra.`;
        const protectedText = await fixture.as(OWNER, () =>
            fixture.pseudonymizeProviderInput(input)
        );
        expect(protectedText).not.toContain(uri);
        expect(protectedText).toContain('https://school.example.org/course/algebra');
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(protectedText))).toBe(
            input
        );
    });

    test('keeps generic placeholders irreversible while preserving distinct known identities', async () => {
        const fixture = setup();
        const input =
            'Taylor Beeston and María García mentor Unlisted Visitor at North School. Grade A; completed 2025-06-03; role tutor; skill algebra.';
        const protectedText = await fixture.as(OWNER, () =>
            fixture.pseudonymizeProviderInput(input)
        );
        expect(protectedText).toContain('{NAME}');
        expect(protectedText.match(/\{\{NAME_[a-f0-9]{32}\}\}/g)?.length).toBe(2);
        const restored = await fixture.as(OWNER, () =>
            fixture.restoreProviderOutput(protectedText)
        );
        expect(restored).toBe(input.replace('Unlisted Visitor', '{NAME}'));
    });

    test('seeds later explicit fields before prose and preserves repeated Unicode identities', async () => {
        const fixture = setup({ personalFields: {} });
        const input = {
            content: '🎓 Иван Петров: Иван Петров',
            fullName: 'Иван Петров',
        };
        const protectedValue = await fixture.as(OWNER, () =>
            fixture.pseudonymizeProviderInput(input)
        );
        expect(protectedValue.content).toBe(
            `🎓 ${protectedValue.fullName}: ${protectedValue.fullName}`
        );
        expect(
            await fixture.as(OWNER, () => fixture.restoreProviderOutput(protectedValue))
        ).toEqual(input);
        // Only deterministic mapping is tested here; Russian free text is rejected
        // by the real managed adapter, not claimed to have supported AWS coverage.
    });

    test('traverses nested content, dynamic keys and JSON tool arguments without hiding learning fields', async () => {
        const fixture = setup();
        const input = [
            {
                role: 'assistant',
                content: [{ type: 'text', text: 'Taylor Beeston mastered fractions.' }],
                tool_calls: [
                    {
                        type: 'function',
                        function: {
                            name: 'recordProgress',
                            arguments: JSON.stringify({
                                fullName: 'María García',
                                name: 'Fractions',
                                score: 92,
                                birthDate: '2001-02-03',
                                credentialId: 'private-123',
                            }),
                        },
                    },
                ],
                metadata: {
                    'taylor@example.com': {
                        details: 'Call +442079460958',
                        releaseDate: '2026-08-27',
                    },
                },
                credential: {
                    type: ['VerifiableCredential'],
                    id: 'https://example.org/private-record',
                    name: 'Fractions',
                    credentialSubject: { score: 92 },
                },
            },
        ];
        const output = await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(input));
        const serialized = JSON.stringify(output);
        expect(serialized).not.toContain('María García');
        expect(serialized).not.toContain('taylor@example.com');
        expect(serialized).not.toContain('2001-02-03');
        expect(serialized).not.toContain('private-123');
        expect(serialized).not.toContain('+442079460958');
        expect(serialized).not.toContain('https://example.org/private-record');
        expect(serialized).toContain('Fractions');
        expect(serialized).toContain('recordProgress');
        expect(serialized).toContain('2026-08-27');
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(output))).toEqual(input);
    });

    test('unions overlapping known and direct spans without losing Unicode offsets', async () => {
        const fixture = setup({ personalFields: { fullName: 'taylor' } });
        const input = '🎓 Contact taylor@example.com. Algebra score: 92.';
        const output = await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(input));
        expect(output).toMatch(/^🎓 Contact \{\{EMAIL_[a-f0-9]{32}\}\}\. Algebra score: 92\.$/);
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(output))).toBe(input);
    });

    test('does not mistake release dates, arithmetic, short numbers or learning names for identifiers', async () => {
        const fixture = setup();
        const input = {
            name: 'Linear Algebra',
            content:
                'The 2026-08-27 release has 12345 users. The equation 12 + 345 = 357 is true. Lesson 555-1234 begins at 10:30. Read https://example.org/lessons/fractions.',
        };
        expect(await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(input))).toEqual(
            input
        );
    });

    test.each([
        new Uint8Array([1, 2]),
        {
            content: [
                {
                    type: 'image_url',
                    image_url: { url: 'https://example.org/private.png' },
                },
            ],
        },
        {
            content: [{ type: 'input_audio', input_audio: { data: 'AA==', format: 'wav' } }],
        },
        { content: [{ type: 'input_file', file_id: 'private-file' }] },
        { parts: [{ inlineData: { mimeType: 'application/pdf', data: 'AA==' } }] },
        { encrypted_content: 'opaque-provider-state' },
        'data:application/pdf;base64,AA==',
    ])('rejects binary/opaque content instead of forwarding it: %#', async input => {
        const fixture = setup();
        await expect(
            fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(input))
        ).rejects.toThrow();
    });

    test('fails closed on missing authentication, filtering failures and failed persistence', async () => {
        const fixture = setup();
        await expect(fixture.pseudonymizeProviderInput('text')).rejects.toThrow();
        await expect(fixture.restoreProviderOutput('text')).rejects.toThrow();
        const detectorFailure = setup({
            mask: async () => {
                throw new Error('sensitive detector detail');
            },
        });
        await expect(
            detectorFailure.as(OWNER, () => detectorFailure.pseudonymizeProviderInput('Algebra'))
        ).rejects.toThrow('Managed identifier filtering failed');
        const storeFailure = setup({
            retain: async () => {
                throw new Error('sensitive store detail');
            },
        });
        await expect(
            storeFailure.as(OWNER, () =>
                storeFailure.pseudonymizeProviderInput('taylor@example.com')
            )
        ).rejects.toThrow('Identifier mapping persistence failed');
        const invalidDetector = setup({
            mask: async () => JSON.stringify({ unexpected: 'text' }),
        });
        await expect(
            invalidDetector.as(OWNER, () => invalidDetector.pseudonymizeProviderInput('text'))
        ).rejects.toThrow();
    });

    test.each(['ciphertext', 'owner', 'token', 'kind', 'valueRef', 'expiry'])(
        'authenticates encrypted mappings against %s tampering',
        async field => {
            const fixture = setup();
            const output = await fixture.as(OWNER, () =>
                fixture.pseudonymizeProviderInput('taylor@example.com')
            );
            const mapping = onlyMapping(fixture.mappings);
            switch (field) {
                case 'ciphertext':
                    mapping.ciphertext = Buffer.alloc(16).toString('base64');
                    break;
                case 'owner':
                    mapping.subjectRef = 'other-owner';
                    break;
                case 'token':
                    mapping.token = '{{EMAIL_00000000000000000000000000000000}}';
                    break;
                case 'kind':
                    mapping.kind = 'name';
                    break;
                case 'valueRef':
                    mapping.valueRef = 'other-record';
                    break;
                case 'expiry':
                    mapping.expiresAt = new Date(mapping.expiresAt.getTime() + 1);
                    break;
            }
            if (field === 'owner') {
                expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(output))).toBe(
                    output
                );
            } else {
                await expect(
                    fixture.as(OWNER, () => fixture.restoreProviderOutput(mapping.token))
                ).rejects.toThrow('Identifier mapping authentication failed');
            }
        }
    );

    test('does not trust a lookup returning a foreign owner and reports lookup failure safely', async () => {
        const foreign = setup();
        const token = await foreign.as(OTHER, () =>
            foreign.pseudonymizeProviderInput('private@example.com')
        );
        const fixture = setup({
            lookup: async () => [...foreign.mappings.values()],
        });
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(token))).toBe(token);
        const failed = setup({
            lookup: async () => {
                throw new Error('private lookup values');
            },
        });
        await expect(failed.as(OWNER, () => failed.restoreProviderOutput(token))).rejects.toThrow(
            'Identifier mapping lookup failed'
        );
    });

    test('logically expires mappings before TTL deletion and never resurrects an expired token', async () => {
        const fixture = setup();
        const text = 'taylor@example.com';
        const expired = await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(text));
        fixture.advance(RETENTION_MS);
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(expired))).toBe(expired);
        const replacement = await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(text));
        expect(replacement).not.toBe(expired);
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(expired))).toBe(expired);
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(replacement))).toBe(
            text
        );
    });

    test('deletes idempotently for only the authenticated owner and does not resurrect deleted tokens', async () => {
        const fixture = setup();
        const text = 'taylor@example.com';
        const deleted = await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(text));
        const other = await fixture.as(OTHER, () => fixture.pseudonymizeProviderInput(text));
        await expect(
            fixture.as(OWNER, () => fixture.deleteIdentifierMappingsForSubject(OTHER))
        ).rejects.toThrow();
        expect(
            await fixture.as(OWNER, () => fixture.deleteIdentifierMappingsForSubject(OWNER))
        ).toBe(1);
        expect(
            await fixture.as(OWNER, () => fixture.deleteIdentifierMappingsForSubject(OWNER))
        ).toBe(0);
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(deleted))).toBe(deleted);
        expect(await fixture.as(OTHER, () => fixture.restoreProviderOutput(other))).toBe(text);
        const replacement = await fixture.as(OWNER, () => fixture.pseudonymizeProviderInput(text));
        expect(replacement).not.toBe(deleted);
        expect(await fixture.as(OWNER, () => fixture.restoreProviderOutput(deleted))).toBe(deleted);
    });
});

test('insight diagnostics identify oversized privacy input before managed filtering without exposing text', async () => {
    const { runAiInsightDiagnostics } = await import('../diagnostics/ai-insight');
    const events: unknown[] = [];
    const original = console.error;
    console.error = event => {
        events.push(event);
    };
    try {
        let calls = 0;
        const fixture = setup({
            mask: async text => {
                calls += 1;
                return text;
            },
        });
        await expect(
            runAiInsightDiagnostics(() =>
                fixture.as(OWNER, () =>
                    fixture.pseudonymizeProviderInput('algebra '.repeat(MAX_GUARDRAIL_TEXT_LENGTH))
                )
            )
        ).rejects.toThrow('Privacy text size limit exceeded');
        expect(calls).toBe(0);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            stage: 'privacy_filter',
            failureCode: 'unknown',
        });
        expect(JSON.stringify(events)).not.toContain('algebra');
        expect(JSON.stringify(events)).not.toContain(OWNER);
    } finally {
        console.error = original;
    }
});

describe('bounded privacy failure attribution', () => {
    for (const [response, operation, category] of [
        ['not-json-private', 'response_parsing', 'syntax_error'],
        ['{}', 'response_validation', 'invalid_response'],
        ['[1]', 'response_validation', 'invalid_response'],
    ] as const) {
        test(`attributes ${operation} without changing generic failure`, async () => {
            const service = setup({ mask: async () => response });
            const error = await service
                .as(OWNER, () => service.pseudonymizeProviderInput('synthetic learning content'))
                .catch(error => error);
            expect(privacyFailureDetails(error)).toEqual({
                privacyOperation: operation,
                privacyCategory: category,
            });
            expect(error.message).toBe(
                operation === 'response_parsing'
                    ? 'Managed identifier filtering failed'
                    : 'Managed identifier filtering returned invalid content'
            );
            expect(error.cause).toBeUndefined();
        });
    }
    test('attributes payload limit before calling service', async () => {
        let calls = 0;
        const service = setup({
            mask: async text => {
                calls += 1;
                return text;
            },
        });
        const error = await service
            .as(OWNER, () =>
                service.pseudonymizeProviderInput('x'.repeat(MAX_GUARDRAIL_TEXT_LENGTH))
            )
            .catch(error => error);
        expect(privacyFailureDetails(error)).toEqual({
            privacyOperation: 'payload_limit',
            privacyCategory: 'payload_too_large',
        });
        expect(calls).toBe(0);
    });
    test('mapping failure retains consent category through generic wrapper', async () => {
        const primary = Object.assign(new Error('private'), {
            name: 'AiConsentError',
        });
        const service = setup({
            retain: async () => {
                throw primary;
            },
        });
        const error = await service
            .as(OWNER, () => service.pseudonymizeProviderInput('private@example.test'))
            .catch(error => error);
        expect(privacyFailureDetails(error)).toEqual({
            privacyOperation: 'mapping_persistence',
            privacyCategory: 'consent_denied',
        });
        expect(error.message).toBe('Identifier mapping persistence failed');
        expect(error.cause).toBeUndefined();
    });
    test('invocation preserves typed failure classification without exposing underlying error', async () => {
        const primary = Object.assign(new Error('private token'), {
            name: 'AiAuditPersistenceError',
            $metadata: { httpStatusCode: 503, private: 'secret' },
        });
        const service = setup({
            mask: async () => {
                throw primary;
            },
        });
        const error = await service
            .as(OWNER, () => service.pseudonymizeProviderInput('synthetic learning content'))
            .catch(error => error);
        expect(privacyFailureDetails(error)).toEqual({
            privacyOperation: 'service_invocation',
            privacyCategory: 'audit_unavailable',
            privacyStatus: 503,
        });
        expect(error.message).toBe('Managed identifier filtering failed');
        expect(error.cause).toBeUndefined();
    });
});

test('local preparation and mapping authentication failures remain fail closed with exact operation', async () => {
    const absent = setup();
    const missing = await absent
        .as('', () => absent.pseudonymizeProviderInput('synthetic'))
        .catch(error => error);
    expect(privacyFailureDetails(missing)?.privacyOperation).toBe('preparation');
    expect(missing.message).toBe('Authenticated AI subject is required');
    const corrupt = setup({
        retain: async candidate => ({ ...candidate, ciphertext: 'corrupt' }),
    });
    const invalid = await corrupt
        .as(OWNER, () => corrupt.pseudonymizeProviderInput('private@example.test'))
        .catch(error => error);
    expect(privacyFailureDetails(invalid)?.privacyOperation).toBe('mapping_authentication');
    expect(invalid).toBeInstanceOf(Error);
});

for (const input of [
    'Contact synthetic@example.test and phone +1 415 555 1234.',
    'María García — 王小明 "\\\n 😀',
    '{{EMAIL_00000000000000000000000000000000}} synthetic@example.test',
    'x'.repeat(MAX_GUARDRAIL_TEXT_LENGTH + 20),
]) {
    test('privacy sizing uses real transform and serialization without mappings or service calls', async () => {
        let calls = 0;
        let payload = '';
        const service = setup({
            mask: async text => {
                calls += 1;
                payload = text;
                return text;
            },
        });
        const measured = await service.as(OWNER, () => service.measureProviderInputSize(input));
        expect(calls).toBe(0);
        expect(service.mappings.size).toBe(0);
        if (measured <= MAX_GUARDRAIL_TEXT_LENGTH) {
            await service.as(OWNER, () => service.pseudonymizeProviderInput(input));
            expect(measured).toBe(payload.length);
        } else {
            await expect(
                service.as(OWNER, () => service.pseudonymizeProviderInput(input))
            ).rejects.toThrow('Privacy text size limit exceeded');
            expect(calls).toBe(0);
        }
    });
}
