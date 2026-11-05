import { QueryBuilder, BindParam } from 'neogma';
import {
    UnsignedVC,
    VC,
    CredentialDisplayValidator,
    type CredentialDisplay,
} from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Boost, BoostInstance, Profile, AppStoreListing } from '@models';
import { BoostStatus, BoostType } from 'types/boost';
import { convertCredentialToBoostTemplateJSON } from '@helpers/boost.helpers';
import { getDidWeb, getAppDidWeb } from '@helpers/did.helpers';
import { getCreatorRole } from '@accesslayer/role/read';
import { flattenObject } from '@helpers/objects.helpers';
import { getBoostById } from './read';
import { ProfileType } from 'types/profile';
import { AppStoreListingType } from 'types/app-store-listing';

export const createBoost = async (
    credential: UnsignedVC | VC | null,
    creator: ProfileType,
    metadata: Omit<BoostType, 'id' | 'boost'> = {},
    domain: string,
    publicDisplay?: CredentialDisplay
): Promise<BoostInstance> => {
    const id = uuid();

    const role = await getCreatorRole(); // Ensure creator role exists

    const { status = BoostStatus.enum.LIVE } = metadata;

    const timestamp = new Date().toISOString();

    const query = new QueryBuilder(
        new BindParam({
            params: {
                id,
                boost: credential
                    ? convertCredentialToBoostTemplateJSON(
                          credential,
                          getDidWeb(domain, creator.profileId)
                      )
                    : JSON.stringify({
                          '@context': ['https://www.w3.org/ns/credentials/v2'],
                          type: ['VerifiableCredential'],
                          issuer: getDidWeb(domain, creator.profileId),
                          credentialSubject: { id: 'did:example:123' },
                          name: publicDisplay?.name ?? 'Credential',
                          display: CredentialDisplayValidator.parse(publicDisplay ?? {}),
                      }),
                status,
                ...((flattenObject as any)(metadata) as any),
            },
            profileId: creator.profileId,
            roleId: role.id,
            date: timestamp,
        })
    )
        .match({ model: Profile, identifier: 'creatorProfile' })
        .where('creatorProfile.profileId = $profileId')
        .create({ model: Boost, identifier: 'boost' })
        .set('boost += $params')
        .create(
            `(boost)-[:${
                Boost.getRelationshipByAlias('createdBy').name
            } { date: $date }]->(creatorProfile)`
        )
        .create(
            `(creatorProfile)-[:${
                Boost.getRelationshipByAlias('hasRole').name
            } { roleId: $roleId }]->(boost)`
        );

    await query.run();

    const boost = (await getBoostById(id))!;

    return boost;
};

/** The caller's explicit Boost name and category are public metadata; credential content is not. */
export const getPublicDisplay = (
    display: CredentialDisplay | undefined,
    template?: { name?: string | null; category?: string | null }
): CredentialDisplay => {
    if (display) return CredentialDisplayValidator.parse(display);
    const name = template?.name?.trim().slice(0, 280);
    const category = template?.category?.slice(0, 280);
    return CredentialDisplayValidator.parse({
        ...(name ? { name } : {}),
        ...(category ? { category } : {}),
    });
};

/** Display-only anchors never receive credential content. */
export const createDisplayOnlyBoost = (
    display: CredentialDisplay | undefined,
    creator: ProfileType,
    domain: string,
    template?: { name?: string | null; category?: string | null }
): Promise<BoostInstance> => {
    const publicDisplay = getPublicDisplay(display, template);
    return createBoost(
        null,
        creator,
        { ...publicDisplay, name: publicDisplay.name ?? 'Credential' },
        domain,
        publicDisplay
    );
};

/**
 * Creates a boost owned by an AppStoreListing (not a Profile).
 * The boost is created with the app's DID as the issuer.
 */
export const createBoostForListing = async (
    credential: UnsignedVC | VC,
    listing: AppStoreListingType,
    metadata: Omit<BoostType, 'id' | 'boost'> = {},
    domain: string
): Promise<BoostInstance> => {
    const id = uuid();

    const { status = BoostStatus.enum.LIVE } = metadata;

    const timestamp = new Date().toISOString();

    // Use the app's DID as the issuer
    const issuerDid = listing.slug
        ? getAppDidWeb(domain, listing.slug)
        : getDidWeb(domain, listing.listing_id);

    const query = new QueryBuilder(
        new BindParam({
            params: {
                id,
                boost: convertCredentialToBoostTemplateJSON(credential, issuerDid),
                status,
                ...((flattenObject as any)(metadata) as any),
            },
            listingId: listing.listing_id,
            date: timestamp,
        })
    )
        .match({ model: AppStoreListing, identifier: 'listing' })
        .where('listing.listing_id = $listingId')
        .create({ model: Boost, identifier: 'boost' })
        .set('boost += $params')
        .create(
            `(listing)-[:${
                AppStoreListing.getRelationshipByAlias('createdBoost').name
            } { date: $date }]->(boost)`
        );

    await query.run();

    const boost = await getBoostById(id);

    if (!boost) {
        throw new Error('Failed to create boost for listing');
    }

    return boost;
};
