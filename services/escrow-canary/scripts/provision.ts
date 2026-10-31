import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { GetFunctionConfigurationCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { generateEd25519PrivateKey } from '@learncard/sss-key-manager';
import { refreshIdentity } from '../src/auth';
import { createSdk } from '../src/sdk';
import { createS3Inbox } from '../src/tier3/inbox';
import { createDynamoLedger } from '../src/tier3/ledger';
import { ProvisionError, refuse } from '../src/provision/errors';
import { createProvisioner, narrowStrategy, randomPin } from '../src/provision/flow';
import { confirmProduction } from '../src/provision/guards';
import { createLoginClient } from '../src/provision/login';
import { containConsole, installCrashHandlers } from '../src/provision/output';
import { preflight } from '../src/provision/preflight';
import { createStagedSecretStore } from '../src/provision/secret-writer';
import type { Environment, Tier } from '../src/provision/targets';

/**
 * Canary account provisioning (see PROVISIONING.md). Run the BUILT bundle with
 * Node 22, from an operator SSO session in the monitoring account:
 *
 *   node services/escrow-canary/dist/provision.mjs \
 *     --environment <staging|production> --expect-account <12 digits> --tier 3 \
 *     --labels <hold-01,hold-02|all> --login-sender <address> --login-dkim-domain <domain> \
 *     [--dry-run] [--check-mail] [--activate] [--init-pool] [--no-require-dmarc] \
 *     [--firebase-project <id>] [--function <name>]
 *
 *   ... --tier <1|2> --account <read-only|pin-a|pin-b> --email <address>   (code typed at a hidden prompt)
 *
 * `bun scripts/provision.ts` does not work: the SDK loads didkit.wasm next to
 * the bundle (`dist/`). Secrets never come from argv or env and are never printed.
 */
const write = (line: string): void => {
    process.stdout.write(`${line}\n`);
};
const exit = (code: number): never => process.exit(code);
const usage = (): never => {
    write(
        'Usage: node dist/provision.mjs --environment <staging|production> --expect-account <id> --tier <1|2|3> ' +
            '(--labels <hold-NN,...|all> --login-sender <addr> --login-dkim-domain <domain> | --account <label> --email <addr>) ' +
            '[--dry-run] [--check-mail] [--activate] [--init-pool] [--no-require-dmarc] [--firebase-project <id>] [--function <name>]'
    );
    return exit(2);
};

const parsed = (() => {
    try {
        return parseArgs({
            options: {
                environment: { type: 'string' },
                'expect-account': { type: 'string' },
                tier: { type: 'string' },
                function: { type: 'string' },
                labels: { type: 'string' },
                account: { type: 'string' },
                email: { type: 'string' },
                'login-sender': { type: 'string' },
                'login-dkim-domain': { type: 'string' },
                'no-require-dmarc': { type: 'boolean', default: false },
                'firebase-project': { type: 'string' },
                'dry-run': { type: 'boolean', default: false },
                'check-mail': { type: 'boolean', default: false },
                activate: { type: 'boolean', default: false },
                'init-pool': { type: 'boolean', default: false },
            },
            strict: true,
            allowPositionals: false,
        }).values;
    } catch {
        return usage();
    }
})();

const environment = parsed.environment;
const tier = Number(parsed.tier);
if (
    (environment !== 'staging' && environment !== 'production') ||
    !parsed['expect-account'] ||
    ![1, 2, 3].includes(tier)
)
    usage();

/** Hidden single-line input (raw mode, no echo) for the tier 1/2 login code. */
const hiddenPrompt = async (question: string): Promise<string> => {
    if (!process.stdin.isTTY) throw refuse('prompt', 'requires_tty');
    write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    return new Promise((resolve, reject) => {
        let value = '';
        const done = () => {
            process.stdin.off('data', onData);
            process.stdin.setRawMode(false);
            process.stdin.pause();
        };
        const onData = (chunk: Buffer) => {
            for (const char of chunk.toString('utf8')) {
                if (char === '\r' || char === '\n') {
                    done();
                    resolve(value);
                    return;
                }
                if (char === '\u0003') {
                    done();
                    reject(refuse('prompt', 'cancelled'));
                    return;
                }
                value = char === '\u007f' || char === '\b' ? value.slice(0, -1) : value + char;
                if (value.length > 32) {
                    done();
                    reject(refuse('prompt', 'code_format'));
                    return;
                }
            }
        };
        process.stdin.on('data', onData);
    });
};
const visiblePrompt = async (question: string): Promise<string> => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        return await rl.question(question);
    } finally {
        rl.close();
    }
};

