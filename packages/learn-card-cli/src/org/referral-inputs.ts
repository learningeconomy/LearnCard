import fs from 'node:fs/promises';
import { z } from 'zod';
import { IntegrationWebhookUrlValidator } from '@learncard/types';
import type { OrgSpec } from './schema';
import { referralContract, type TenantSchemas } from './referral-contract';

const config = z.object({
    verifiableDataSchemas: z.record(
        z.string(),
        z.object({ fields: z.record(z.string(), z.unknown()) })
    ),
});

/** Resolve all schemas and deployment-specific endpoints before creating identities or profiles. */
export const loadReferralInputs = async (
    spec: OrgSpec,
    configs: string[] = [],
    env: Record<string, string | undefined> = process.env
) => {
    const tenants: TenantSchemas = Object.create(null);
    for (const source of configs) {
        const match = /^([A-Za-z][A-Za-z0-9_-]{0,63})=(.+)$/.exec(source);
        if (!match) throw new Error('Use --tenant-config tenant=path/to/config.json.');
        const [, tenant, file] = match;
        if (Object.hasOwn(tenants, tenant!))
            throw new Error(`Duplicate tenant config for ${tenant}.`);
        tenants[tenant!] = config.parse(
            JSON.parse(await fs.readFile(file!, 'utf8'))
        ).verifiableDataSchemas;
    }
    const contracts = new Map(
        (spec.referralPrograms ?? []).map(p => [p.name, referralContract(p, tenants)])
    );
    const endpoints = new Map<string, string>();
    for (const p of spec.referralPrograms ?? []) {
        const variable = p.delivery?.webhookEnv;
        const url = variable ? env[variable] : p.delivery?.webhook;
        if (variable && !url)
            throw new Error(`Set ${variable} to the HTTPS webhook URL for this environment.`);
        if (url) {
            if (
                !IntegrationWebhookUrlValidator.safeParse(url).success ||
                !url.startsWith('https://')
            )
                throw new Error(`Invalid HTTPS webhook URL for ${p.name}.`);
            endpoints.set(p.name, url);
        }
    }
    return { contracts, endpoints };
};
