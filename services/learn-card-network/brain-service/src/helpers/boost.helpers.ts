import cloneDeep from 'lodash/cloneDeep';
import { isVC2Format } from '@learncard/helpers';
import { TRPCError } from '@trpc/server';
import {
    VC,
    JWE,
    UnsignedVC,
    LCNNotificationTypeEnumValidator,
    ContactMethodQueryType,
} from '@learncard/types';
import { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import {
    CredentialIssuer,
    getIssuerDisplayName,
    getIssuerOwnerProfile,
    getIssuerProfileId,
} from '../types/issuer';
import { trace, traceDb } from '@tracing';
import { injectObv3AlignmentsIntoCredentialForBoost } from '@services/skills-provider/inject';
import {
    renderBoostTemplate,
    parseRenderedTemplate,
    shouldAutoAppendTemplateEvidence,
} from '@helpers/template.helpers';

import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { BoostInstance } from '@models';
import { constructUri } from './uri.helpers';
import { storeCredential } from '@accesslayer/credential/create';
import { createBoostInstanceOfRelationship } from '@accesslayer/boost/relationships/create';
import {
    createSentCredentialRelationship,
    createCredentialIssuedViaContractRelationship,
    createListingSentCredentialRelationship,
} from '@accesslayer/credential/relationships/create';
import { acceptCredential, getCredentialUri } from './credential.helpers';
import { issueCredentialWithSigningAuthority } from './signingAuthority.helpers';
import { addNotificationToQueue } from './notifications.helpers';
import { getNotificationMessage } from './notificationMessages';
import { resolveRecipientLocale } from './getRecipientLocale.helpers';
import { BoostStatus, getBoostOwnerProfile } from 'types/boost';
import { getDidWeb } from './did.helpers';
import { DbTermsType } from 'types/consentflowcontract';
import { appendBitstringStatusListEntries } from './status-list.helpers';

export const getBoostUri = (id: string, domain: string): string =>
    constructUri('boost', id, domain);

export const isProfileBoostOwner = async (
    profile: ProfileType,
    boost: BoostInstance
): Promise<boolean> => {
    const owner = await getBoostOwner(boost);

    if (!owner) return false;

    const ownerProfile = getBoostOwnerProfile(owner);
    return ownerProfile.profileId === profile.profileId;
};

export const isDraftBoost = (boost: BoostInstance): boolean => {
    return boost.status === BoostStatus.enum.DRAFT;
};

export const isProvisionalBoost = (boost: BoostInstance): boolean => {
    return boost.status === BoostStatus.enum.PROVISIONAL;
};

export const isEditableBoost = (boost: BoostInstance): boolean => {
    return isDraftBoost(boost) || isProvisionalBoost(boost);
};

/**
 * Public claim-link visibility is controlled by defaultPermissions.canView.
 * If unset (legacy records), treat as viewable.
 */
export const isBoostViewableByClaimLink = async (boost: BoostInstance): Promise<boolean> => {
    const defaultRoles = await boost.findRelationships({ alias: 'defaultRole' });
    const defaultRole = defaultRoles[0]?.target as any;
    const canView = defaultRole?.canView ?? defaultRole?.dataValues?.canView;

    if (typeof canView === 'boolean') return canView;

    return true;
};

export const convertCredentialToBoostTemplateJSON = (
    credential: VC | UnsignedVC,
    defaultIssuerDid?: string
): string => {
    const template = cloneDeep(credential);

    delete template.proof;
    template.issuer = defaultIssuerDid ?? 'did:example:123';

    if (Array.isArray(template.credentialSubject)) {
        template.credentialSubject = template.credentialSubject.map(subject => {
            subject.id = 'did:example:123';

            return subject;
        });
    } else {
        template.credentialSubject.id = 'did:example:123';
    }
    return JSON.stringify(template);
};

export const sendBoost = async ({
    from,
    to,
    boost,
    credential,
    domain,
    skipNotification = false,
    autoAcceptCredential = false,
    contractTerms,
    metadata,
    activityId,
    integrationId,
    listingId,
}: {
    from: CredentialIssuer;
    to: ProfileType;
    boost: BoostInstance;
    credential: VC | JWE;
    domain: string;
    skipNotification?: boolean;
    autoAcceptCredential?: boolean;
    contractTerms?: DbTermsType;
    metadata?: Record<string, unknown>;
    activityId?: string;
    integrationId?: string;
    listingId?: string;
}): Promise<string> => {
    return trace(
        'boost',
        'sendBoost',
        async () => {
            const sourceBoostUri = getBoostUri(boost.dataValues.id, domain);
            const fromProfile = getIssuerOwnerProfile(from);

            // Preserve the issuer's payload without decrypting or counter-signing it.
            const credentialInstance = await traceDb('storeCredential', () =>
                storeCredential(credential)
            );

            const tasks = [
                createBoostInstanceOfRelationship(credentialInstance, boost),
                createSentCredentialRelationship(
                    from,
                    to,
                    credentialInstance,
                    metadata,
                    activityId,
                    integrationId
                ),
            ];

            if (listingId) {
                tasks.push(
                    createListingSentCredentialRelationship(
                        listingId,
                        to,
                        credentialInstance,
                        metadata,
                        activityId,
                        integrationId
                    )
                );
            }

            if (contractTerms) {
                tasks.push(
                    createCredentialIssuedViaContractRelationship(credentialInstance, contractTerms)
                );
            }

            await traceDb('createRelationships', () => Promise.all(tasks));

            if (autoAcceptCredential) {
                await acceptCredential(to, getCredentialUri(credentialInstance.id, domain), {
                    skipNotification,
                });
            }

            const boostUri = getCredentialUri(credentialInstance.id, domain);

            if (typeof boostUri === 'string') {
                if (!skipNotification) {
                    // LC-1644: fire-and-forget the BOOST_RECEIVED notification enqueue.
                    // addNotificationToQueue is an SQS SendMessage in prod (~5-30ms) or a
                    // direct webhook call in offline/dev. Neither produces a value the caller
                    // needs, and notifications are eventually-consistent by design — there's
                    // no correctness benefit to making sendBoost wait on the enqueue ack.
                    // Any enqueue failure is logged so operators still have visibility;
                    // the original boostUri return path is unaffected.
                    trace('notification', 'addNotificationToQueue', () =>
                        addNotificationToQueue({
                            type: LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
                            to: to,
                            from: fromProfile,
                            message: getNotificationMessage(
                                'boostReceived',
                                resolveRecipientLocale(to),
                                { issuer: getIssuerDisplayName(from) }
                            ),
                            data: {
                                vcUris: [boostUri!],
                                metadata: {
                                    ...(metadata ?? {}),
                                    boostUri: sourceBoostUri,
                                },
                            },
                        })
                    ).catch((err: unknown) => {
                        console.error('[sendBoost] BOOST_RECEIVED notification enqueue failed', {
                            err: err instanceof Error ? err.message : String(err),
                            from: getIssuerProfileId(from),
                            to: to.profileId,
                            boostUri,
                        });
                    });
                }

                return boostUri;
            } else {
                throw new Error('Error sending boost.');
            }
        },
        { from: getIssuerProfileId(from), to: to.profileId }
    );
};

export const issueClaimLinkBoost = async (
    boost: BoostInstance,
    domain: string,
    from: CredentialIssuer,
    to: ProfileType,
    signingAuthorityForUser: SigningAuthorityForUserType
): Promise<string> => {
    const boostCredential = JSON.parse(boost.dataValues?.boost) as UnsignedVC | VC;
    const boostId = boost?.dataValues?.id;
    const boostURI = getBoostUri(boostId, domain);
    const fromProfile = getIssuerOwnerProfile(from);

    boostCredential.issuer = signingAuthorityForUser.relationship.did;

    if (Array.isArray(boostCredential.credentialSubject)) {
        boostCredential.credentialSubject = boostCredential.credentialSubject.map(subject => ({
            ...subject,
            id: subject.did,
        }));
    } else {
        boostCredential.credentialSubject.id = getDidWeb(domain, to.profileId);
    }

    // Embed the boostURI into the boost credential for verification purposes.
    if (boostCredential?.type?.includes('BoostCredential')) {
        boostCredential.boostId = boostURI;
    }

    // Inject OBv3 skill alignments based on boost's framework/skills
    await injectObv3AlignmentsIntoCredentialForBoost(boostCredential, boost, domain);

    const vc = await issueCredentialWithSigningAuthority(
        from,
        await appendBitstringStatusListEntries(boostCredential, fromProfile.profileId, domain),
        signingAuthorityForUser,
        domain,
        true
    );

    return sendBoost({
        from,
        to,
        boost,
        credential: vc,
        domain,
        skipNotification: true,
        autoAcceptCredential: true,
    });
};

/**
 * Helper to detect if a recipient string is an email or phone number (for inbox routing)
 */
export const isInboxRecipient = (recipient: string): ContactMethodQueryType | null => {
    // Email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
        return { type: 'email', value: recipient };
    }

    // Phone pattern (starts with + followed by digits, or just digits with optional dashes/spaces)
    if (/^\+?[\d\s-]{10,}$/.test(recipient.replace(/[\s-]/g, ''))) {
        return { type: 'phone', value: recipient };
    }

    return null;
};