installCrashHandlers(write, exit);
const containment = containConsole();
try {
    const secrets = createStagedSecretStore();
    const sts = new STSClient({ maxAttempts: 2 });
    const lambda = new LambdaClient({ maxAttempts: 2 });
    const plan = await preflight(
        {
            environment: environment as Environment,
            expectAccount: parsed['expect-account']!,
            tier: tier as Tier,
            functionName: parsed.function,
            labels: parsed.labels,
            account: parsed.account,
            email: parsed.email,
        },
        {
            callerAccount: async () =>
                (await sts.send(new GetCallerIdentityCommand({}))).Account ?? '',
            functionConfiguration: async name => {
                const response = await lambda.send(
                    new GetFunctionConfigurationCommand({ FunctionName: name })
                );
                return {
                    arn: response.FunctionArn ?? '',
                    env: response.Environment?.Variables ?? {},
                };
            },
        },
        secrets,
        createDynamoLedger
    );
    const loginMail =
        plan.tier === 3
            ? {
                  sender: parsed['login-sender'] ?? '',
                  dkimDomain: parsed['login-dkim-domain'] ?? '',
                  requireDmarc: !parsed['no-require-dmarc'],
              }
            : undefined;
    if (loginMail && (!/^[^\s@]+@[^\s@]+$/.test(loginMail.sender) || !loginMail.dkimDomain))
        throw refuse('usage', 'login_mail_policy');
    write(
        `plan environment=${plan.environment} tier=${plan.tier} targets=${plan.targets
            .map(target => target.label)
            .join(',')} dry-run=${parsed['dry-run']} check-mail=${parsed['check-mail']}`
    );
    if (loginMail)
        write(
            `plan login-mail sender=${loginMail.sender} dkim-domain=${loginMail.dkimDomain} require-dmarc=${loginMail.requireDmarc}`
        );
    if (!parsed['dry-run'])
        await confirmProduction(plan.environment, process.stdin.isTTY === true, visiblePrompt);
    const sdk = createSdk(plan.base);
    const provisioner = createProvisioner(
        plan,
        {
            dryRun: parsed['dry-run']!,
            checkMail: parsed['check-mail']!,
            activate: parsed.activate!,
            initPool: parsed['init-pool']!,
            loginMail,
            firebaseProject: parsed['firebase-project'],
        },
        {
            login: createLoginClient({
                serverUrl: plan.base.serverUrl,
                tenantId: plan.base.tenantId,
                firebaseApiKey: plan.base.firebaseApiKey,
            }),
            refresh: (apiKey, token) => refreshIdentity(apiKey, token),
            inbox: plan.runner ? createS3Inbox(plan.runner.inbox.bucket) : undefined,
            secrets,
            sdk,
            strategy: storage => narrowStrategy(sdk.strategy(storage)),
            prompt: hiddenPrompt,
            randomKey: generateEd25519PrivateKey,
            randomPin,
            now: Date.now,
            sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
            out: write,
        }
    );
    const outcomes = await provisioner.run();
    write(`done ${outcomes.map(outcome => `${outcome.label}=${outcome.result}`).join(' ')}`);
    write(`(${containment.suppressed()} SDK console lines suppressed)`);
    exit(0);
} catch (error) {
    if (error instanceof ProvisionError) {
        write(`stopped ${error.message} exit=${error.exitCode}`);
        if (error.reason === 'rate_limited')
            write('lca-api rate limit: wait at least 5 minutes before re-running');
        exit(error.exitCode);
    }
    // AWS errors: the constructor name only (never the message).
    const name =
        error && typeof error === 'object' && 'name' in error && typeof error.name === 'string'
            ? error.name
            : 'Error';
    write(`stopped unexpected ${/^[A-Za-z]{1,64}$/.test(name) ? name : 'Error'} exit=1`);
    exit(1);
}
