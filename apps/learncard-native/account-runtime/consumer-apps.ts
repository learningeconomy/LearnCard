import { z } from 'zod';
import type { NetworkLearnCardFromSeed } from '@learncard/init';
import {
    AppStoreListingValidator,
    ConsentFlowContractDetailsValidator,
    ConsentFlowTermsValidator,
    AppEventValidator,
    type AppStoreListing,
    type ConsentFlowContractDetails,
    type ConsentFlowTerms,
} from '@learncard/types';
import { getContractAudienceDids } from '../../../packages/learn-card-base/src/hooks/consentAudience';
import {
    shareWallet,
    readShareRecovery,
    buildAppShareLinkUrl,
    classifySharePublication,
} from '../../../apps/learn-card-app/src/components/share-links/shareLinkFlow';

export type ConsumerWallet = NetworkLearnCardFromSeed['returnValue'];
type FailureKind =
    | 'connection'
    | 'unavailable'
    | 'changed'
    | 'guardian'
    | 'decision'
    | 'signIn'
    | 'unsupported'
    | 'inactive';
export class ConsumerFailure extends Error {
    constructor(readonly kind: FailureKind) {
        super(`consumer:${kind}`);
    }
}
export const consumerErrorCode = (error: unknown): string => {
    if (error instanceof ConsumerFailure) return error.message;
    const value = error && typeof error === 'object' ? (error as { data?: { code?: string } }) : {};
    if (value.data?.code === 'FORBIDDEN') return 'consumer:guardian';
    if (value.data?.code === 'CONFLICT') return 'consumer:changed';
    return 'consumer:connection';
};

const idInput = z.object({ id: z.string().min(1).max(512) }).strict();
const pageInput = z
    .object({ category: z.string().max(64).optional(), cursor: z.string().max(2048).optional() })
    .strict();
const fieldID = z.string().min(1).max(512);
export const decisionInput = z
    .object({
        reviewID: z.string().uuid(),
        listingID: fieldID,
        readCategories: z.array(fieldID).max(100),
        selectedCredentials: z.record(fieldID, z.array(z.string().min(1).max(8192)).max(1000)),
        personalValues: z.record(fieldID, z.string().max(4000)),
        writeCategories: z.array(fieldID).max(100),
        writePersonal: z.array(fieldID).max(100),
        anonymize: z.boolean(),
    })
    .strict();

export const httpsURL = (value: unknown): URL | undefined => {
    if (typeof value !== 'string') return;
    try {
        const url = new URL(value);
        if (
            url.protocol !== 'https:' ||
            url.username ||
            url.password ||
            !url.hostname ||
            url.hostname === 'localhost' ||
            url.hostname.endsWith('.localhost') ||
            url.hostname.endsWith('.local') ||
            url.hostname.includes(':') ||
            /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)
        )
            return;
        return url;
    } catch {
        return;
    }
};
const configFor = (
    listing: AppStoreListing
): {
    url?: string;
    redirectUri?: string;
    aiTutorUrl?: string;
    contractUri?: string;
    permissions?: string[];
} => {
    try {
        return z
            .object({
                url: z.string().optional(),
                redirectUri: z.string().optional(),
                aiTutorUrl: z.string().optional(),
                contractUri: z.string().optional(),
                permissions: z.array(z.string()).optional(),
            })
            .parse(JSON.parse(listing.launch_config_json));
    } catch {
        return {};
    }
};
const preferredURL = (listing: AppStoreListing) => {
    const config = configFor(listing);
    return httpsURL(config.redirectUri || config.url || config.aiTutorUrl);
};
const validateListing = (raw: AppStoreListing): AppStoreListing =>
    AppStoreListingValidator.parse(
        Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== null))
    );