/**
 * Prepares an unsigned credential from a boost template.
 * Handles templateData rendering, issuance date, boostId injection, and OBv3 alignments.
 */
export const prepareCredentialFromBoost = async (
    boost: BoostInstance,
    boostUri: string,
    domain: string,
    options: {
        templateData?: Record<string, unknown>;
        recipientDid?: string;
        recipientName?: string;
        issuerDid?: string;
    } = {}
): Promise<UnsignedVC> => {
    const { templateData, recipientDid, recipientName, issuerDid } = options;

    let boostJsonString = boost.dataValues.boost;
    const allowAutoAppendEvidence = shouldAutoAppendTemplateEvidence(boostJsonString);

    // Auto-inject known system variables into templateData
    const autoData: Record<string, unknown> = {};
    if (recipientName) autoData.recipient_name = recipientName;

    const mergedTemplateData = { ...autoData, ...templateData };

    if (Object.keys(mergedTemplateData).length > 0) {
        boostJsonString = renderBoostTemplate(boostJsonString, mergedTemplateData);
    }

    const credential = parseRenderedTemplate<UnsignedVC>(boostJsonString);

    appendTemplateEvidenceToCredential(credential, mergedTemplateData, allowAutoAppendEvidence);

    // Set issuance date based on VC version
    const now = new Date().toISOString();
    if (isVC2Format(credential)) {
        credential.validFrom = now;
    } else {
        credential.issuanceDate = now;
    }

    // Set issuer if provided
    if (issuerDid) {
        credential.issuer = issuerDid;
    }

    // Set recipient DID in credentialSubject if provided
    if (recipientDid) {
        if (Array.isArray(credential.credentialSubject)) {
            credential.credentialSubject = credential.credentialSubject.map(subject => ({
                ...subject,
                id: recipientDid,
            }));
        } else {
            credential.credentialSubject = {
                ...(credential.credentialSubject || {}),
                id: recipientDid,
            };
        }
    }

    // Embed boostId for BoostCredential types
    if (credential?.type?.includes('BoostCredential')) {
        (credential as Record<string, unknown>).boostId = boostUri;
    }

    // Inject OBv3 alignments
    await injectObv3AlignmentsIntoCredentialForBoost(credential, boost, domain);

    return credential;
};

