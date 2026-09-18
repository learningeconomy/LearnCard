import fs from 'node:fs/promises';
import path from 'node:path';
import type { Command } from 'commander';

import {
    loadProject,
    saveProject,
    resolveServices,
    PRODUCTION_NETWORK,
    STAGING_NETWORK,
    type Project,
    type ProjectOptions,
} from './project';
import { loadOrgSpec } from './org/load';
import { runOrgApply } from './org';
import { runDoctor, type RunCommand } from './doctor';
import { out } from './out';

/**
 * Per-network resources that must be recreated on the target network after a promotion.
 * See docs/how-to-guides/deploy-infrastructure/test-safely.md §"What carries over". The
 * one thing that IS portable — your seed, and therefore the resulting did:key — is
 * printed separately by `runPromote` rather than listed here.
 */
export const PROMOTE_CHECKLIST: readonly string[] = [
    'Profile & profile ID',
    'API tokens',
    'Signing authority registrations',
    'Credential templates',
    'ConsentFlow contracts',
    'Issued & claimed credentials',
    'did:web (host-bound)',
];

const NETWORK_ALIASES: Record<string, string> = {
    staging: STAGING_NETWORK,
    production: PRODUCTION_NETWORK,
};

/** `resolveServices` only special-cases the literal string "staging"; translate "production" too. */
const resolveNetworkUrl = (network: string): string =>
    resolveServices({}, NETWORK_ALIASES[network] ?? network, {}).network;

const NETWORK_DIR_NAMES: Record<string, string> = {
    [STAGING_NETWORK]: 'staging',
    [PRODUCTION_NETWORK]: 'production',
};

/** One project folder per network (`assertProjectNetwork` enforces this); named after the alias when known. */
const networkDirName = (network: string): string =>
    NETWORK_DIR_NAMES[network] ?? new URL(network).hostname;

/** Pure: resolves --from/--to to network URLs and picks the target project folder. */
export const planPromotion = (
    from: string,
    to: string
): { fromNetwork: string; toNetwork: string; targetDir: string } => {
    const fromNetwork = resolveNetworkUrl(from);
    const toNetwork = resolveNetworkUrl(to);
    if (fromNetwork === toNetwork)
        throw new Error(`--from and --to resolve to the same network (${toNetwork}).`);
    const targetDir = path.join(process.cwd(), '.learncard', networkDirName(toNetwork));
    return { fromNetwork, toNetwork, targetDir };
};

/** Pure: the source folder's `.env` must actually be on `--from`, or the wrong seed's org gets promoted. */
export const assertSourceNetwork = (
    sourceEnv: Record<string, string>,
    from: string,
    fromNetwork: string
): void => {
    const actual = resolveServices(sourceEnv, undefined, {}).network;
    if (actual !== fromNetwork)
        throw new Error(
            `--from ${from} does not match this folder's network (${actual}). Run promote from the folder that is on ${from}.`
        );
};

export type PromoteOptions = ProjectOptions & {
    from: string;
    to: string;
    org: string;
    secretsOut?: string;
    dryRun?: boolean;
    skipDoctor?: boolean;
};

export const runPromote = async (options: PromoteOptions): Promise<void> => {
    const { from, to, org, dryRun, skipDoctor } = options;
    const { fromNetwork, toNetwork, targetDir } = planPromotion(from, to);
    const secretsOut = options.secretsOut ?? path.join(targetDir, 'secrets.env');
    out.log(`Promoting ${org} from ${from} to ${to}`);
    out.log(`Target: ${targetDir}`);

    const sourceProject = await loadProject(process.cwd());
    if (!sourceProject.env.SECURE_SEED)
        throw new Error(
            `No SECURE_SEED in .env here. Run \`org apply\` against ${from} in this folder first.`
        );
    assertSourceNetwork(sourceProject.env, from, fromNetwork);

    // Only the seed (and, if present, the matching profile ID) carries over — every
    // other resource (tokens, signing authority, templates, contracts) is per-network
    // and must be recreated by `org apply` against the target network below.
    const carried = {
        SECURE_SEED: sourceProject.env.SECURE_SEED,
        ...(sourceProject.env.PROFILE_ID ? { PROFILE_ID: sourceProject.env.PROFILE_ID } : {}),
        NETWORK_URL: toNetwork,
    };

    const spec = await loadOrgSpec(org);
    if (spec.serviceAccounts?.length && !dryRun)
        out.log(`Any new service-account tokens for ${to} go to ${secretsOut}`);

    if (dryRun) {
        out.log(
            `Dry run: ${targetDir} is not created; previewing against ${to} with the carried-over seed.`
        );
        const preview: Project = {
            env: { ...carried },
            envPath: path.join(targetDir, '.env'),
            existing: '',
        };
        await runOrgApply(org, {
            ...options,
            project: preview,
            network: toNetwork,
            dryRun,
            secretsOut,
        });
    } else {
        await fs.mkdir(targetDir, { recursive: true });
        const targetProject = await loadProject(targetDir);
        if (!targetProject.env.SECURE_SEED) await saveProject(targetProject, carried);
        await runOrgApply(org, {
            ...options,
            cwd: targetDir,
            network: toNetwork,
            dryRun,
            secretsOut,
        });
    }

    if (!skipDoctor && !dryRun) {
        await runDoctor({ ...options, cwd: targetDir, network: toNetwork });
    }

    out.log(`Does not carry over from ${from} — recreate on ${to}:`);
    for (const item of PROMOTE_CHECKLIST) out.log(`  - ${item}`);
    out.log('Carries over: your seed → the same did:key.');
    out.log(`Next: cd ${targetDir} && npx @learncard/cli doctor --network ${to}`);

    out.set({ from: fromNetwork, to: toNetwork, targetDir, checklist: PROMOTE_CHECKLIST });
};

export const registerPromoteCommand = (program: Command, run: RunCommand): void => {
    program
        .command('promote')
        .description('Move an issuer org from one network to another (e.g. staging to production).')
        .requiredOption('--from <network>', 'source network tRPC URL or staging|production')
        .requiredOption('--to <network>', 'target network tRPC URL or staging|production')
        .requiredOption('--org <file>', 'org spec to re-apply on the target network')
        .option(
            '--secrets-out <path>',
            'where to write the new service-account tokens (default: <target>/secrets.env, mode 0600)'
        )
        .option('--dry-run', 'preview changes without applying them')
        .option('--skip-doctor', 'skip running doctor against the target network afterward')
        .option('-y, --yes', 'accept defaults without prompting')
        .option('--json', 'print a single JSON result on stdout')
        .action(
            (options: {
                from: string;
                to: string;
                org: string;
                secretsOut?: string;
                dryRun?: boolean;
                skipDoctor?: boolean;
                yes?: boolean;
                json?: boolean;
            }) =>
                run('promote', options, async didkit => {
                    await runPromote({ ...options, didkit });
                })
        );
};
