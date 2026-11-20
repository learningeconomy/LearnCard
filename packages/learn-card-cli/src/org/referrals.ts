import { createHash } from 'node:crypto';
import type { LCALearnCard } from '@learncard/lca-api-plugin';
import { IntegrationWebhookUrlValidator, type ConsentFlowContract } from '@learncard/types';
import type { GrantCard, OrgChange, OrgApplyResult } from './apply';
import type { OrgServiceAccountSpec, OrgSpec, ReferralProgram } from './schema';
import {
    describeReferralScopes,
    applyReferralContract,
    findProgramContract,
    type ReferralCard,
} from './referral-contract';
import { hasPrivateSecret, writeSecret } from './secrets';
import { ReferralApplyError, ReferralConfigurationError } from './referral-safety';

export interface ReferralHandoff {
    program: string;
    recipient: string;
    network: string;
    contractUri?: string;
    integrationId?: string;
    tokenKey: string;
    webhookSecretKey?: string;
}
type Actor = { invoke: ReferralCard & GrantCard['invoke'] };
export interface ReferralContext {
    root: Actor & {
        invoke: Pick<
            LCALearnCard['invoke'],
            'getManagedServiceProfiles' | 'createManagedServiceProfile'
        >;
    };
    asProfile: (did: string) => Promise<Actor>;
    contracts: Map<string, ConsentFlowContract>;
    endpoints: Map<string, string>;
    network: string;
    provisionReadable: (profileId: string, displayName: string, requestId: string) => Promise<void>;
}

export const planNewReferral = (
    p: ReferralProgram,
    changes: OrgChange[],
    contract?: ConsentFlowContract
) => {
    changes.push({
        resource: 'referralContract',
        name: p.name,
        action: 'would-create',
        detail: `owner ${p.partner}, writer ${p.outcomes.issuer}, recipients ${p.referrers.join(', ')} (fixed after first consent)${contract ? '; ' + describeReferralScopes(contract) : ''}`,
    });
    for (const name of p.referrers) {
        if (p.delivery?.readable)
            changes.push({
                resource: 'readableDelivery',
                name,
                action: 'would-create',
                detail: 'delegate management for full credential delivery before first consent',
            });
        if (p.delivery?.webhook || p.delivery?.webhookEnv)
            changes.push({
                resource: 'integrationWebhook',
                name,
                action: 'would-create',
                detail: 'receive signed contract events for this recipient',
            });
        changes.push({
            resource: 'serviceAccount',
            name,
            action: 'would-create',
            detail: 'scoped referral token',
        });
    }
};

// Stable across retries and independent of the program when enabling the same recipient.
const digest = (...parts: string[]) =>
    createHash('sha256').update(JSON.stringify(parts)).digest('hex');