export const appDTO = (raw: AppStoreListing & { installed_at?: string }) => {
    const listing = validateListing(raw),
        config = configFor(listing),
        url = preferredURL(listing);
    return {
        id: listing.listing_id,
        title: listing.display_name,
        tagline: listing.tagline,
        description: listing.full_description,
        category: listing.category || 'other',
        iconURL: httpsURL(listing.icon_url)?.href,
        screenshots: (listing.screenshots ?? []).flatMap(x => httpsURL(x)?.href ?? []),
        launchType: listing.launch_type,
        host: url?.host,
        permissions: config.permissions ?? [],
        contractURI: config.contractUri,
        ageRating: listing.age_rating,
        minimumAge: listing.min_age,
        privacyURL: httpsURL(listing.privacy_policy_url)?.href,
        termsURL: httpsURL(listing.terms_url)?.href,
        featured: listing.promotion_level === 'FEATURED_CAROUSEL',
        launchable: Boolean(url || config.contractUri) && listing.launch_type !== 'SERVER_HEADLESS',
        installedAt: raw.installed_at,
    };
};
const audienceDTO = (contract: ConsentFlowContractDetails) => {
    const profiles = [contract.owner, ...(contract.recipients ?? [])];
    return getContractAudienceDids(contract).map(did => {
        const profile = profiles.find(x => x.did === did);
        return {
            id: did,
            name:
                profile?.displayName || profile?.profileId || did.split(':').at(-1) || 'Recipient',
            imageURL: httpsURL(profile?.image)?.href,
        };
    });
};
const contractFingerprint = (contract: ConsentFlowContractDetails) =>
    JSON.stringify({
        uri: contract.uri,
        updatedAt: contract.updatedAt,
        audienceVersion: contract.audienceVersion ?? 0,
        audience: getContractAudienceDids(contract),
        permissions: contract.contract,
        guardian: contract.needsGuardianConsent,
        redirectUrl: contract.redirectUrl,
        frontDoor: contract.frontDoorBoostUri,
        expiresAt: contract.expiresAt,
        name: contract.name,
        description: contract.description,
        reason: contract.reasonForAccessing,
        autoBoosts: contract.autoBoosts,
    });
const IndexRecord = z
    .object({
        id: z.string(),
        uri: z.string(),
        title: z.string().optional(),
        category: z.string().optional(),
        sharedUris: z.record(z.string(), z.array(z.string())).optional(),
    })
    .passthrough();
type IndexRecord = z.infer<typeof IndexRecord>;
const categoryRecords = async (
    wallet: ConsumerWallet,
    category: string
): Promise<IndexRecord[]> => {
    const records: IndexRecord[] = [],
        seen = new Set<string>();
    const getPage = wallet.index.LearnCloud.getPage;
    if (!getPage) throw new ConsumerFailure('unavailable');
    let cursor: string | undefined;
    for (let count = 0; count < 100; count++) {
        const page = await getPage({ category }, { limit: 100, cursor });
        for (const raw of page.records) {
            const record = IndexRecord.parse(raw);
            if (!record.id.startsWith('__verifiable_data_')) records.push(record);
        }
        if (!page.hasMore) return records;
        if (!page.cursor || seen.has(page.cursor)) throw new ConsumerFailure('connection');
        seen.add(page.cursor);
        cursor = page.cursor;
    }
    throw new ConsumerFailure('unavailable');
};

/** Same complete-audience encryption/cache contract as web consent; only explicit choices
 * are materialized. Never turn a missing credential into a successful smaller selection. */
