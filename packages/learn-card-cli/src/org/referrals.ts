import { createHash } from 'node:crypto';
import type { LCALearnCard } from '@learncard/lca-api-plugin';
import type { ConsentFlowContract } from '@learncard/types';
import type { GrantCard, OrgChange } from './apply';
import type { OrgServiceAccountSpec, OrgSpec, ReferralProgram } from './schema';
import { applyReferralContract, type ReferralCard } from './referral-contract';
import { hasSecret, writeSecret } from './secrets';

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

export const planNewReferral = (p: ReferralProgram, changes: OrgChange[]) => {
    changes.push({
        resource: 'referralContract',
        name: p.name,
        action: 'would-create',
        detail: `owner ${p.partner}, writer ${p.outcomes.issuer}, recipients ${p.referrers.join(', ')} (fixed after first consent)`,
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

const applyWebhook = async (
    card: ReferralCard,
    name: string,
    url: string | undefined,
    dryRun: boolean,
    file: string | undefined,
    secretKey: string,
    changes: OrgChange[]
) => {
    const page = await card.getIntegrations({ query: { name }, limit: 2 });
    if (page.hasMore || page.records.length > 1)
        throw new Error(`Ambiguous referral integration "${name}".`);
    const existing = page.records[0];
    if (existing && existing.name !== name)
        throw new Error('Integration lookup returned a different name.');
    if (!existing && !url) return undefined;
    const id =
        existing?.id ??
        (!dryRun && url ? await card.addIntegration({ name, whitelistedDomains: [] }) : undefined);
    const status = existing ? await card.getIntegrationWebhook(existing.id) : undefined;
    if (url && status?.hasSecret && file && !(await hasSecret(file, secretKey))) {
        const detail = `Webhook secret is already issued. Restore ${secretKey} from your secret store or explicitly rotate the integration secret.`;
        if (!dryRun) throw new Error(detail);
        changes.push({ resource: 'integrationWebhook', name, action: 'drifted', detail });
        return id;
    }
    const changed =
        (status?.webhookUrl ?? undefined) !== url ||
        Boolean(url && !status?.contractEventsEnabledAt);
    if (changed && !dryRun && id && file) {
        const registration = await card.setIntegrationWebhook(id, url ?? null);
        if (registration.secret) await writeSecret(file, secretKey, registration.secret);
    }
    changes.push({
        resource: 'integrationWebhook',
        name,
        action: !changed
            ? 'unchanged'
            : !existing
              ? dryRun
                  ? 'would-create'
                  : 'created'
              : dryRun
                ? 'would-update'
                : 'updated',
        detail: url ? 'signed events for the recipient profile' : 'remove webhook endpoint',
    });
    return id;
};

export const applyReferrals = async (
    spec: OrgSpec,
    ctx: ReferralContext,
    dryRun: boolean,
    allowReconsent: boolean,
    file: string | undefined,
    managed: Array<{ profileId: string; did: string }>,
    changes: OrgChange[],
    token: (account: OrgServiceAccountSpec, actor: GrantCard) => Promise<void>
): Promise<ReferralHandoff[]> => {
    const handoff: ReferralHandoff[] = [];
    const recipients = new Map<string, { did?: string; displayName: string }>();
    const declarations = new Map(spec.referralRecipients?.map(entry => [entry.profileId, entry]));
    const ids = new Set([
        ...declarations.keys(),
        ...(spec.referralPrograms ?? []).flatMap(p => p.referrers),
    ]);
    for (const id of ids) {
        const page = await ctx.root.invoke.getManagedServiceProfiles({ id, limit: 1 });
        const current = page.records.find(record => record.profileId === id);
        const declaration = declarations.get(id);
        if (!current && !declaration)
            throw new Error(
                `Recipient ${id} must be a directly managed organization. Declare it in referralRecipients to create it.`
            );
        if (
            current &&
            (current.type !== 'organization' ||
                (declaration && declaration.displayName !== current.displayName))
        )
            throw new Error(
                `The managed organization type or display name differs for ${id}. Review the recipient before proceeding.`
            );
        const displayName = current?.displayName ?? declaration!.displayName;
        const did =
            current?.did ??
            (dryRun
                ? undefined
                : await ctx.root.invoke.createManagedServiceProfile({
                      profileId: id,
                      displayName,
                      type: 'organization',
                      bio: '',
                      shortBio: '',
                  }));
        recipients.set(id, { did, displayName });
        changes.push({
            resource: 'referralRecipient',
            name: id,
            action: current ? 'unchanged' : dryRun ? 'would-create' : 'created',
        });
    }
    for (const p of spec.referralPrograms ?? []) {
        const partnerDid = managed.find(m => m.profileId === p.partner)?.did;
        const owner =
            p.partner === spec.issuer.profileId
                ? ctx.root
                : partnerDid
                  ? await ctx.asProfile(partnerDid)
                  : undefined;
        if (!owner && !dryRun) throw new Error(`Missing managed partner ${p.partner}.`);
        if (!owner) {
            planNewReferral(p, changes);
            continue;
        }
        const contract = ctx.contracts.get(p.name);
        if (!contract) throw new Error(`Missing resolved referral scopes for ${p.name}.`);
        const uri = await applyReferralContract(
            owner.invoke,
            p,
            contract,
            dryRun,
            allowReconsent,
            changes
        );
        // LC-2369 exposes the delegated recipient in the contract's public disclosure.
        const details = uri ? await owner.invoke.getContract(uri) : undefined;
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
            const profile = recipients.get(id)!;
            const key =
                'REFERRAL_' + digest(ctx.network, p.partner, p.name, id).slice(0, 16).toUpperCase();
            const tokenKey = key + '_TOKEN';
            const secretKey = key + '_WEBHOOK_SECRET';
            if (uri && !dryRun && file) await writeSecret(file, key + '_CONTRACT_URI', uri);
            const readable = disclosure?.readableDeliveryRecipients?.find(
                entry => entry.profileId === id && entry.enabled
            );
            if (readable && (!p.delivery?.readable || readable.disclosureVersion !== '2')) {
                const detail =
                    'Existing readable-delivery delegation differs. Review the recipient before changing its delegation.';
                if (!dryRun) throw new Error(detail);
                changes.push({ resource: 'readableDelivery', name: id, action: 'drifted', detail });
            } else if (p.delivery?.readable) {
                if (!dryRun)
                    await ctx.provisionReadable(
                        id,
                        profile.displayName,
                        requestId(ctx.network, id)
                    );
                changes.push({
                    resource: 'readableDelivery',
                    name: id,
                    action: readable ? 'unchanged' : dryRun ? 'would-create' : 'created',
                    detail: 'delegate management for full credential delivery',
                });
            }
            const url = ctx.endpoints.get(p.name);
            const actor = profile.did ? await ctx.asProfile(profile.did) : undefined;
            let integrationId: string | undefined;
            if (actor) {
                integrationId = await applyWebhook(
                    actor.invoke,
                    `Referral: ${p.name}`,
                    url,
                    dryRun,
                    file,
                    secretKey,
                    changes
                );
                await token(
                    {
                        name: tokenKey,
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
                        name: id,
                        action: 'would-create',
                    });
                changes.push({
                    resource: 'serviceAccount',
                    name: tokenKey,
                    action: 'would-create',
                });
            }
            handoff.push({
                program: p.name,
                recipient: id,
                network: ctx.network,
                contractUri: uri,
                integrationId,
                tokenKey,
                ...(url && { webhookSecretKey: secretKey }),
            });
        }
    }
    return handoff;
};