/**
 * Merges `evidence` entries from `templateData` onto a credential's top-level
 * `evidence` array, in-place.
 *
 * Why this exists: not every boost template opts into rendering evidence via
 * a `{{evidence}}` / `{{#evidence}}...{{/evidence}}` section. For those
 * templates we still want evidence supplied at send-time (e.g. a
 * recipient-specific media attachment from the issuer UI) to land on the
 * final credential — this helper is the post-render append step that makes
 * that happen.
 *
 * Callers should pair this with `shouldAutoAppendTemplateEvidence` from
 * `@helpers/template.helpers`:
 *   - If the boost JSON already references `{{evidence}}`, pass
 *     `allowAutoAppend = false` so we don't duplicate what the template
 *     already rendered.
 *   - Otherwise pass `true` and this helper will append.
 *
 * Normalization details:
 *   - `templateData.evidence` may be a single object or an array; both are
 *     coerced to an array.
 *   - Any `last` field on an evidence item is stripped — it's a rendering
 *     hint used by Mustache iteration (`{{#last}}`) and must not leak onto
 *     the credential.
 *   - Existing `credential.evidence` (single object or array) is preserved
 *     and the new entries are appended after it.
 *
 * NOTE: This function mutates `credential.evidence` in place (and also
 * returns the same reference for chaining convenience).
 *
 * @param credential      The unsigned VC produced by parsing the rendered boost
 * @param templateData    The same template data used for rendering; may carry `evidence`
 * @param allowAutoAppend `false` when the template already renders evidence itself
 * @returns               The (possibly-mutated) credential reference
 */
