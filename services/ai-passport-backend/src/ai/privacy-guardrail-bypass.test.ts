import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { createGuardrailMasker } from './bedrock-guardrails';
import { validateAiProviderEnvironment } from './ai-provider-config';
import {
    isPrivacyGuardrailBypassEnabled,
    PRIVACY_GUARDRAIL_BYPASS_WARNING,
    PrivacyGuardrailBypassError,
    writePrivacyGuardrailBypassBanner,
    writePrivacyGuardrailBypassRequestWarning,
} from './privacy-guardrail-bypass';
import { configureProductionLogging } from '../logging';
import {
    AiAuditEventValidator,
    createAiAuditBoundary,
    type AiAuditEvent,
    type AiAuditOperation,
} from './audit';

const bypassedAudit: AiAuditOperation = {
    provider: 'bedrock',
    model: 'guardrail:bypassed',
    operation: 'guardrail',
    purpose: 'model-inference',
    guardrail: 'bypassed',
};

const FLAG = 'DANGEROUSLY_BYPASS_PRIVACY_GUARDRAIL';
const local = { [FLAG]: 'true' };

describe('DANGEROUSLY_BYPASS_PRIVACY_GUARDRAIL parsing', () => {
    test.each<NodeJS.ProcessEnv>([{}, { [FLAG]: '' }, { [FLAG]: 'false' }])(
        'off for %o',
        environment => {
            expect(isPrivacyGuardrailBypassEnabled(environment)).toBe(false);
        }
    );

    test.each(['TRUE', 'True', '1', 'yes', 'on', ' true', 'true ', 'FALSE', '0'])(
        'rejects %p instead of guessing',
        value => {
            expect(() => isPrivacyGuardrailBypassEnabled({ [FLAG]: value })).toThrow(
                `${FLAG} must be exactly "true"`
            );
        }
    );

    test.each([
        local,
        { ...local, NODE_ENV: 'development' },
        { ...local, CONTEXT: 'dev' },
        { ...local, CI: 'false' },
        {
            ...local,
            DOMAIN: 'http://127.0.0.1:3001',
            CORS_ORIGINS: 'http://localhost:3000,http://[::1]:4321',
        },
    ])('enabled in local dev %o', environment => {
        expect(isPrivacyGuardrailBypassEnabled(environment)).toBe(true);
    });
});

describe('refused outside local dev', () => {
    test.each([
        [{ NODE_ENV: 'production' }, 'NODE_ENV=production'],
        [{ NODE_ENV: 'staging' }, 'NODE_ENV=staging'],
        [{ NODE_ENV: 'test' }, 'NODE_ENV=test'],
        [{ CONTEXT: 'production' }, 'CONTEXT is set'],
        [{ CONTEXT: 'deploy-preview' }, 'CONTEXT is set'],
        [{ CONTEXT: 'branch-deploy' }, 'CONTEXT is set'],
        [{ NETLIFY: 'true' }, 'NETLIFY is set'],
        [{ FLY_APP_NAME: 'ai-passport' }, 'FLY_APP_NAME is set'],
        [{ FLY_MACHINE_ID: 'synthetic' }, 'FLY_MACHINE_ID is set'],
        [{ FLY_REGION: 'sea' }, 'FLY_REGION is set'],
        [{ CI: 'true' }, 'CI is set'],
        [{ CI: '1' }, 'CI is set'],
        [{ GITHUB_ACTIONS: 'true' }, 'GITHUB_ACTIONS is set'],
        [{ KUBERNETES_SERVICE_HOST: '10.0.0.1' }, 'KUBERNETES_SERVICE_HOST is set'],
        [{ AWS_EXECUTION_ENV: 'AWS_ECS_FARGATE' }, 'AWS_EXECUTION_ENV is set'],
        [{ DOMAIN: 'https://ai-passport.fly.dev' }, 'DOMAIN is not localhost'],
        [
            { CORS_ORIGINS: 'http://localhost:3000,https://learncard.app' },
            'CORS_ORIGINS is not all localhost',
        ],
    ])('%o', (signal, reason) => {
        expect(() => isPrivacyGuardrailBypassEnabled({ ...local, ...signal })).toThrow(
            PrivacyGuardrailBypassError
        );
        expect(() => isPrivacyGuardrailBypassEnabled({ ...local, ...signal })).toThrow(reason);
    });

    test('deploy signals alone do nothing when the flag is off', () => {
        expect(
            isPrivacyGuardrailBypassEnabled({
                NODE_ENV: 'production',
                FLY_APP_NAME: 'ai-passport',
            })
        ).toBe(false);
    });

    test('startup validation lists the refusal with the other problems', () => {
        expect(() =>
            validateAiProviderEnvironment(
                {
                    ...local,
                    LLM_PROVIDER: 'openai',
                    OPENAI_API_KEY: 'sk',
                    NODE_ENV: 'production',
                },
                {},
                () => false
            )
        ).toThrow(`${FLAG}=true is refused outside local development (NODE_ENV=production)`);
    });

    test('startup validation accepts it for LLM_PROVIDER=openai with zero AWS config', () => {
        expect(
            validateAiProviderEnvironment(
                { ...local, LLM_PROVIDER: 'openai', OPENAI_API_KEY: 'sk' },
                {},
                () => false
            )
        ).toMatchObject({ llm: 'openai', privacyGuardrailBypass: true });
    });
});

