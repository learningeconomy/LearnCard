import type { Command } from 'commander';
import { connect, loadProject, resolveServices, type ProjectOptions } from './project';
import { validateScope } from './token';
import { out } from './out';
import {
    CHECKS,
    DEFAULT_REQUIRED_SCOPES,
    type CheckResult,
    type CheckStatus,
    type DoctorContext,
} from './doctor/checks';

const SYMBOLS: Record<CheckStatus, string> = { pass: '✔', warn: '⚠', fail: '✖', skip: '–' };

const printResult = (title: string, result: CheckResult): void => {
    out.log(`${SYMBOLS[result.status]} ${title}${result.detail ? `  ${result.detail}` : ''}`);
    if ((result.status === 'warn' || result.status === 'fail') && result.fix) {
        out.log(`  → ${result.fix}`);
    }
};

export interface DoctorSummary {
    passed: number;
    warnings: number;
    failed: number;
    skipped: number;
    ok: boolean;
}

/** Pure so tests can drive it without a project, network, or wallet. */
export const summarize = (
    results: { status: CheckStatus }[],
    strict: boolean = false
): DoctorSummary => {
    const passed = results.filter(result => result.status === 'pass').length;
    const warnings = results.filter(result => result.status === 'warn').length;
    const failed = results.filter(result => result.status === 'fail').length;
    const skipped = results.filter(result => result.status === 'skip').length;
    return { passed, warnings, failed, skipped, ok: failed === 0 && (!strict || warnings === 0) };
};

type DoctorOptions = ProjectOptions & {
    scopes?: string;
    webhookUrl?: string;
    strict?: boolean;
    cwd?: string;
};

export const runDoctor = async (options: DoctorOptions): Promise<void> => {
    const project = await loadProject(options.cwd ?? process.cwd());
    if (!project.env.SECURE_SEED) {
        throw new Error(
            'No SECURE_SEED in .env. Run `npx @learncard/cli init` or `org apply` first.'
        );
    }
    const learnCard = await connect(project, options);
    const services = resolveServices(project.env, options.network);
    const requiredScopes = options.scopes
        ? validateScope(options.scopes).split(' ').filter(Boolean)
        : DEFAULT_REQUIRED_SCOPES;
    const webhookUrl = options.webhookUrl || project.env.WEBHOOK_URL || undefined;
    const context: DoctorContext = {
        project,
        services,
        learnCard,
        fetch,
        requiredScopes,
        webhookUrl,
    };

    const results: (CheckResult & { id: string; title: string })[] = [];
    for (const check of CHECKS) {
        const result = await check.run(context);
        results.push({ id: check.id, title: check.title, ...result });
        printResult(check.title, result);
    }

    const summary = summarize(results, !!options.strict);
    out.log(`${summary.passed} passed, ${summary.warnings} warnings, ${summary.failed} failed`);
    out.set({
        network: services.network,
        checks: results.map(({ id, status, detail, fix }) => ({ id, status, detail, fix })),
        ok: summary.ok,
    });
    if (!summary.ok) process.exitCode = 1;
};

export type RunCommand = (
    command: string,
    options: { json?: boolean },
    action: (didkit: Promise<Buffer>) => Promise<void>,
    wrap?: boolean
) => Promise<void>;

export const registerDoctorCommand = (program: Command, run: RunCommand): void => {
    program
        .command('doctor')
        .description("Preflight: check this project's issuer setup against the network.")
        .option('-y, --yes', 'accept defaults without prompting')
        .option('--profile-id <id>', 'public handle for your issuer profile')
        .option('--network <url>', 'network tRPC URL or staging (default: production)')
        .option('--json', 'print a single JSON result on stdout')
        .option(
            '--scopes <list>',
            `space-separated required scopes (default: "${DEFAULT_REQUIRED_SCOPES.join(' ')}")`
        )
        .option('--webhook-url <url>', 'send a test ping to this webhook URL')
        .option('--strict', 'also exit non-zero when there are warnings')
        .action(options =>
            run('doctor', options, async didkit => {
                await runDoctor({ ...options, didkit });
            })
        );
};