export const appendTemplateEvidenceToCredential = (
    credential: UnsignedVC,
    templateData?: Record<string, unknown>,
    allowAutoAppend: boolean = true
): UnsignedVC => {
    // Template author is handling evidence themselves — leave the credential alone.
    if (!allowAutoAppend) return credential;

    const templateEvidence = templateData?.evidence;

    // Nothing to append.
    if (!templateEvidence) return credential;

    // Accept either a single evidence object or an array of them, and strip
    // the `last` marker used upstream for Mustache iteration hints — it has
    // no meaning on the final credential.
    const normalizedTemplateEvidence = (
        Array.isArray(templateEvidence) ? templateEvidence : [templateEvidence]
    ).map(evidenceItem => {
        if (evidenceItem && typeof evidenceItem === 'object' && 'last' in evidenceItem) {
            const { last, ...rest } = evidenceItem as Record<string, unknown>;

            return rest;
        }

        return evidenceItem;
    });

    // An empty array (or an array that was all-falsy after normalization)
    // shouldn't clobber existing evidence.
    if (normalizedTemplateEvidence.length === 0) return credential;

    // Refuse to append onto a boost whose @context can't expand the
    // EvidenceFile subterms — otherwise the signer fails later with an opaque
    // JSON-LD key-expansion error. Surface a clear message instead so the
    // caller can prompt the user to republish the boost.
    if (!credentialContextSupportsDynamicEvidence(credential)) {
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message:
                'This boost was created before per-recipient evidence was supported. Republish the boost against the latest boost context (>= 1.0.3) to enable recipient attachments.',
        });
    }

    // Preserve any evidence that was already baked into the credential by
    // the template, coercing a single-object shape to an array so we can spread.
    const existingEvidence = credential.evidence
        ? Array.isArray(credential.evidence)
            ? credential.evidence
            : [credential.evidence]
        : [];

    credential.evidence = [...existingEvidence, ...normalizedTemplateEvidence];

    return credential;
};

/**
 * Returns true when the credential's `@context` array references a boost
 * context that defines `EvidenceFile`/`fileName`/`fileType`/`fileSize`
 * (LearnCard boost context 1.0.3 or newer), or already has those terms
 * defined inline. Used as a precondition for auto-appending the dynamic
 * `EvidenceFile` shape produced by `convertAttachmentsToEvidence`.
 */
const credentialContextSupportsDynamicEvidence = (credential: UnsignedVC): boolean => {
    const ctx = (credential as Record<string, unknown>)['@context'];
    const entries = Array.isArray(ctx) ? ctx : ctx ? [ctx] : [];

    return entries.some(entry => {
        if (typeof entry === 'string') {
            return /\/ctx\.learncard\.com\/boosts\/1\.(?:(?:0\.(?:[3-9]|\d{2,}))|(?:[1-9]\d*\.\d+))/.test(
                entry
            );
        }
        if (entry && typeof entry === 'object') {
            return 'EvidenceFile' in (entry as Record<string, unknown>);
        }
        return false;
    });
};

/**
 * Resolves a boost from a URI and validates it exists.
 * Throws TRPCError if not found.
 */
export const resolveBoostByUri = async (boostUri: string): Promise<BoostInstance> => {
    const { TRPCError } = await import('@trpc/server');
    const { getBoostByUri } = await import('@accesslayer/boost/read');

    const boost = await getBoostByUri(boostUri);

    if (!boost) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Could not find boost',
        });
    }

    return boost;
};
