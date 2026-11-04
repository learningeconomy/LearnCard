import { describe, expect, test } from 'bun:test';

import type { ActiveAiConsentReceipt } from '../learncard/consent';
import { AiAuditEventValidator, AiAuditPersistenceError, createAiAuditBoundary } from './audit';
import type { AiAuditEvent, AiAuditOperation, AiAuditTerminal } from './audit';

const receipt: ActiveAiConsentReceipt = {
    contractUri: 'lc:contract:ai',
    receiptId: 'lc:terms:receipt',
    status: 'live',
    grantedAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
    contractUpdatedAt: '2026-08-27T00:00:00.000Z',
    categories: ['Achievement'],
    credentialUris: [],
    personalFields: [],
    guardian: { required: false, approved: false },
    purpose: 'model-inference',
    revision: 'current-authoritative-revision',
};

const operation: AiAuditOperation = {
    provider: 'openai',
    model: 'gpt-test',
    operation: 'structured-output',
    purpose: 'model-inference',
};

const createHarness = () => {
    const rows = new Map<string, AiAuditEvent>();
    const state: {
        consentError?: Error;
        intentFailure?: 'before' | 'after';
        terminalFailure?: 'before' | 'after';
        completeCalls: number;
        terminalTransitions: number;
    } = { completeCalls: 0, terminalTransitions: 0 };
    let eventIndex = 0;
    let elapsed = 0;
    const complete = async (eventId: string, terminal: AiAuditTerminal) => {
        state.completeCalls += 1;
        if (state.terminalFailure === 'before') throw new Error('private database response');
        const row = rows.get(eventId);
        if (!row || row.outcome !== 'pending') return false;
        rows.set(eventId, AiAuditEventValidator.parse({ ...row, ...terminal }));
        state.terminalTransitions += 1;
        if (state.terminalFailure === 'after') throw new Error('private database response');
        return true;
    };
    const withAudit = createAiAuditBoundary({
        getSubject: () => 'did:example:private-learner',
        subjectReference: () => 'a'.repeat(64),
        assertConsent: async () => {
            if (state.consentError) throw state.consentError;
            return receipt;
        },
        persist: async event => {
            if (state.intentFailure === 'before') throw new Error('private database response');
            if (rows.has(event.eventId)) throw new Error('duplicate attempt');
            rows.set(event.eventId, AiAuditEventValidator.parse(event));
            if (state.intentFailure === 'after') throw new Error('private database response');
        },
        complete,
        now: () => new Date('2026-08-27T00:00:00.000Z'),
        elapsed: () => {
            const current = elapsed;
            elapsed += 1;
            return current;
        },
        eventId: () => {
            eventIndex += 1;
            return `00000000-0000-4000-8000-${String(eventIndex).padStart(12, '0')}`;
        },
    });
    return { withAudit, rows, state, complete };
};