export const materializeSelections = async (
    wallet: ConsumerWallet,
    contract: ConsentFlowContractDetails,
    categories: Record<string, string[]>
): Promise<Record<string, string[]>> => {
    const recipients = getContractAudienceDids(contract);
    const audienceKey = `audience:${JSON.stringify(recipients)}`;
    const result: Record<string, string[]> = Object.create(null) as Record<string, string[]>;
    for (const [category, selected] of Object.entries(categories)) {
        const records = selected.length ? await categoryRecords(wallet, category) : [];
        result[category] = [];
        for (const uri of [...new Set(selected)]) {
            const record = records.find(x => x.uri === uri);
            if (!record) throw new ConsumerFailure('changed');
            const saved = record.sharedUris?.[audienceKey]?.at(-1);
            if (saved) {
                result[category].push(saved);
                continue;
            }
            const credential = await wallet.read.get(uri);
            if (!credential || typeof credential !== 'object') throw new ConsumerFailure('changed');
            const upload = wallet.store.LearnCloud.uploadEncrypted;
            if (!upload) throw new ConsumerFailure('unavailable');
            const shared = await upload(credential, { recipients });
            if (!shared) throw new ConsumerFailure('connection');
            record.sharedUris = { ...record.sharedUris, [audienceKey]: [shared] };
            await wallet.index.LearnCloud.update(record.id, { sharedUris: record.sharedUris });
            result[category].push(shared);
        }
    }
    return result;
};

/** Reflect effective category switches and expiry; cached URIs alone do not grant access. */
export const consentDisclosures = (terms: ConsentFlowTerms, now = Date.now()) => [
    ...Object.entries(terms.read.credentials.categories)
        .filter(
            ([, x]) =>
                terms.read.credentials.sharing !== false &&
                x.sharing === true &&
                (!x.shareUntil || Date.parse(x.shareUntil) > now)
        )
        .map(([key, x]) => ({
            id: `read:${key}`,
            direction: 'read',
            label: key,
            count: x.shared?.length ?? 0,
            detail: x.shareAll || terms.read.credentials.shareAll ? 'all' : 'selected',
        })),
    ...Object.entries(terms.read.personal).map(([key, value]) => ({
        id: `personal:${key}`,
        direction: 'personal',
        label: key,
        detail: value,
    })),
    ...Object.entries(terms.write.credentials.categories)
        .filter(([, x]) => x)
        .map(([key]) => ({
            id: `write:${key}`,
            direction: 'write',
            label: key,
        })),
    ...Object.entries(terms.write.personal)
        .filter(([, x]) => x)
        .map(([key]) => ({
            id: `writePersonal:${key}`,
            direction: 'writePersonal',
            label: key,
        })),
];

