import { loadReferralInputs } from './org/referral-inputs';
import type { Command } from 'commander';
import {
    connect,
    connectAsDidWeb,
    connectAsDidWebSigner,
    ensureIdentity,
    resolveServices,
    loadProject,
    type Project,
    type ProjectOptions,
} from './project';
import { loadOrgSpec } from './org/load';
import { applyOrg } from './org/apply';
import { formatChanges, hasChanges } from './org/diff';
import { out } from './out';
import { generateRandomSeed } from './random';

export type OrgApplyOptions = ProjectOptions & {
    dryRun?: boolean;
    allowReconsent?: boolean;
    tenantConfig?: string[];
    secretsOut?: string;
    cwd?: string;
    /** Operate on this in-memory project instead of loading .env from cwd (dry-run previews). */
    project?: Project;
};

export const runOrgApply = async (file: string, options: OrgApplyOptions): Promise<void> => {
    const spec = await loadOrgSpec(file);
    const inputs = await loadReferralInputs(spec, options.tenantConfig);
    if (spec.referralPrograms?.length && !options.dryRun && !options.secretsOut)
        throw new Error('Referral programs require --secrets-out for the integrator handoff.');
    const project = options.project ?? (await loadProject(options.cwd ?? process.cwd()));

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
        allowReconsent: options.allowReconsent,
        referrals: {
            ...inputs,
            root: learnCard,
            asProfile: did =>
                connectAsDidWeb(project, { ...options, readOnly: !!options.dryRun }, did),
            network: resolveServices(project.env, options.network).network,
            provisionReadable: async (profileId, displayName, requestId) => {
                // LC-2369 is deployed independently. Use its authenticated client route, and
                // fail before issuing a token if the network cannot enable this disclosure.
                const client = await learnCard.invoke.getLCNClient();
                type Provision = {
                    readableDelivery: {
                        createRecipient: {
                            mutate: (input: {
                                profileId: string;
                                displayName: string;
                                requestId: string;
                                disclosureVersion: '2';
                                acceptDelegatedAuthority: true;
                            }) => Promise<{
                                profileId: string;
                                enabled: boolean;
                                disclosureVersion: string;
                            }>;
                        };
                    };
                };
                const result = await (
                    client as unknown as Provision
                ).readableDelivery.createRecipient.mutate({
                    profileId,
                    displayName,
                    requestId,
                    disclosureVersion: '2',
                    acceptDelegatedAuthority: true,
                });
                if (
                    !result.enabled ||
                    result.profileId !== profileId ||
                    result.disclosureVersion !== '2'
                )
                    throw new Error(`Readable delivery could not be enabled for ${profileId}.`);
            },
        },
        connectAsManager: managerDid =>
            connectAsDidWeb(project, { ...options, readOnly: !!options.dryRun }, managerDid),
        connectAsManaged: managedDid =>
            connectAsDidWeb(project, { ...options, readOnly: !!options.dryRun }, managedDid),
        connectAsManagedSigner: managedDid =>
            connectAsDidWebSigner(project, { ...options, readOnly: !!options.dryRun }, managedDid),
    });

    if (options.dryRun) out.log('Dry run: no changes were made.');
    if (hasChanges(result.changes)) {
        for (const line of formatChanges(result.changes)) out.log(line);
    } else {
        out.log('No changes.');
    }
    out.log(`Issuer DID: ${result.outputs.issuerDid}`);

    for (const entry of result.outputs.referrals ?? []) {
        out.log(
            `${entry.program} → ${entry.recipient} on ${entry.network}: ${entry.contractUri ?? 'contract planned'}`
        );
        out.log(
            `Token key ${entry.tokenKey}${entry.webhookSecretKey ? ', webhook secret key ' + entry.webhookSecretKey : ''}${entry.integrationId ? ', integration ' + entry.integrationId : ''}`
        );
    }
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
        .option('--network <url>', 'production|staging|local or a tRPC URL (default: production)')
        .option('--json', 'print a single JSON result on stdout')
        .option('--allow-reconsent', 'publish changes that require learners to consent again')
        .option(
            '--tenant-config <tenant=path>',
            'resolve referral fields from a tenant config (repeatable)',
            (value: string, previous: string[]) => [...previous, value],
            [] as string[]
        )
        .option('--dry-run', 'preview changes without applying them')
        .option(
            '--secrets-out <path>',
            'write created service-account tokens to this file, e.g. ./secrets.env (mode 0600; keep it next to .env and out of git)'
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
