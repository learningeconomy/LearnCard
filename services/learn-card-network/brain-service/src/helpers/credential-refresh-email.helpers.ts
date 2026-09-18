import type { BoostInstance } from '@models';
import { getBoostById } from '@accesslayer/boost/read';
import { getContactMethodsForProfile } from '@accesslayer/contact-method/read';
import {
    claimCredentialRefreshEmailDelivery,
    finalizeCredentialRefreshEmailDelivery,
    getCredentialRefresh,
} from '@accesslayer/credential-refresh';
import { getProfilesThatManageAProfile } from '@accesslayer/profile/relationships/read';
import type { TenantBranding } from '@learncard/email-templates';

import type { CredentialRefreshVersionNode } from 'types/credential-refresh';
import type { ProfileType } from 'types/profile';

import { ensureCredentialRefreshConstraints } from '../models/credential-refresh-constraints';
import { getDeliveryService } from '@services/delivery/delivery.factory';
import {
    buildCredentialUpdatedEmailModel,
    chooseCredentialRefreshEmailTarget,
    extractBoundedCredentialDisplayTitle,
    type CredentialRefreshEmailContactMethod,
    type CredentialRefreshEmailManager,
    type CredentialRefreshEmailTarget,
} from './credential-refresh-email-content.helpers';
import { computeCredentialRefreshDeliveryKey } from './credential-refresh-materiality.helpers';
import { resolveRecipientLocale } from './getRecipientLocale.helpers';

/**
 * Managed credential-refresh update email (LC-2198).
 *
 * Runs independently of the durable in-app/push notification: an email failure
 * never changes the publication result and never re-enqueues the push event. The
 * email carries only the minimal context the user approved — issuer display name
 * and a bounded credential display title — and routes to a verified email of the
 * bound holder (or a verified guardian when the holder is managed).
 *
 * Delivery is at-most-once per configured delivery window, backed by a unique
 * `CredentialRefreshEmailDelivery` node (see the access layer). A send that fails
 * after the claim is recorded as `failed`; it is not retried inside the same
 * window. A later material update in a new window produces a new claim and is the
 * retry boundary. The window claim is intentionally attempted even when the in-app
 * notification was already delivered, so the two channels do not share failure.
 */

export type CredentialRefreshEmailDeliveryOutcome =
    'sent' | 'duplicate-window' | 'skipped-no-recipient' | 'failed';

/** Resolves the verified email target for the bound holder. Never caller-supplied. */
export const resolveCredentialRefreshEmailTarget = async (
    holderProfile: ProfileType
): Promise<CredentialRefreshEmailTarget> => {
    const managers = await getProfilesThatManageAProfile(holderProfile.profileId);

    if (managers.length > 0) {
        const managerContacts: CredentialRefreshEmailManager[] = await Promise.all(
            managers.map(async manager => ({
                locale: manager.locale,
                contactMethods: (await getContactMethodsForProfile(
                    manager.did
                )) as CredentialRefreshEmailContactMethod[],
            }))
        );

        // Managed holder: only verified guardian emails are eligible. The child's
        // own address is deliberately not resolved, so it can never be emailed.
        return chooseCredentialRefreshEmailTarget({
            holder: { locale: holderProfile.locale },
            holderContactMethods: [],
            managers: managerContacts,
        });
    }

    const holderContactMethods = (await getContactMethodsForProfile(
        holderProfile.did
    )) as CredentialRefreshEmailContactMethod[];

    return chooseCredentialRefreshEmailTarget({
        holder: { locale: holderProfile.locale },
        holderContactMethods,
        managers: [],
    });
};

/**
 * Resolves the bounded email-only title: the persisted publish-input title first,
 * then the aggregate's coalesced title, then the original boost template name.
 * The holder-encrypted payload is never decrypted to recover a title.
 */
export const resolveCredentialRefreshEmailDisplayTitle = async (params: {
    version: CredentialRefreshVersionNode;
    refreshId: string;
}): Promise<string | undefined> => {
    const { version, refreshId } = params;
    const fromVersion = extractBoundedCredentialDisplayTitle(version.credentialDisplayName);

    if (fromVersion) return fromVersion;

    const aggregate = await getCredentialRefresh(refreshId);
    const fromAggregate = extractBoundedCredentialDisplayTitle(aggregate?.credentialDisplayName);

    if (fromAggregate) return fromAggregate;

    if (!aggregate?.boostId) return undefined;

    const boost: BoostInstance | null = await getBoostById(aggregate.boostId);

    return extractBoundedCredentialDisplayTitle(boost?.name);
};

/**
 * Best-effort email delivery for one published version. Never throws: the caller
 * uses the outcome for observability only, so email can neither undo a
 * publication nor block the in-app notification path.
 */
export const deliverCredentialRefreshEmailNotification = async (params: {
    version: CredentialRefreshVersionNode;
    issuerProfile: ProfileType;
    holderProfile: ProfileType;
    branding?: Partial<TenantBranding>;
}): Promise<CredentialRefreshEmailDeliveryOutcome> => {
    const { version, issuerProfile, holderProfile, branding } = params;
    const refreshId = version.refreshId;

    try {
        const target = await resolveCredentialRefreshEmailTarget(holderProfile);

        if (target.status === 'skipped') return 'skipped-no-recipient';

        const windowKey = computeCredentialRefreshDeliveryKey(refreshId);

        // The email-delivery unique constraint is created on demand: the accept
        // path can reach this helper without passing through the publish route
        // middleware that normally ensures credential-refresh constraints.
        await ensureCredentialRefreshConstraints();

        const claim = await claimCredentialRefreshEmailDelivery({ refreshId, windowKey });

        if (claim === 'duplicate') return 'duplicate-window';

        try {
            const credentialTitle = await resolveCredentialRefreshEmailDisplayTitle({
                version,
                refreshId,
            });

            await getDeliveryService(target.contactMethod).send({
                contactMethod: target.contactMethod,
                templateId: 'credential-updated',
                templateModel: buildCredentialUpdatedEmailModel({
                    issuerDisplayName: issuerProfile.displayName,
                    credentialTitle,
                }),
                branding,
                locale: target.locale ?? resolveRecipientLocale(holderProfile),
                messageStream: 'universal-inbox',
            });

            await finalizeCredentialRefreshEmailDelivery({
                refreshId,
                windowKey,
                state: 'delivered',
            });

            return 'sent';
        } catch (error) {
            console.error('Credential Refresh Email - Failed to deliver update email:', error);

            try {
                await finalizeCredentialRefreshEmailDelivery({
                    refreshId,
                    windowKey,
                    state: 'failed',
                });
            } catch (recordError) {
                console.error(
                    'Credential Refresh Email - Failed to record delivery failure:',
                    recordError
                );
            }

            return 'failed';
        }
    } catch (error) {
        // Recipient resolution / claim setup failed. Nothing was sent and no window
        // was claimed, so a later attempt in the same window may still succeed.
        console.error('Credential Refresh Email - Delivery setup failed:', error);

        return 'failed';
    }
};