export const createConsumerCommands = (
    getWallet: () => ConsumerWallet | undefined,
    sampleContracts: Readonly<Record<string, string>> = {}
) => {
    const wallet = () => {
        const value = getWallet();
        if (!value) throw new ConsumerFailure('signIn');
        return value;
    };
    let sampleConsentBusy = false;
    const reviews = new Map<
        string,
        {
            listingID: string;
            contract: ConsentFlowContractDetails;
            choices: Map<string, Set<string>>;
            wallet: ConsumerWallet;
        }
    >();
    const listing = async (id: string) => {
        const found = await wallet().invoke.getPublicAppStoreListing(id);
        if (!found || found.app_listing_status !== 'LISTED')
            throw new ConsumerFailure('unavailable');
        return validateListing(found);
    };
    const reviewURI = async (id: string) =>
        Object.hasOwn(sampleContracts, id)
            ? sampleContracts[id]
            : configFor(await listing(id)).contractUri;
    const installed = async (id: string) => {
        const found = await listing(id);
        if (!(await wallet().invoke.isAppInstalled(id))) throw new ConsumerFailure('unavailable');
        return found;
    };
    const allTerms = async () => {
        let page = await wallet().invoke.getConsentedContracts({ limit: 50 });
        const records = [...page.records],
            seen = new Set<string>();
        while (page.hasMore) {
            if (!page.cursor || seen.has(page.cursor) || seen.size >= 100)
                throw new ConsumerFailure('connection');
            seen.add(page.cursor);
            page = await wallet().invoke.getConsentedContracts({ limit: 50, cursor: page.cursor });
            records.push(...page.records);
        }
        return records;
    };
    const liveTerms = async (uri: string) => {
        const terms = (await allTerms()).find(
            x =>
                x.contract.uri === uri &&
                x.status === 'live' &&
                (!x.expiresAt || Date.parse(x.expiresAt) > Date.now())
        );
        if (!terms) throw new ConsumerFailure('changed');
        return terms;
    };
    return {
        appsBrowse: async (raw: unknown) => {
            const input = pageInput.parse(raw),
                current = wallet();
            const page = await current.invoke.browseAppStore({
                category: input.category,
                cursor: input.cursor,
                limit: 50,
            });
            return {
                records: page.records.map(appDTO),
                hasMore: page.hasMore,
                cursor: page.cursor,
            };
        },
        appsInstalled: async (raw: unknown) => {
            const input = pageInput.omit({ category: true }).parse(raw),
                current = wallet();
            const page = await current.invoke.getInstalledApps({ cursor: input.cursor, limit: 50 });
            return {
                records: page.records.map(appDTO),
                hasMore: page.hasMore,
                cursor: page.cursor,
            };
        },
        appsInstall: async (raw: unknown) => {
            const { id } = idInput.parse(raw),
                app = await listing(id);
            if (!appDTO(app).launchable) throw new ConsumerFailure('unsupported');
            const uri = configFor(app).contractUri;
            if (uri) await liveTerms(uri);
            // Server-owned age/guardian gates remain authoritative; never synthesize approval.
            if (!(await wallet().invoke.isAppInstalled(id))) await wallet().invoke.installApp(id);
            return true;
        },
        appsRemove: async (raw: unknown) => {
            const { id } = idInput.parse(raw);
            if (await wallet().invoke.isAppInstalled(id)) await wallet().invoke.uninstallApp(id);
            return true;
        },
        appsReview: async (raw: unknown) => {
            const { id } = idInput.parse(raw),
                uri = await reviewURI(id);
            if (!uri) return null;
            const contract = ConsentFlowContractDetailsValidator.parse(
                await wallet().invoke.getContract(uri)
            );
            const blockReason =
                Object.hasOwn(sampleContracts, id) && !contract.autoBoosts?.length
                    ? 'unavailable'
                    : contract.needsGuardianConsent
                      ? 'guardian'
                      : contract.frontDoorBoostUri ||
                          contract.owner.profileId.includes('smart-resume')
                        ? 'unsupported'
                        : contract.expiresAt && Date.parse(contract.expiresAt) <= Date.now()
                          ? 'inactive'
                          : undefined;
            const choices = new Map<string, Set<string>>();
            const readCredentials = [];
            for (const [category, permission] of Object.entries(
                contract.contract.read.credentials.categories
            )) {
                const records = blockReason ? [] : await categoryRecords(wallet(), category);
                choices.set(category, new Set(records.map(x => x.uri)));
                readCredentials.push({
                    id: category,
                    required: permission.required,
                    choices: records.map(x => ({ id: x.uri, title: x.title || 'Credential' })),
                });
            }
            const permissions = (input: Record<string, { required: boolean }>) =>
                Object.entries(input).map(([key, value]) => ({
                    id: key,
                    required: value.required,
                    choices: [],
                }));
            const reviewID = crypto.randomUUID();
            if (reviews.size >= 20) reviews.delete(reviews.keys().next().value!);
            reviews.set(reviewID, { listingID: id, contract, choices, wallet: wallet() });
            return {
                id: reviewID,
                listingID: id,
                contractURI: uri,
                title: contract.name,
                description: contract.reasonForAccessing || contract.description,
                recipients: audienceDTO(contract),
                readCredentials,
                readPersonal: permissions(contract.contract.read.personal),
                writeCredentials: permissions(contract.contract.write.credentials.categories).map(
                    permission => ({
                        ...permission,
                        defaultEnabled:
                            Object.hasOwn(sampleContracts, id) &&
                            contract.contract.write.credentials.categories[permission.id]
                                ?.defaultEnabled === true,
                    })
                ),
                writePersonal: permissions(contract.contract.write.personal),
                // This slice preserves full signed contents; it cannot promise anonymous disclosure.
                allowsAnonymous: false,
                blockReason,
            };
        },
        appsConsent: async (raw: unknown) => {
            const input = decisionInput.parse(raw);
            const sample = Object.hasOwn(sampleContracts, input.listingID);
            if (sample && (sampleConsentBusy || input.writeCategories.length === 0))
                throw new ConsumerFailure('decision');
            if (sample) sampleConsentBusy = true;
            try {
                const saved = reviews.get(input.reviewID);
                if (!saved || saved.listingID !== input.listingID)
                    throw new ConsumerFailure('changed');
                if (saved.wallet !== wallet()) throw new ConsumerFailure('signIn');
                if ((await reviewURI(input.listingID)) !== saved.contract.uri)
                    throw new ConsumerFailure('changed');
                const fresh = ConsentFlowContractDetailsValidator.parse(
                    await wallet().invoke.getContract(saved.contract.uri)
                );
                if (contractFingerprint(fresh) !== contractFingerprint(saved.contract))
                    throw new ConsumerFailure('changed');
                if (fresh.needsGuardianConsent) throw new ConsumerFailure('guardian');
                if (fresh.frontDoorBoostUri || fresh.owner.profileId.includes('smart-resume'))
                    throw new ConsumerFailure('unsupported');
                if (fresh.expiresAt && Date.parse(fresh.expiresAt) <= Date.now())
                    throw new ConsumerFailure('inactive');
                const check = (
                    allowed: Record<string, { required: boolean }>,
                    enabled: string[]
                ) => {
                    if (
                        enabled.some(key => !Object.hasOwn(allowed, key)) ||
                        Object.entries(allowed).some(
                            ([key, value]) => value.required && !enabled.includes(key)
                        )
                    )
                        throw new ConsumerFailure('decision');
                };
                check(fresh.contract.read.credentials.categories, input.readCategories);
                check(fresh.contract.write.credentials.categories, input.writeCategories);
                check(fresh.contract.write.personal, input.writePersonal);
                const personal = Object.fromEntries(
                    Object.entries(input.personalValues).filter(([, value]) => value.trim())
                );
                check(fresh.contract.read.personal, Object.keys(personal));
                if (input.anonymize) throw new ConsumerFailure('unsupported');
                for (const [category, ids] of Object.entries(input.selectedCredentials)) {
                    if (
                        !input.readCategories.includes(category) ||
                        ids.some(id => !saved.choices.get(category)?.has(id))
                    )
                        throw new ConsumerFailure('decision');
                }
                const selected = Object.fromEntries(
                    input.readCategories.map(key => [key, input.selectedCredentials[key] ?? []])
                );
                const shared = await materializeSelections(wallet(), fresh, selected);
                // Recheck audience immediately before publication after potentially slow encryption.
                const beforeCommit = await wallet().invoke.getContract(fresh.uri);
                if (contractFingerprint(beforeCommit) !== contractFingerprint(fresh))
                    throw new ConsumerFailure('changed');
                if (beforeCommit.expiresAt && Date.parse(beforeCommit.expiresAt) <= Date.now())
                    throw new ConsumerFailure('inactive');
                const terms: ConsentFlowTerms = ConsentFlowTermsValidator.parse({
                    read: {
                        anonymize: input.anonymize,
                        credentials: {
                            shareAll: false,
                            categories: Object.fromEntries(
                                input.readCategories.map(key => [
                                    key,
                                    { sharing: true, shareAll: false, shared: shared[key] },
                                ])
                            ),
                        },
                        personal,
                    },
                    write: {
                        credentials: {
                            categories: Object.fromEntries(
                                input.writeCategories.map(key => [key, true])
                            ),
                        },
                        personal: Object.fromEntries(input.writePersonal.map(key => [key, true])),
                    },
                });
                if (saved.wallet !== wallet()) throw new ConsumerFailure('signIn');
                // Reconcile a lost sample-consent reply before retrying. Sync handles any missing records.
                if (Object.hasOwn(sampleContracts, input.listingID)) {
                    const existing = (await allTerms()).find(
                        x =>
                            x.contract.uri === fresh.uri &&
                            x.status === 'live' &&
                            (!x.expiresAt || Date.parse(x.expiresAt) > Date.now())
                    );
                    if (existing) {
                        if (JSON.stringify(existing.terms) !== JSON.stringify(terms))
                            throw new ConsumerFailure('changed');
                        reviews.delete(input.reviewID);
                        return true;
                    }
                }
                if (saved.wallet !== wallet()) throw new ConsumerFailure('signIn');
                await saved.wallet.invoke.consentToContract(fresh.uri, {
                    terms,
                    audienceVersion: fresh.audienceVersion ?? 0,
                });
                reviews.delete(input.reviewID);
                return true;
            } finally {
                if (sample) sampleConsentBusy = false;
            }
        },
        appsLaunch: async (raw: unknown) => {
            const { id } = idInput.parse(raw),
                app = await installed(id),
                config = configFor(app);
            let url = preferredURL(app);
            if (config.contractUri) {
                await liveTerms(config.contractUri);
                const contract = await wallet().invoke.getContract(config.contractUri);
                if (contract.needsGuardianConsent) throw new ConsumerFailure('guardian');
                if (contract.expiresAt && Date.parse(contract.expiresAt) <= Date.now())
                    throw new ConsumerFailure('inactive');
                url = httpsURL(config.redirectUri || contract.redirectUrl) || url;
                if (!url) throw new ConsumerFailure('unsupported');
                const credential = wallet().invoke.newCredential({
                    type: 'delegate',
                    subject: contract.owner.did,
                    access: ['read', 'write'],
                });
                credential.expirationDate = new Date(Date.now() + 5 * 60_000).toISOString();
                const signed = await wallet().invoke.issueCredential(credential);
                const presentation = await wallet().invoke.newPresentation(signed);
                const vp = await wallet().invoke.issuePresentation(
                    { ...presentation, contractUri: contract.uri },
                    { proofPurpose: 'authentication', proofFormat: 'jwt' }
                );
                if (typeof vp !== 'string') throw new ConsumerFailure('unavailable');
                url.searchParams.set('did', wallet().id.did());
                url.searchParams.set('vp', vp);
            }
            if (!url || app.launch_type === 'SERVER_HEADLESS')
                throw new ConsumerFailure('unsupported');
            return {
                id,
                title: app.display_name,
                url: url.href,
                embedded: app.launch_type === 'EMBEDDED_IFRAME' || app.launch_type === 'AI_TUTOR',
                contractURI: config.contractUri,
            };
        },
        appsIdentity: async (raw: unknown) => {
            const input = z
                .object({
                    id: fieldID,
                    origin: z.string().max(2048),
                    challenge: z.string().max(4096).optional(),
                })
                .strict()
                .parse(raw);
            const app = await installed(input.id),
                config = configFor(app);
            if (config.permissions && !config.permissions.includes('request_identity'))
                throw new ConsumerFailure('unsupported');
            const origins = [config.url, config.redirectUri, config.aiTutorUrl].flatMap(
                value => httpsURL(value)?.origin ?? []
            );
            if (config.contractUri)
                origins.push(
                    httpsURL((await wallet().invoke.getContract(config.contractUri)).redirectUrl)
                        ?.origin ?? ''
                );
            if (!origins.includes(input.origin)) throw new ConsumerFailure('decision');
            const token = await wallet().invoke.getDidAuthVp({
                proofFormat: 'jwt',
                domain: input.origin,
                challenge: input.challenge,
            });
            if (typeof token !== 'string') throw new ConsumerFailure('unavailable');
            const profile = await wallet().invoke.getProfile();
            return {
                token,
                user: {
                    did: wallet().id.did(),
                    profile: profile
                        ? {
                              profileId: profile.profileId,
                              displayName: profile.displayName,
                              image: profile.image,
                          }
                        : undefined,
                },
                expiresIn: 3600,
            };
        },
        appsEvent: async (raw: unknown) => {
            const input = z.object({ id: fieldID, event: AppEventValidator }).strict().parse(raw);
            await installed(input.id);
            // AI-session creation has its own future native workflow; never silently accept it.
            if (
                input.event.type === 'send-ai-session-credential' ||
                input.event.type === 'request-learner-context'
            )
                throw new ConsumerFailure('unsupported');
            return wallet().invoke.sendAppEvent(input.id, input.event);
        },
        privacySnapshot: async (raw: unknown) => {
            const input = z
                .object({
                    connectionsCursor: z.string().optional(),
                    linksCursor: z.string().optional(),
                    more: z.boolean().default(false),
                })
                .strict()
                .parse(raw);
            const current = wallet();
            const contracts =
                !input.more || input.connectionsCursor
                    ? await current.invoke.getConsentedContracts({
                          limit: 25,
                          cursor: input.connectionsCursor,
                      })
                    : undefined;
            const links =
                !input.more || input.linksCursor
                    ? await current.invoke.listShareLinks({ limit: 25, cursor: input.linksCursor })
                    : undefined;
            return {
                connections: (contracts?.records ?? []).map(record => ({
                    id: record.uri,
                    contractURI: record.contract.uri,
                    title: record.contract.name,
                    imageURL: httpsURL(record.contract.image)?.href,
                    status: record.status,
                    recipients: audienceDTO(record.contract),
                    expiresAt: record.expiresAt,
                    disclosures: consentDisclosures(record.terms),
                })),
                links: (links?.records ?? []).map(x => ({
                    id: x.id,
                    title: x.title,
                    selectedCount: x.selectedCount,
                    version: x.version,
                    status: x.status,
                    contentState: x.contentState,
                    createdAt: x.createdAt,
                    expiresAt: x.expiresAt,
                    passcodeProtected: x.passcodeProtected,
                })),
                connectionsCursor: contracts?.cursor,
                linksCursor: links?.cursor,
                hasMoreConnections: contracts?.hasMore ?? false,
                hasMoreLinks: links?.hasMore ?? false,
            };
        },
        privacyWithdraw: async (raw: unknown) => {
            const { id } = idInput.parse(raw);
            if (!(await allTerms()).some(x => x.uri === id)) throw new ConsumerFailure('decision');
            await wallet().invoke.withdrawConsent(id);
            return true;
        },
        privacyStopLink: async (raw: unknown) => {
            const input = z
                .object({ id: fieldID, version: z.number().int().positive() })
                .strict()
                .parse(raw);
            const result = await wallet().invoke.revokeShareLink({
                id: input.id,
                expectedVersion: input.version,
                clientRequestId: crypto.randomUUID(),
            });
            const outcome = classifySharePublication(result);
            return {
                complete: outcome.status === 'inactive' && outcome.share.status === 'stopped',
            };
        },
        privacyLinkURL: async (raw: unknown) => {
            const { id } = idInput.parse(raw),
                current = wallet(),
                result = await current.invoke.getShareLink(id);
            if (result.status !== 'found') throw new ConsumerFailure('inactive');
            const share = result.share;
            if (
                share.status !== 'active' ||
                share.contentState !== 'finalized' ||
                (share.expiresAt && Date.parse(share.expiresAt) <= Date.now())
            )
                throw new ConsumerFailure('inactive');
            const recovery = await readShareRecovery(shareWallet(current), share);
            return {
                url: buildAppShareLinkUrl('https://staging.learncard.app', id, recovery.latest.key),
            };
        },
    };
};
