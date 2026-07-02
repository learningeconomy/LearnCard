import base64url from 'base64url';
import { v4 as uuidv4 } from 'uuid';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { getDefaultCategoryForCredential } from 'learn-card-base';
import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';
import { RecipientMode, Recipient, LinkOptions } from '../../pages/issue/components/recipientTypes';

import {
    OBv3CredentialTemplate,
    staticField,
    systemField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
} from '../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import {
    templateToJson,
    validateTemplate,
} from '../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';

/**
 * SimpleSend builds standards-pure OBv3 credentials and deliberately bypasses
 * the boost pipeline (`newCredential({ type: 'boost' })` / `createBoost`),
 * which injects the custom `https://ctx.learncard.com/boosts/*` context. Only
 * the client-constructed credential is guaranteed pure — `send()` may still
 * create a boost server-side for delivery, which is accepted for this prototype.
 */

export type SimpleCredentialType =
    | 'badge'
    | 'certificate'
    | 'course'
    | 'skill'
    | 'license'
    | 'membership'
    | 'micro-credential';

const ACHIEVEMENT_TYPE_BY_SIMPLE_TYPE: Record<SimpleCredentialType, string> = {
    badge: 'Badge',
    certificate: 'Certificate',
    course: 'Course',
    skill: 'Competency',
    membership: 'Membership',
    license: 'License',
    'micro-credential': 'MicroCredential',
};

export interface SimpleSendInput {
    credentialType: SimpleCredentialType;
    name: string;
    description: string;
    criteriaNarrative?: string;
    issuerName?: string;
    imageUrl?: string;
}

export const isEmailRecipient = (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const buildSimpleTemplate = (input: SimpleSendInput): OBv3CredentialTemplate => {
    const achievementType = ACHIEVEMENT_TYPE_BY_SIMPLE_TYPE[input.credentialType];

    return {
        schemaType: 'obv3',
        contexts: DEFAULT_CONTEXTS,
        types: DEFAULT_TYPES,
        name: staticField(input.name),
        issuer: {
            id: systemField('issuer_did'),
            name: input.issuerName ? staticField(input.issuerName) : staticField(''),
        },
        credentialSubject: {
            id: systemField('recipient_did'),
            achievement: {
                name: staticField(input.name),
                description: staticField(input.description),
                achievementType: staticField(achievementType),
                ...(input.imageUrl ? { image: staticField(input.imageUrl) } : {}),
                criteria: {
                    narrative: staticField(input.criteriaNarrative ?? ''),
                },
            },
        },
        validFrom: systemField('issue_date'),
        customFields: [],
    };
};

export const fillTemplateSystemVars = (
    template: OBv3CredentialTemplate,
    issuerDid: string,
    recipientDid?: string,
    variableValues?: Record<string, string>
): Record<string, unknown> => {
    const json = templateToJson(template);
    const now = new Date().toISOString();
    const replacements: Record<string, string> = {
        ...(variableValues ?? {}),
        issuer_did: issuerDid,
        issue_date: now,
        ...(recipientDid ? { recipient_did: recipientDid } : {}),
    };

    const replaceSystemVars = (obj: unknown): unknown => {
        if (typeof obj === 'string') {
            return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
                varName in replacements ? replacements[varName] : match
            );
        }
        if (Array.isArray(obj)) return obj.map(replaceSystemVars);
        if (obj && typeof obj === 'object') {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, replaceSystemVars(v)])
            );
        }
        return obj;
    };

    const filled = replaceSystemVars(json) as Record<string, unknown>;
    const subject = filled.credentialSubject as Record<string, unknown> | undefined;
    if (!recipientDid && subject && typeof subject.id === 'string' && subject.id.includes('{{')) {
        delete subject.id;
    }
    return filled;
};

export interface IssueViaBoostOptions {
    mode: RecipientMode;
    recipients: Recipient[];
    linkOptions: LinkOptions;
    currentLCNUser?: { profileId?: string; did?: string };
    claimLinkSA?: { name?: string; endpoint?: string };
    variableValues?: Record<string, string>;
    variableValuesByRecipient?: Record<string, Record<string, unknown>>;
}