const requestId = (network: string, recipient: string) => {
    const hex = digest('readable-delivery-v2', network, recipient);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

const inspectWebhook = async (
    card: ReferralCard,
    name: string,
    url: string | undefined,
    file: string | undefined,
    secretKey: string
) => {
    const page = await card.getIntegrations({ query: { name }, limit: 2 });
    if (page.hasMore || page.records.length > 1)
        throw new ReferralConfigurationError(
            'Ambiguous referral integration. Resolve it before retrying.'
        );
    const existing = page.records[0];
    if (existing && (existing.name !== name || !existing.id))
        throw new ReferralConfigurationError('Integration lookup returned an unexpected identity.');
    const status = existing ? await card.getIntegrationWebhook(existing.id) : undefined;
    if (url && status?.hasSecret && (!file || !(await hasPrivateSecret(file, secretKey))))
        throw new ReferralConfigurationError(
            `Webhook secret is already issued. Restore ${secretKey} securely from your secret store or explicitly rotate the integration secret.`
        );
    return { existing, status };
};

const applyWebhook = async (
    card: ReferralCard,
    name: string,
    url: string | undefined,
    dryRun: boolean,
    file: string | undefined,
    handoff: ReferralHandoff,
    changes: OrgChange[]
) => {
    // Recheck after preflight: a prior or concurrent request may have issued the secret.
    const secretKey = handoff.tokenKey.replace(/_TOKEN$/, '_WEBHOOK_SECRET');
    const { existing, status } = await inspectWebhook(card, name, url, file, secretKey);
    if (!existing && !url) return;
    const id =
        existing?.id ??
        (!dryRun ? await card.addIntegration({ name, whitelistedDomains: [] }) : undefined);
    handoff.integrationId = id;
    if (!existing && id)
        changes.push({ resource: 'integrationWebhook', name, action: 'created', id });
    const changed =
        (status?.webhookUrl ?? undefined) !== url ||
        Boolean(url && (!status?.contractEventsEnabledAt || !status?.hasSecret));
    if (changed && !dryRun && id && file) {
        const registration = await card.setIntegrationWebhook(id, url ?? null);
        // Record confirmation before attempting the fallible private-file write.
        changes.push({ resource: 'integrationWebhook', name, action: 'updated', id });
        if (registration.secret) await writeSecret(file, secretKey, registration.secret);
        if (
            url &&
            ((!status?.hasSecret && !registration.secret) ||
                !(await hasPrivateSecret(file, secretKey)))
        )
            throw new ReferralConfigurationError(
                'Webhook registered without an available private signing secret. Restore it securely or explicitly rotate it.'
            );
    } else {
        changes.push({
            resource: 'integrationWebhook',
            name,
            id,
            action: !changed ? 'unchanged' : !existing ? 'would-create' : 'would-update',
        });
    }
};

export const applyReferrals = async (
    spec: OrgSpec,
    ctx: ReferralContext,
    dryRun: boolean,
    allowReconsent: boolean,
    file: string | undefined,
    managed: Array<{ profileId: string; did: string }>,
    changes: OrgChange[],
    token: (account: OrgServiceAccountSpec, actor: GrantCard) => Promise<void>,
    outputs?: Omit<OrgApplyResult['outputs'], 'referrals'>
): Promise<ReferralHandoff[]> => {
    const handoff: ReferralHandoff[] = [];
    let phase = 'preflight';
    try {
        if (!dryRun && spec.referralPrograms?.length && !file)
            throw new ReferralConfigurationError(
                'Referral programs require --secrets-out for the private handoff.'
            );
        // Inspect the handoff before remote writes, even when no webhook is configured.
        if (file) await hasPrivateSecret(file, '__preflight__');
        const recipients = new Map<string, { did?: string; displayName: string; actor?: Actor }>();
        const declarations = new Map(
            spec.referralRecipients?.map(entry => [entry.profileId, entry])
        );
        const ids = new Set([
            ...declarations.keys(),
            ...(spec.referralPrograms ?? []).flatMap(p => p.referrers),
        ]);
        // Resolve every existing recipient before creating any missing ones.
        for (const id of ids) {
            const page = await ctx.root.invoke.getManagedServiceProfiles({ id, limit: 2 });
            if (
                page.hasMore ||
                page.records.length > 1 ||
                page.records.some(record => record.profileId !== id)
            )
                throw new ReferralConfigurationError(
                    'Recipient lookup returned an ambiguous identity.'
                );
            const current = page.records[0];
            const declaration = declarations.get(id);
            if (!current && !declaration)
                throw new ReferralConfigurationError(
                    `Recipient ${id} must be a directly managed organization. Declare it in referralRecipients to create it.`
                );
            if (
                current &&
                (!current.did ||
                    current.type !== 'organization' ||
                    (declaration && declaration.displayName !== current.displayName))
            )
                throw new ReferralConfigurationError(
                    `The managed organization identity or display name differs for ${id}. Review the recipient before proceeding.`
                );
            recipients.set(id, {
                did: current?.did,
                displayName: current?.displayName ?? declaration!.displayName,
                actor: current ? await ctx.asProfile(current.did) : undefined,
            });
        }
        const owners = new Map<string, Actor>();
        const readable = new Set<string>();
        // Check all programs, including later ones, before contract or audience writes.
        for (const p of spec.referralPrograms ?? []) {
            if (!ctx.contracts.has(p.name))
                throw new ReferralConfigurationError(
                    `Missing resolved referral scopes for ${p.name}.`
                );
            const url = ctx.endpoints.get(p.name);
            if ((p.delivery?.webhook || p.delivery?.webhookEnv) && !url)
                throw new ReferralConfigurationError('Missing resolved referral webhook endpoint.');
            if (
                url &&
                (!url.startsWith('https://') ||
                    !IntegrationWebhookUrlValidator.safeParse(url).success)
            )
                throw new ReferralConfigurationError('Invalid HTTPS referral webhook endpoint.');
            const partnerDid = managed.find(m => m.profileId === p.partner)?.did;
            const owner =
                p.partner === spec.issuer.profileId
                    ? ctx.root
                    : partnerDid
                      ? await ctx.asProfile(partnerDid)
                      : undefined;
            if (!owner && !dryRun)
                throw new ReferralConfigurationError(`Missing managed partner ${p.partner}.`);
            if (owner) owners.set(p.name, owner);
            const uri = owner ? await findProgramContract(owner.invoke, p.name) : undefined;
            const details = uri ? await owner!.invoke.getContract(uri) : undefined;
            const disclosure = details as
                | {
                      readableDeliveryRecipients?: Array<{
                          profileId: string;
                          enabled: boolean;
                          disclosureVersion: string;
                      }>;
                  }
                | undefined;
            for (const id of p.referrers) {
                const key =
                    'REFERRAL_' +
                    digest(ctx.network, p.partner, p.name, id).slice(0, 16).toUpperCase();
                const entry: ReferralHandoff = {
                    program: p.name,
                    recipient: id,
                    network: ctx.network,
                    contractUri: uri,
                    tokenKey: key + '_TOKEN',
                    ...(url && { webhookSecretKey: key + '_WEBHOOK_SECRET' }),
                };
                handoff.push(entry);
                const enabled = disclosure?.readableDeliveryRecipients?.find(
                    r => r.profileId === id && r.enabled
                );
                if (enabled && (!p.delivery?.readable || enabled.disclosureVersion !== '2'))
                    throw new ReferralConfigurationError(
                        'Existing readable-delivery delegation differs. Review the recipient before changing its delegation.'
                    );
                if (enabled) readable.add(id);
                const actor = recipients.get(id)!.actor;
                if (actor) {
                    const { existing } = await inspectWebhook(
                        actor.invoke,
                        `Referral: ${p.name}`,
                        url,
                        file,
                        key + '_WEBHOOK_SECRET'
                    );
                    entry.integrationId = existing?.id;
                }
            }
        }
        phase = 'recipient setup';
        for (const [id, profile] of recipients) {
            const existing = !!profile.did;
            if (!existing && !dryRun) {
                profile.did = await ctx.root.invoke.createManagedServiceProfile({
                    profileId: id,
                    displayName: profile.displayName,
                    type: 'organization',
                    bio: '',
                    shortBio: '',
                });
            }
            changes.push({
                resource: 'referralRecipient',
                name: id,
                id: profile.did,
                action: existing ? 'unchanged' : dryRun ? 'would-create' : 'created',
            });
            if (!profile.actor && profile.did) profile.actor = await ctx.asProfile(profile.did);
            // A newly created recipient can only be inspected after its identity exists.
            if (!existing && profile.actor) {
                for (const entry of handoff.filter(item => item.recipient === id)) {
                    const { existing: integration } = await inspectWebhook(
                        profile.actor.invoke,
                        `Referral: ${entry.program}`,
                        ctx.endpoints.get(entry.program),
                        file,
                        entry.tokenKey.replace(/_TOKEN$/, '_WEBHOOK_SECRET')
                    );
                    entry.integrationId = integration?.id;
                }
            }
        }
        // Provisioning has no read-only API. Run it before contracts, with a stable request ID.
        phase = 'readable delivery';
        const provisioned = new Set<string>();
        for (const p of spec.referralPrograms ?? []) {
            for (const id of p.referrers) {
                if (!p.delivery?.readable || provisioned.has(id)) continue;
                const profile = recipients.get(id)!;
                if (!dryRun)
                    await ctx.provisionReadable(
                        id,
                        profile.displayName,
                        requestId(ctx.network, id)
                    );
                provisioned.add(id);
                changes.push({
                    resource: 'readableDelivery',
                    name: id,
                    action: readable.has(id) ? 'unchanged' : dryRun ? 'would-create' : 'created',
                });
            }
        }
        for (const p of spec.referralPrograms ?? []) {
            const owner = owners.get(p.name);
            if (!owner) {
                planNewReferral(p, changes, ctx.contracts.get(p.name));
                continue;
            }
            phase = 'contract reconciliation';
            const uri = await applyReferralContract(
                owner.invoke,
                p,
                ctx.contracts.get(p.name)!,
                dryRun,
                allowReconsent,
                changes
            );
            const entries = handoff.filter(entry => entry.program === p.name);
            // Publish all confirmed IDs in memory before a private-file write can fail.
            for (const entry of entries) entry.contractUri = uri;
            for (const entry of entries) {
                phase = 'private handoff';
                if (uri && !dryRun && file)
                    await writeSecret(
                        file,
                        entry.tokenKey.replace(/_TOKEN$/, '_CONTRACT_URI'),
                        uri
                    );
                const actor = recipients.get(entry.recipient)!.actor;
                const url = ctx.endpoints.get(p.name);
                if (actor) {
                    phase = 'webhook registration';
                    await applyWebhook(
                        actor.invoke,
                        `Referral: ${p.name}`,
                        url,
                        dryRun,
                        file,
                        entry,
                        changes
                    );
                    phase = 'recipient token';
                    await token(
                        {
                            name: entry.tokenKey,
                            scopes: [
                                'contracts:read',
                                'contracts:write',
                                'contracts-data:read',
                                ...(p.delivery?.readable ? ['contracts-data:decrypt'] : []),
                                ...(url ? ['integrations:read'] : []),
                            ],
                        },
                        actor
                    );
                } else {
                    if (url)
                        changes.push({
                            resource: 'integrationWebhook',
                            name: entry.recipient,
                            action: 'would-create',
                        });
                    changes.push({
                        resource: 'serviceAccount',
                        name: entry.tokenKey,
                        action: 'would-create',
                    });
                }
            }
        }
        return handoff;
    } catch (error) {
        throw new ReferralApplyError(phase, error, changes, handoff, outputs);
    }
};
