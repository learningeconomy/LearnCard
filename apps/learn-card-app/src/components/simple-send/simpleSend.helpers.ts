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
    recipientDid?: string
): Record<string, unknown> => {
    const json = templateToJson(template);
    const now = new Date().toISOString();
    const replacements: Record<string, string> = {
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

    if (options.mode === 'self') {
        const ownProfileIdOrDid = options.currentLCNUser?.profileId || wallet.id.did();
        const response = await wallet.invoke.send({
            type: 'boost',
            recipient: ownProfileIdOrDid,
            templateUri: boostUri,
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
            await wallet.invoke.send({
                type: 'boost',
                recipient: recipientIdentifier,
                templateUri: boostUri,
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

    const unsigned = fillTemplateSystemVars(template, issuerDid);
    const signedCredential = (await wallet.invoke.issueCredential(unsigned as any)) as Record<
        string,
        unknown
    >;

    const name = template.name?.value || template.credentialSubject?.achievement?.name?.value || '';
    const category = getDefaultCategoryForCredential(signedCredential as any) || 'Achievement';

    const boostUri = await wallet.invoke.createBoost(signedCredential, { name, category });

    return deliverBoost(wallet, boostUri, options, signedCredential);
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
