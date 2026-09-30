import fs from 'node:fs/promises';
import type { Command } from 'commander';

import {
    connect,
    loadProject,
    resolveServices,
    PRODUCTION_NETWORK,
    type ProjectOptions,
} from './project';
import { out } from './out';
import { validateClr, type ClrValidationProfile } from './clr/validate';

export type ClrValidateOptions = ProjectOptions & {
    profile?: string;
    dryRunSign?: boolean;
    allowProduction?: boolean;
};

const PROFILES: readonly ClrValidationProfile[] = ['provisional', 'official'];

const parseProfile = (value?: string): ClrValidationProfile | undefined => {
    if (value === undefined) return undefined;
    if ((PROFILES as readonly string[]).includes(value)) return value as ClrValidationProfile;
    throw new Error(`Unknown --profile "${value}". Use provisional or official.`);
};

/**
 * The signing key is derived from `credential.issuer`, so a transcript that
 * still carries a placeholder issuer would fail to sign for a reason unrelated
 * to its content. The dry run signs as this project's wallet instead.
 */
export const withIssuer = (
    credential: Record<string, unknown>,
    did: string
): Record<string, unknown> => {
    const issuer = credential.issuer;
    if (issuer && typeof issuer === 'object' && !Array.isArray(issuer))
        return { ...credential, issuer: { ...(issuer as Record<string, unknown>), id: did } };
    return { ...credential, issuer: did };
};

export const runClrValidate = async (file: string, options: ClrValidateOptions): Promise<void> => {
    const text = await fs.readFile(file, 'utf8');
    let json: unknown;
    try {
        json = JSON.parse(text);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid JSON in ${file}: ${message}`, { cause: error });
    }

    const profile = parseProfile(options.profile);
    const { errors, warnings, summary } = validateClr(json, { profile });

    for (const error of errors) out.log(`✖ ${error}`);
    for (const warning of warnings) out.log(`⚠ ${warning}`);

    const ok = errors.length === 0;
    if (!ok) process.exitCode = 1;
    let signOk = true;

    if (options.dryRunSign) {
        if (!ok) {
            out.log('Skipping --dry-run-sign: fix validation errors first.');
        } else {
            const project = await loadProject(process.cwd());
            const services = resolveServices(project.env, options.network);
            if (services.network === PRODUCTION_NETWORK && !options.allowProduction) {
                throw new Error(
                    'Refusing --dry-run-sign against production. Pass --network staging or --allow-production.'
                );
            }
            const learnCard = await connect(project, options);
            const signed = await learnCard.invoke.issueCredential(
                withIssuer(json as Record<string, unknown>, learnCard.id.did()) as never
            );
            const verification = await learnCard.invoke.verifyCredential(signed);
            out.log('Signed: true (dry run only — nothing was sent or stored)');
            for (const check of verification.checks) out.log(`✓ ${check}`);
            for (const warning of verification.warnings) out.log(`! ${warning}`);
            for (const error of verification.errors) out.log(`✗ ${error}`);
            if (verification.errors.length) {
                signOk = false;
                process.exitCode = 1;
            }
            out.set({ signed: true, verification });
        }
    }

    out.set({ ok: ok && signOk, errors, warnings, summary });
};

export const registerClrCommand = (
    program: Command,
    run: (
        command: string,
        options: { json?: boolean },
        action: (didkit: Promise<Buffer>) => Promise<void>,
        wrap?: boolean
    ) => Promise<void>
): void => {
    const clr = program.command('clr').description('CLR 2.0 transcript tools.');
    clr.command('validate <file>')
        .description('Validate a CLR 2.0 transcript file against schema and issuer-profile rules.')
        .option('--profile <name>', 'provisional or official profile checks')
        .option(
            '--dry-run-sign',
            'sign + verify in memory to catch signing failures; never sends or stores'
        )
        .option('--allow-production', 'allow --dry-run-sign against the production network')
        .option('--network <url>', 'network tRPC URL or staging (default: production)')
        .option('--json', 'print a single JSON result on stdout')
        .action((file, options) =>
            run('clr validate', options, async didkit => {
                await runClrValidate(file, { ...options, didkit });
            })
        );
};
