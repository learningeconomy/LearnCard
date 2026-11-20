import type { LCALearnCard } from '@learncard/lca-api-plugin';
import { requestProfileFields, type ConsentFlowContract } from '@learncard/types';
import { isDeepStrictEqual } from 'node:util';
import type { ReferralProgram } from './schema';
import type { OrgChange } from './apply';
import { ReferralConfigurationError } from './referral-safety';

export type ReferralCard = Pick<
    LCALearnCard['invoke'],
    | 'getContracts'
    | 'getContract'
    | 'createContract'
    | 'reconcileReferralAudience'
    | 'updateContract'
    | 'getIntegrations'
    | 'addIntegration'
    | 'getIntegrationWebhook'
    | 'setIntegrationWebhook'
>;
export type TenantSchemas = Record<string, Record<string, { fields: Record<string, unknown> }>>;

export const referralContract = (
    program: ReferralProgram,
    tenants: TenantSchemas
): ConsentFlowContract => {
    const personal: ConsentFlowContract['read']['personal'] = {};
    const categories: ConsentFlowContract['read']['credentials']['categories'] = {
        [program.outcomes.category]: { required: !!program.outcomes.required },
    };
    for (const ask of program.asks?.personal ?? []) {
        const { key, required } = typeof ask === 'string' ? { key: ask, required: false } : ask;
        personal[key] = { required };
    }
    for (const ask of program.asks?.verifiableData ?? []) {
        const { key, required } = typeof ask === 'string' ? { key: ask, required: false } : ask;
        const [tenant, schema, field] = key.split(':');
        if (!tenant || !schema || !Object.hasOwn(tenants, tenant))
            throw new ReferralConfigurationError(
                `Supply --tenant-config ${tenant}=<config.json> for ${key}.`
            );
        Object.assign(
            categories,
            requestProfileFields(
                tenant,
                schema,
                tenants[tenant]!,
                field ? [field] : undefined,
                required
            )
        );
    }
    return {
        read: { personal, credentials: { categories } },
        write: {
            personal: {},
            credentials: {
                categories: {
                    [program.outcomes.category]: { required: !!program.outcomes.required },
                },
            },
        },
    };
};

export const describeReferralScopes = (contract: ConsentFlowContract): string => {
    const list = (scopes: ConsentFlowContract['read']['personal']) =>
        Object.entries(scopes)
            .map(([key, scope]) => key + (scope.required ? ' (required)' : ''))
            .join(', ');
    return [
        'read ' + list({ ...contract.read.personal, ...contract.read.credentials.categories }),
        'write ' + list(contract.write.credentials.categories),
    ].join('; ');
};

type Scopes = ConsentFlowContract['read']['personal'];
const patchScopes = (current: Scopes, wanted: Scopes) =>
    Object.fromEntries(
        [...new Set([...Object.keys(current), ...Object.keys(wanted)])]
            .filter(key => !isDeepStrictEqual(current[key], wanted[key]))
            .map(key => [key, wanted[key] ?? null])
    );

export const findProgramContract = async (owner: ReferralCard, name: string) => {
    let cursor: string | undefined;
    let uri: string | undefined;
    for (;;) {
        const page = await owner.getContracts({ cursor, limit: 100 });
        for (const contract of page.records.filter(
            record => record.referralProgram === name || record.name === name
        )) {
            if (uri)
                throw new ReferralConfigurationError(
                    `More than one owned contract is named "${name}". Resolve the ambiguity before applying.`
                );
            uri = contract.uri;
        }
        if (!page.hasMore) return uri;
        if (!page.cursor || page.cursor === cursor)
            throw new ReferralConfigurationError('Incomplete contract listing.');
        cursor = page.cursor;
    }
};

/** Preview the audience and versioned contract change before publishing either one. */
export const applyReferralContract = async (
    owner: ReferralCard,
    program: ReferralProgram,
    contract: ConsentFlowContract,
    dryRun: boolean,
    allowReconsent: boolean,
    changes: OrgChange[]
): Promise<string | undefined> => {
    const { name, partner, referrers: recipients } = program;
    const writers = program.outcomes.issuer === partner ? [] : [program.outcomes.issuer];
    const uri = await findProgramContract(owner, name);
    const record = (action: OrgChange['action'], detail: string, id = uri) =>
        changes.push({ resource: 'referralContract', name, action, detail, id });
    if (!uri) {
        const createdUri = dryRun
            ? undefined
            : await owner.createContract({
                  referralProgram: name,
                  name,
                  contract,
                  writers,
                  recipients,
              });
        record(
            dryRun ? 'would-create' : 'created',
            `owner ${partner}, writers ${writers.join(', ') || partner}, recipients ${recipients.join(', ')} (fixed after first consent); ${describeReferralScopes(contract)}`,
            createdUri
        );
        return createdUri;
    }
    const current = await owner.getContract(uri);
    if (current.owner.profileId !== partner || current.status === 'retired')
        throw new ReferralConfigurationError(`Expected an active contract owned by ${partner}.`);
    const audienceInput = { contractUri: uri, recipients };
    const audience = await owner.reconcileReferralAudience({ ...audienceInput, dryRun: true });
    if (current.referralProgram !== name)
        throw new ReferralConfigurationError(
            `An existing contract named "${name}" was not created for this referral program. Choose a unique program name.`
        );
    if (audience.changed && audience.frozen) {
        const detail = 'Recipients are frozen after first consent. This needs a new contract.';
        if (!dryRun) throw new ReferralConfigurationError(detail);
        record('drifted', detail);
        return uri;
    }
    const read = patchScopes(
        current.contract.read.credentials.categories,
        contract.read.credentials.categories
    );
    const personal = patchScopes(current.contract.read.personal, contract.read.personal);
    const write = patchScopes(
        current.contract.write.credentials.categories,
        contract.write.credentials.categories
    );
    const writePersonal = patchScopes(current.contract.write.personal, contract.write.personal);
    const writersChanged = !isDeepStrictEqual([...audience.writers].sort(), [...writers].sort());
    const needsUpdate =
        current.name !== name ||
        writersChanged ||
        [read, personal, write, writePersonal].some(part => Object.keys(part).length > 0);
    const delta = {
        ...(current.name !== name && { name }),
        read: { personal, credentials: { categories: read } },
        write: { personal: writePersonal, credentials: { categories: write } },
        ...(writersChanged && { writers }),
    };
    const options = {
        reason:
            program.reason ?? 'The information requested for this referral program has changed.',
        expectedVersion: current.version,
    };
    const preview = needsUpdate
        ? await owner.updateContract(uri, delta, { ...options, dryRun: true })
        : undefined;
    const reconsent = preview?.kind === 'requires_consent';
    const detail = [
        audience.changed && 'change recipients before first consent',
        needsUpdate &&
            `writers ${writers.join(', ') || partner}; ${describeReferralScopes(contract)}`,
        reconsent && `requires re-consent for ${preview.affectedUsers} users (--allow-reconsent)`,
    ]
        .filter(Boolean)
        .join(', ');
    if (reconsent && !allowReconsent && !dryRun)
        throw new ReferralConfigurationError(`${name}: ${detail}`);
    if (!dryRun) {
        if (audience.changed) {
            await owner.reconcileReferralAudience({ ...audienceInput, dryRun: false });
            record('updated', 'recipients reconciled before first consent');
        }
        if (needsUpdate) await owner.updateContract(uri, delta, options);
    }
    record(detail ? (dryRun ? 'would-update' : 'updated') : 'unchanged', detail);
    return uri;
};