export interface IssueViaBoostResult {
    credentialUri: string;
    claimLink?: string;
}

const deliverBoost = async (
    wallet: BespokeLearnCard,
    boostUri: string,
    options: IssueViaBoostOptions,
    signedCredential?: Record<string, unknown>
): Promise<IssueViaBoostResult> => {
    let claimLink: string | undefined;

    const templateData =
        options.variableValues && Object.keys(options.variableValues).length > 0
            ? options.variableValues
            : undefined;

    if (options.mode === 'self') {
        const ownProfileIdOrDid = options.currentLCNUser?.profileId || wallet.id.did();
        const response = await wallet.invoke.send({
            type: 'boost',
            recipient: ownProfileIdOrDid,
            templateUri: boostUri,
            ...(templateData ? { templateData } : {}),
        });

        // `send` returns `credentialUri` (the issued credential) and `uri` (the boost
        // template). acceptCredential requires the credential URI — passing the boost
        // URI throws "Not a credential URI".
        const sentCredentialUri = response.credentialUri ?? response.uri;

        if (sentCredentialUri) {
            await wallet.invoke.acceptCredential(sentCredentialUri);
            if (wallet.store?.LearnCloud?.uploadEncrypted) {
                const credential =
                    signedCredential ??
                    ((await wallet.read.get(sentCredentialUri).catch(() => undefined)) as
                        | Record<string, unknown>
                        | undefined);
                if (credential) {
                    const indexUri = await wallet.store.LearnCloud.uploadEncrypted(credential);
                    if (indexUri) {
                        const category =
                            getDefaultCategoryForCredential(credential as any) || 'Achievement';
                        await wallet.index.LearnCloud.add({
                            id: uuidv4(),
                            uri: indexUri,
                            category,
                        });
                    }
                }
            }
        }
    } else if (options.mode === 'people') {
        for (const recipient of options.recipients) {
            const recipientIdentifier =
                recipient.kind === 'profile' ? recipient.profileId : recipient.email;
            const recipientData =
                options.variableValuesByRecipient?.[recipientIdentifier] ?? templateData;
            await wallet.invoke.send({
                type: 'boost',
                recipient: recipientIdentifier,
                templateUri: boostUri,
                ...(recipientData && Object.keys(recipientData).length > 0
                    ? { templateData: recipientData }
                    : {}),
            });
        }
    } else if (options.mode === 'link') {
        if (!options.claimLinkSA || !options.claimLinkSA.name || !options.claimLinkSA.endpoint) {
            throw new Error(
                "Couldn't set up a shareable link — no signing authority is configured."
            );
        }

        let ttlSeconds: number | undefined;
        if (options.linkOptions.expiresAt) {
            ttlSeconds = Math.floor(
                (new Date(options.linkOptions.expiresAt).getTime() - Date.now()) / 1000
            );
        }

        const claimLinkResponse = await wallet.invoke.generateClaimLink(
            boostUri,
            { name: options.claimLinkSA.name, endpoint: options.claimLinkSA.endpoint },
            { ttlSeconds, totalUses: options.linkOptions.maxClaims }
        );

        claimLink = `${getAppBaseUrl()}/interactions/claim/${base64url.encode(
            JSON.stringify({
                boostUri: claimLinkResponse.boostUri,
                challenge: claimLinkResponse.challenge,
            })
        )}?iuv=1`;
    }

    return { credentialUri: boostUri, claimLink };
};

const deepReplaceVariables = (json: unknown, replacements: Record<string, string>): unknown => {
    if (typeof json === 'string') {
        return json.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
            varName in replacements ? replacements[varName] : match
        );
    }
    if (Array.isArray(json)) return json.map(v => deepReplaceVariables(v, replacements));
    if (json && typeof json === 'object') {
        return Object.fromEntries(
            Object.entries(json).map(([k, v]) => [k, deepReplaceVariables(v, replacements)])
        );
    }
    return json;
};