const harness = (bypass?: () => boolean) => {
    const events: string[] = [];
    const audits: AiAuditOperation[] = [];
    const warnings: string[] = [];
    const mask = createGuardrailMasker({
        config: () => {
            events.push('config');
            return {
                region: 'us-east-1',
                guardrailIdentifier: 'privacy123',
                guardrailVersion: '1',
            };
        },
        locale: () => undefined,
        timeoutMs: 50,
        getPolicy: async () => {
            events.push('policy');
            throw new Error('synthetic: no AWS');
        },
        getLogging: async () => {
            events.push('logging');
            return {};
        },
        apply: async () => {
            events.push('apply');
            return {};
        },
        assertConsent: async () => {
            events.push('consent');
        },
        withAudit: async (operation, callback) => {
            events.push('audit');
            audits.push(operation);
            return callback(() => undefined);
        },
        bypass,
        warnBypass: source =>
            writePrivacyGuardrailBypassRequestWarning(source, text => warnings.push(text)),
    });
    return { mask, events, warnings, audits };
};

describe('guardrail call site', () => {
    test('active bypass skips only the Bedrock calls, keeps consent, and warns on every request', async () => {
        const { mask, events, warnings, audits } = harness(() =>
            isPrivacyGuardrailBypassEnabled(local)
        );
        expect(await mask('Taylor in Paris', 'INPUT')).toBe('Taylor in Paris');
        expect(await mask('Synthetic answer', 'OUTPUT')).toBe('Synthetic answer');
        expect(events).toEqual(['audit', 'consent', 'audit', 'consent']);
        expect(audits).toEqual([bypassedAudit, bypassedAudit]);
        expect(warnings).toHaveLength(2);
        expect(warnings[0]).toContain(PRIVACY_GUARDRAIL_BYPASS_WARNING);
        expect(warnings[0]).toContain('INPUT guardrail skipped');
        expect(warnings[1]).toContain('OUTPUT guardrail skipped');
    });

    test('the call site re-checks the guards even if startup validation was skipped', async () => {
        const { mask, events, warnings } = harness(() =>
            isPrivacyGuardrailBypassEnabled({
                ...local,
                FLY_APP_NAME: 'ai-passport',
            })
        );
        await expect(mask('Taylor in Paris')).rejects.toThrow();
        expect(events).toEqual([]);
        expect(warnings).toEqual([]);
    });

    test.each([undefined, {}, { [FLAG]: 'false' }])(
        'guardrail still runs when the flag is %o',
        async environment => {
            const { mask, events, warnings, audits } = harness(
                environment && (() => isPrivacyGuardrailBypassEnabled(environment))
            );
            await expect(mask('Taylor in Paris')).rejects.toThrow();
            expect(events).toEqual(['config', 'audit', 'policy']);
            expect(warnings).toEqual([]);
            expect(audits).toEqual([
                {
                    provider: 'bedrock',
                    model: 'guardrail:privacy123:1',
                    operation: 'guardrail',
                    purpose: 'model-inference',
                },
            ]);
        }
    );

    test('an invalid value fails the request instead of skipping the guardrail', async () => {
        const { mask, events } = harness(() => isPrivacyGuardrailBypassEnabled({ [FLAG]: 'yes' }));
        await expect(mask('Taylor in Paris')).rejects.toThrow();
        expect(events).toEqual([]);
    });
});

describe('warnings survive the production log policy', () => {
    let restore: (() => void) | undefined;
    afterEach(() => restore?.());

    test('banner and per-request warning reach stderr while console output is redacted', () => {
        restore = configureProductionLogging('production');
        const written: string[] = [];
        const stderr = spyOn(process.stderr, 'write').mockImplementation(chunk => {
            written.push(String(chunk));
            return true;
        });
        try {
            writePrivacyGuardrailBypassBanner();
            writePrivacyGuardrailBypassRequestWarning('INPUT');
        } finally {
            stderr.mockRestore();
        }
        expect(written.join('')).toContain(`!!! ${PRIVACY_GUARDRAIL_BYPASS_WARNING} !!!`);
        expect(written[1]).toBe(
            `[${FLAG}] ${PRIVACY_GUARDRAIL_BYPASS_WARNING} (INPUT guardrail skipped)\n`
        );
    });
});

