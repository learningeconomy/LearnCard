import { isLoopbackOrigin } from '../utils/loopback';

/**
 * Local-dev escape hatch: skip the Bedrock ApplyGuardrail step so
 * LLM_PROVIDER=openai runs with zero AWS access. Off unless the variable is
 * exactly "true", and refused anywhere that isn't positively local dev.
 */
export const PRIVACY_GUARDRAIL_BYPASS_ENV = 'DANGEROUSLY_BYPASS_PRIVACY_GUARDRAIL';
export const PRIVACY_GUARDRAIL_BYPASS_WARNING =
    'YOU ARE BYPASSING THE PRIVACY GUARDRAIL. LOCAL DEV ONLY. NEVER USE IN PROD.';

export class PrivacyGuardrailBypassError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PrivacyGuardrailBypassError';
    }
}

const isSet = (value: string | undefined) => Boolean(value?.trim());
const DEPLOYED_SIGNALS: [name: string, isDeployed: (value: string) => boolean][] = [
    // Netlify: any build/deploy context except `netlify dev`.
    ['CONTEXT', value => value.trim() !== 'dev'],
    ['NETLIFY', () => true],
    // Fly (the repo's deployed backend; see bedrock-generation.ts).
    ['FLY_APP_NAME', () => true],
    ['FLY_MACHINE_ID', () => true],
    ['FLY_ALLOC_ID', () => true],
    ['FLY_REGION', () => true],
    // CI runners (GitHub Actions sets both).
    ['CI', value => !['false', '0'].includes(value.trim().toLowerCase())],
    ['GITHUB_ACTIONS', () => true],
    // Other hosted runtimes, fail closed.
    ['KUBERNETES_SERVICE_HOST', () => true],
    ['AWS_EXECUTION_ENV', () => true],
    ['ECS_CONTAINER_METADATA_URI_V4', () => true],
    ['RENDER', () => true],
    ['VERCEL', () => true],
    ['DYNO', () => true],
];

/**
 * Why this environment isn't local dev. Empty means local dev: NODE_ENV is
 * development (the repo default when unset), DOMAIN and every CORS origin are
 * loopback (the same positive signal the log policy uses for raw debug), and
 * no deployed/CI marker is present.
 */
export const getNonLocalSignals = (environment: NodeJS.ProcessEnv): string[] => {
    const reasons: string[] = [];
    const nodeEnv = environment.NODE_ENV || 'development';
    if (nodeEnv !== 'development') reasons.push(`NODE_ENV=${nodeEnv}`);
    for (const [name, isDeployed] of DEPLOYED_SIGNALS) {
        const value = environment[name];
        if (value !== undefined && isSet(value) && isDeployed(value))
            reasons.push(`${name} is set`);
    }
    const domain = environment.DOMAIN || 'http://localhost';
    if (!isLoopbackOrigin(domain)) reasons.push('DOMAIN is not localhost');
    const origins = (environment.CORS_ORIGINS ?? '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
    if (origins.some(origin => !isLoopbackOrigin(origin)))
        reasons.push('CORS_ORIGINS is not all localhost');
    return reasons;
};

/**
 * Throws for an invalid value or a non-local environment. Called at startup
 * AND on every guardrail call, so skipping startup validation can't enable it.
 */
export const isPrivacyGuardrailBypassEnabled = (
    environment: NodeJS.ProcessEnv = process.env
): boolean => {
    const raw = environment[PRIVACY_GUARDRAIL_BYPASS_ENV];
    if (raw === undefined || raw === '' || raw === 'false') return false;
    if (raw !== 'true')
        throw new PrivacyGuardrailBypassError(
            `${PRIVACY_GUARDRAIL_BYPASS_ENV} must be exactly "true" to enable it, or unset/"false" (got "${raw}")`
        );
    const reasons = getNonLocalSignals(environment);
    if (reasons.length)
        throw new PrivacyGuardrailBypassError(
            `${PRIVACY_GUARDRAIL_BYPASS_ENV}=true is refused outside local development (${reasons.join(', ')})`
        );
    return true;
};

type WarningSink = (text: string) => unknown;
const stderrSink: WarningSink = text => process.stderr.write(text);

// The only free-standing text this service writes outside logSafeEvent. It goes
// straight to stderr because the production log policy redacts console output,
// and it only ever writes these constant strings, so the policy stays intact.
export const writePrivacyGuardrailBypassBanner = (sink: WarningSink = stderrSink): void => {
    const bar = '!'.repeat(PRIVACY_GUARDRAIL_BYPASS_WARNING.length + 8);
    sink(
        [
            '',
            bar,
            `!!! ${PRIVACY_GUARDRAIL_BYPASS_WARNING} !!!`,
            `!!! ${PRIVACY_GUARDRAIL_BYPASS_ENV}=true skips Bedrock ApplyGuardrail on every AI call.`,
            bar,
            '',
            '',
        ].join('\n')
    );
};

export const writePrivacyGuardrailBypassRequestWarning = (
    source: 'INPUT' | 'OUTPUT',
    sink: WarningSink = stderrSink
): void => {
    sink(
        `[${PRIVACY_GUARDRAIL_BYPASS_ENV}] ${PRIVACY_GUARDRAIL_BYPASS_WARNING} (${source === 'OUTPUT' ? 'OUTPUT' : 'INPUT'} guardrail skipped)\n`
    );
};