const stripUnresolvedRecipientId = (credential: Record<string, unknown>): void => {
    const subject = credential.credentialSubject;
    const clear = (s: unknown): void => {
        if (s && typeof s === 'object' && !Array.isArray(s)) {
            const obj = s as Record<string, unknown>;
            if (typeof obj.id === 'string' && obj.id.includes('{{')) delete obj.id;
        }
    };
    if (Array.isArray(subject)) subject.forEach(clear);
    else clear(subject);
};

/**
 * Build a reusable, unsigned boost template that keeps its custom `{{variables}}`
 * intact. Only the issuer is resolved; recipient id and dates are removed so the
 * network fills them per-issuance — substitution + signing happen at send time
 * via `templateData`, keeping the stored boost a genuine reusable template.
 */
const buildReusableBoostTemplate = (
    template: OBv3CredentialTemplate,
    issuerDid: string
): Record<string, unknown> => {
    const credential = deepReplaceVariables(templateToJson(template), {
        issuer_did: issuerDid,
    }) as Record<string, unknown>;

    stripUnresolvedRecipientId(credential);
    delete credential.validFrom;
    delete credential.issuanceDate;

    return credential;
};

export const issueViaBoost = async (
    wallet: BespokeLearnCard,
    template: OBv3CredentialTemplate,
    options: IssueViaBoostOptions
): Promise<IssueViaBoostResult> => {
    const issuerDid = wallet.id.did();
    if (!issuerDid) throw new Error('No issuer DID available — is the wallet initialized?');

    const structuralErrors = validateTemplate(template);
    if (structuralErrors.length > 0) {
        throw new Error(structuralErrors.map(e => `${e.field}: ${e.message}`).join('; '));
    }

    const name = template.name?.value || template.credentialSubject?.achievement?.name?.value || '';

    // A template needs send-time templating if custom placeholders survive once
    // system fields are resolved, OR if any templateData (e.g. per-recipient
    // evidence) must be applied. Either way it must NOT be pre-signed: substitution
    // has to happen before signing, which the network does from an unsigned template.
    const reusableTemplate = buildReusableBoostTemplate(template, issuerDid);
    const hasDynamicPlaceholders = /\{\{.*?\}\}/.test(JSON.stringify(reusableTemplate));
    const hasTemplateData =
        (options.variableValues && Object.keys(options.variableValues).length > 0) ||
        Object.values(options.variableValuesByRecipient ?? {}).some(
            data => Object.keys(data).length > 0
        );
    const needsTemplating = hasDynamicPlaceholders || hasTemplateData;

    if (!needsTemplating) {
        const unsigned = fillTemplateSystemVars(
            template,
            issuerDid,
            undefined,
            options.variableValues
        );
        const signedCredential = (await wallet.invoke.issueCredential(unsigned as any)) as Record<
            string,
            unknown
        >;
        const category = getDefaultCategoryForCredential(signedCredential as any) || 'Achievement';
        const boostUri = await wallet.invoke.createBoost(signedCredential, { name, category });
        return deliverBoost(wallet, boostUri, options, signedCredential);
    }

    const category = getDefaultCategoryForCredential(reusableTemplate as any) || 'Achievement';

    // Claim links can't substitute templateData at claim time, so a dynamic link
    // is issued from a one-off boost with the values already baked in.
    if (options.mode === 'link') {
        const oneOff = fillTemplateSystemVars(
            template,
            issuerDid,
            undefined,
            options.variableValues
        );
        stripUnresolvedRecipientId(oneOff);
        const boostUri = await wallet.invoke.createBoost(oneOff, { name, category });
        return deliverBoost(wallet, boostUri, { ...options, variableValues: undefined });
    }

    const boostUri = await wallet.invoke.createBoost(reusableTemplate, { name, category });
    return deliverBoost(wallet, boostUri, options);
};

/**
 * Send an existing boost (one the user already administers) to recipients
 * without re-creating it — `send` accepts the existing boost URI as templateUri.
 */
export const sendExistingBoost = async (
    wallet: BespokeLearnCard,
    boostUri: string,
    options: IssueViaBoostOptions
): Promise<IssueViaBoostResult> => {
    if (!wallet.id.did()) throw new Error('No issuer DID available — is the wallet initialized?');
    return deliverBoost(wallet, boostUri, options);
};
