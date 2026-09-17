import type { Command } from 'commander';
import {
    connect,
    connectAsDidWeb,
    ensureIdentity,
    loadProject,
    type ProjectOptions,
} from './project';
import { loadOrgSpec } from './org/load';
import { applyOrg } from './org/apply';
import { formatChanges, hasChanges } from './org/diff';
import { out } from './out';
import { generateRandomSeed } from './random';

export type OrgApplyOptions = ProjectOptions & {
    dryRun?: boolean;
    secretsOut?: string;
    cwd?: string;
    presetEnv?: Record<string, string>;
};

export const runOrgApply = async (file: string, options: OrgApplyOptions): Promise<void> => {
    const spec = await loadOrgSpec(file);
    const project = await loadProject(options.cwd ?? process.cwd());
    if (options.presetEnv) Object.assign(project.env, options.presetEnv);

    if (options.profileId && options.profileId !== spec.issuer.profileId)
        throw new Error(
            `--profile-id "${options.profileId}" does not match the spec's issuer.profileId "${spec.issuer.profileId}". Remove the flag or update the spec.`
        );

    if (project.env.PROFILE_ID && project.env.PROFILE_ID !== spec.issuer.profileId)
        throw new Error(
            `This project's .env is already set up for profile "${project.env.PROFILE_ID}", but the spec declares "${spec.issuer.profileId}". Use a separate folder for a different issuer.`
        );

    if (options.dryRun) {
        if (!project.env.SECURE_SEED) {
            out.log(
                'Dry run: no identity in this folder yet — using a throwaway seed, nothing written.'
            );
            project.env.SECURE_SEED = generateRandomSeed();
        }
        project.env.PROFILE_ID ??= spec.issuer.profileId;
    } else {
        await ensureIdentity(project, {
            ...options,
            profileId: spec.issuer.profileId,
            name: spec.issuer.displayName,
        });
    }
    const learnCard = await connect(project, {
        ...options,
        lca: true,
        readOnly: !!options.dryRun,
    });

    const result = await applyOrg(spec, learnCard, project, {
        dryRun: options.dryRun,
        secretsOut: options.secretsOut,
        connectAsManager: managerDid => connectAsDidWeb(project, options, managerDid),
    });

    if (options.dryRun) out.log('Dry run: no changes were made.');
    if (hasChanges(result.changes)) {
        for (const line of formatChanges(result.changes)) out.log(line);
    } else {
        out.log('No changes.');
    }
    out.log(`Issuer DID: ${result.outputs.issuerDid}`);

    out.set({ changes: result.changes, outputs: result.outputs });
};

export const registerOrgCommand = (
    program: Command,
    run: (
        command: string,
        options: { json?: boolean },
        action: (didkit: Promise<Buffer>) => Promise<void>
    ) => Promise<void>
): void => {
    const orgCommand = program
        .command('org')
        .description('Manage an issuer organization declaratively.');

    orgCommand
        .command('apply <file>')
        .description(
            'Reconcile a YAML/JSON org spec (issuer, signing authority, districts, service accounts) against the network.'
        )
        .option('-y, --yes', 'accept defaults without prompting')
        .option(
            '--profile-id <id>',
            'public handle for your issuer profile (default: from the spec)'
        )
        .option('--network <url>', 'network tRPC URL or staging (default: production)')
        .option('--json', 'print a single JSON result on stdout')
        .option('--dry-run', 'preview changes without applying them')
        .option(
            '--secrets-out <path>',
            'write created service-account tokens to this file (mode 0600)'
        )
        .action(
            (
                file: string,
                options: {
                    yes?: boolean;
                    profileId?: string;
                    network?: string;
                    json?: boolean;
                    dryRun?: boolean;
                    secretsOut?: string;
                }
            ) =>
                run('org apply', options, async didkit => {
                    await runOrgApply(file, { ...options, didkit });
                })
        );
};