describe('AI audit boundary', () => {
    test('records managed filtering units without assessment matches or payloads', async () => {
        const { withAudit, rows } = createHarness();
        await withAudit(
            { ...operation, provider: 'bedrock', operation: 'guardrail' },
            async recordUsage => {
                recordUsage({
                    sensitiveInformationPolicyUnits: 3,
                    sensitiveInformationPolicyFreeUnits: 0,
                });
                return { text: '{NAME}', match: 'private learner' };
            }
        );
        const row = [...rows.values()][0]!;
        expect(row.outcome).toBe('success');
        expect(row.usage).toEqual({
            sensitiveInformationPolicyUnits: 3,
            sensitiveInformationPolicyFreeUnits: 0,
        });
        expect(JSON.stringify(row)).not.toContain('private learner');
        expect(JSON.stringify(row)).not.toContain('match');
    });
    test('durably records intent before callbacks and transitions one row for each outcome', async () => {
        const { withAudit, rows, state } = createHarness();
        let invoked = 0;
        const observeIntent = () => {
            invoked += 1;
            const row = [...rows.values()].at(-1)!;
            expect(row.outcome).toBe('pending');
            expect(row.egress).toBe('possible');
            expect(row.completedAt).toBeUndefined();
            expect(row.consentVersion).toBe(receipt.revision);
        };
        await expect(
            withAudit(operation, async () => {
                observeIntent();
                return 'provider result';
            })
        ).resolves.toBe('provider result');

        state.consentError = new Error('private consent denial');
        await expect(
            withAudit(operation, async () => {
                invoked += 1;
                return 'unreachable';
            })
        ).rejects.toThrow('private consent denial');
        state.consentError = undefined;

        const providerError = new Error('private provider payload');
        providerError.name = 'private provider name';
        await expect(
            withAudit(operation, async () => {
                observeIntent();
                throw providerError;
            })
        ).rejects.toBe(providerError);
        await expect(
            withAudit(operation, async () => {
                observeIntent();
                throw new DOMException('private timeout payload', 'TimeoutError');
            })
        ).rejects.toBeInstanceOf(DOMException);

        const events = [...rows.values()];
        expect(events.map(({ outcome }) => outcome)).toEqual([
            'success',
            'denied',
            'provider_error',
            'timeout',
        ]);
        expect(events.map(({ errorClass }) => errorClass)).toEqual([
            undefined,
            'consent_denied',
            'provider_failed',
            'provider_timeout',
        ]);
        expect(events[1]!.egress).toBe('not_started');
        expect(events[1]!.consentVersion).toBeNull();
        expect(state.terminalTransitions).toBe(4);
        expect(invoked).toBe(3);
        expect(JSON.stringify(events)).not.toContain('private');
        expect(JSON.stringify(events)).not.toContain('did:');
    });

    test('failed or ambiguous intent acknowledgement never invokes the provider', async () => {
        for (const failure of ['before', 'after'] as const) {
            const { withAudit, rows, state } = createHarness();
            state.intentFailure = failure;
            let invoked = false;
            await expect(
                withAudit(operation, async () => {
                    invoked = true;
                })
            ).rejects.toBeInstanceOf(AiAuditPersistenceError);
            expect(invoked).toBe(false);
            expect(state.completeCalls).toBe(0);
            expect([...rows.values()].map(({ outcome }) => outcome)).toEqual(
                failure === 'before' ? [] : ['pending']
            );
        }
    });

    test('failed terminal persistence leaves recoverable intent without fabricating provider failure', async () => {
        const { withAudit, rows, state } = createHarness();
        state.terminalFailure = 'before';
        let invoked = 0;
        await expect(
            withAudit(operation, async () => {
                invoked += 1;
                return 'secret result';
            })
        ).rejects.toBeInstanceOf(AiAuditPersistenceError);
        expect(invoked).toBe(1);
        expect(state.completeCalls).toBe(1);
        expect([...rows.values()].map(({ outcome, egress }) => ({ outcome, egress }))).toEqual([
            { outcome: 'pending', egress: 'possible' },
        ]);
        expect(JSON.stringify([...rows.values()])).not.toContain('secret result');
    });

    test('lost terminal acknowledgement does not retry or overwrite an already committed outcome', async () => {
        const { withAudit, rows, state } = createHarness();
        state.terminalFailure = 'after';
        await expect(withAudit(operation, async () => 'ok')).rejects.toBeInstanceOf(
            AiAuditPersistenceError
        );
        expect([...rows.values()].map(({ outcome }) => outcome)).toEqual(['success']);
        expect(state.completeCalls).toBe(1);
        expect(state.terminalTransitions).toBe(1);
    });

    test('recovery wins the terminal race without inventing a provider outcome', async () => {
        const { withAudit, rows, state, complete } = createHarness();
        await expect(
            withAudit(operation, async () => {
                const eventId = [...rows.keys()][0]!;
                await complete(eventId, {
                    outcome: 'indeterminate',
                    completedAt: '2026-08-28T00:00:00.000Z',
                    errorClass: 'interrupted',
                });
                return 'late provider result';
            })
        ).rejects.toBeInstanceOf(AiAuditPersistenceError);
        const event = [...rows.values()][0]!;
        expect(event.outcome).toBe('indeterminate');
        expect(event.errorClass).toBe('interrupted');
        expect(event.durationMs).toBeUndefined();
        expect(event.egress).toBe('possible');
        expect(state.terminalTransitions).toBe(1);
    });

    test('strict audit schema rejects payload fields and free-text error classifications', async () => {
        const { withAudit, rows } = createHarness();
        await withAudit(operation, async () => 'ok');
        const event = [...rows.values()][0]!;
        expect(AiAuditEventValidator.safeParse({ ...event, prompt: 'private' }).success).toBe(
            false
        );
        expect(AiAuditEventValidator.safeParse({ ...event, content: 'private' }).success).toBe(
            false
        );
        expect(
            AiAuditEventValidator.safeParse({
                ...event,
                errorClass: 'private failure details',
            }).success
        ).toBe(false);
        expect(
            AiAuditEventValidator.safeParse({
                ...event,
                subjectRef: 'did:example:raw',
            }).success
        ).toBe(false);
    });
});

test('insight audit diagnostics classify storage failures without provider execution or storage text', async () => {
    const { runAiInsightDiagnostics } = await import('../diagnostics/ai-insight');
    const events: unknown[] = [];
    const original = console.error;
    console.error = event => {
        events.push(event);
    };
    try {
        const { withAudit, state } = createHarness();
        state.intentFailure = 'before';
        let calls = 0;
        await expect(
            runAiInsightDiagnostics(() =>
                withAudit(operation, async () => {
                    calls += 1;
                })
            )
        ).rejects.toBeInstanceOf(AiAuditPersistenceError);
        expect(calls).toBe(0);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            stage: 'audit',
            failureCode: 'audit_unavailable',
        });
        expect(JSON.stringify(events)).not.toContain('private database');
        expect(JSON.stringify(events)).not.toContain('did:example');
    } finally {
        console.error = original;
    }
});