describe('startup', () => {
    const run = async (environment: Record<string, string>) => {
        const child = Bun.spawn(
            [
                process.execPath,
                '-e',
                `
          const { configureProductionLogging } = await import('./logging.ts');
          configureProductionLogging();
          const { validateBackendEnvironment } = await import('./constants/env.ts');
          validateBackendEnvironment();
        `,
            ],
            {
                cwd: new URL('..', import.meta.url).pathname,
                env: {
                    PATH: process.env.PATH ?? '',
                    HOME: '/nonexistent',
                    MONGO_URI: 'mongodb://127.0.0.1:1/x',
                    SEED: 'synthetic',
                    REDIS_HOST: '127.0.0.1',
                    REDIS_PORT: '1',
                    LLM_PROVIDER: 'openai',
                    OPENAI_API_KEY: 'sk-synthetic',
                    ...environment,
                },
                stdout: 'pipe',
                stderr: 'pipe',
            }
        );
        return {
            exitCode: await child.exited,
            stderr: await new Response(child.stderr).text(),
        };
    };

    test('prints the banner past the log policy when the bypass is active', async () => {
        const { exitCode, stderr } = await run({
            [FLAG]: 'true',
            NODE_ENV: 'development',
        });
        expect(exitCode).toBe(0);
        expect(stderr).toContain(`!!! ${PRIVACY_GUARDRAIL_BYPASS_WARNING} !!!`);
    });

    test('stays quiet when the flag is off', async () => {
        const { exitCode, stderr } = await run({ NODE_ENV: 'development' });
        expect(exitCode).toBe(0);
        expect(stderr).not.toContain(PRIVACY_GUARDRAIL_BYPASS_WARNING);
    });

    test('refuses to start in production', async () => {
        const { exitCode, stderr } = await run({
            [FLAG]: 'true',
            NODE_ENV: 'production',
        });
        expect(exitCode).not.toBe(0);
        expect(stderr).not.toContain(`!!! ${PRIVACY_GUARDRAIL_BYPASS_WARNING} !!!`);
    });
});

describe('audit record for a bypassed guardrail', () => {
    const persisted = async (operation: AiAuditOperation) => {
        const rows: AiAuditEvent[] = [];
        const withAudit = createAiAuditBoundary({
            getSubject: () => 'did:example:synthetic-learner',
            subjectReference: () => 'a'.repeat(64),
            assertConsent: async () => ({
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
                revision: 'current',
            }),
            persist: async event => {
                rows.push(AiAuditEventValidator.parse(event));
            },
            complete: async (eventId, terminal) => {
                const index = rows.findIndex(row => row.eventId === eventId);
                rows[index] = AiAuditEventValidator.parse({
                    ...rows[index],
                    ...terminal,
                });
                return true;
            },
            now: () => new Date('2026-08-27T00:00:00.000Z'),
            elapsed: () => 0,
            eventId: () => '00000000-0000-4000-8000-000000000001',
        });
        await withAudit(operation, async () => 'ok');
        return rows;
    };

    test('bypass on: marked bypassed with no egress, not as text Bedrock received', async () => {
        const [row] = await persisted(bypassedAudit);
        expect(row).toMatchObject({
            provider: 'bedrock',
            operation: 'guardrail',
            model: 'guardrail:bypassed',
            guardrail: 'bypassed',
            egress: 'not_started',
            outcome: 'success',
        });
    });

    test('flag off: guardrail records are unchanged (no marker, egress possible)', async () => {
        const { guardrail: _omit, ...normal } = bypassedAudit;
        const [row] = await persisted({
            ...normal,
            model: 'guardrail:privacy123:1',
        });
        expect(row).not.toHaveProperty('guardrail');
        expect(row).toMatchObject({ egress: 'possible', outcome: 'success' });
    });

    test('the schema rejects a bypassed marker on anything but a no-egress guardrail record', () => {
        const base = {
            eventId: '00000000-0000-4000-8000-000000000001',
            subjectRef: 'a'.repeat(64),
            provider: 'bedrock',
            model: 'guardrail:bypassed',
            operation: 'guardrail',
            purpose: 'model-inference',
            dataCategories: ['user-content'],
            consentContract: 'lc:contract:ai',
            consentVersion: 'current',
            timestamp: '2026-08-27T00:00:00.000Z',
            egress: 'not_started',
            outcome: 'pending',
            guardrail: 'bypassed',
        };
        expect(AiAuditEventValidator.safeParse(base).success).toBe(true);
        expect(AiAuditEventValidator.safeParse({ ...base, egress: 'possible' }).success).toBe(
            false
        );
        expect(
            AiAuditEventValidator.safeParse({
                ...base,
                operation: 'structured-output',
            }).success
        ).toBe(false);
        expect(AiAuditEventValidator.safeParse({ ...base, guardrail: 'skipped' }).success).toBe(
            false
        );
    });
});
