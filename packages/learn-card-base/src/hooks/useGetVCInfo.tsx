import React, { useState, useEffect } from 'react';

import ProfilePicture, {
    UserProfilePicture,
} from 'learn-card-base/components/profilePicture/ProfilePicture';

import {
    getCredentialSubject,
    getIssuerDid,
    getIssuerName,
    getProfileIdFromLCNDidWeb,
    getAppSlugFromDidWeb,
    isAppDidWeb,
    getIssuerImage,
    getCredentialSubjectName,
    getSubjectImage,
    getAchievementTypeDisplayText,
    getImageUrlFromCredential,
    getCredentialName,
    isClrCredential as checkIsClrCredential,
    getClrLinkedCredentialCounts,
    getCredentialSubjectAchievementData,
    getEndorsements,
} from 'learn-card-base/helpers/credentialHelpers';
import { getEmojiFromDidString } from 'learn-card-base/helpers/walletHelpers';

import useCurrentUser from './useGetCurrentUser';
import useGetCurrentLCNUser from './useGetCurrentLCNUser';
import {
    useGetDid,
    useGetProfile,
    useGetAppStoreListingBySlug,
} from 'learn-card-base/react-query/queries/queries';

import { UnsignedAchievementCredential, UnsignedVC, VC } from '@learncard/types';
import {
    getIDCardDisplayInputsFromVC,
    ID_CARD_DISPLAY_TYPES,
} from 'learn-card-base/helpers/credentials/ids';
import { ellipsisMiddle } from 'learn-card-base/helpers/stringHelpers';

import { useWallet } from 'learn-card-base';

/**
 * useGetVCInfo Hook
 * ----------------------------------------
 * Centralizes all logic for reading, normalizing, and formatting VC data for display.
 * - Resolves issuer & subject names, images, and profiles
 * - Handles ID card overrides
 * - Extracts metadata (achievement, attachments, criteria, etc.)
 * - Normalizes UI display settings for cards and modals
 */
export const useGetVCInfo = (
    vc: UnsignedVC | UnsignedAchievementCredential,
    categoryType?: string
) => {
    // --- Wallet context ---
    const { initWallet } = useWallet();

    // --- Current user context ---
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { data: currentUserDidKey } = useGetDid('key');
    const [endorsements, setEndorsements] = useState<{ endorsement: VC; metadata: any }[]>([]);

    // --- Basic VC fields ---
    const credentialSubject = getCredentialSubject(vc);
    const issuerDid = getIssuerDid(vc);
    const issuerAppSlug = getAppSlugFromDidWeb(issuerDid);
    const issuerIsApp = isAppDidWeb(issuerDid);

    // --- Initial values ---
    let issuerName = getIssuerName(vc);
    let issuerProfileImageElement: React.ReactNode;
    let issueeDid = credentialSubject?.id ?? '';
    let issueeName = getCredentialSubjectName(vc);
    let subjectProfileImageElement: React.ReactNode;
    let issuerLink: string | undefined;

    // --- Profile lookups ---
    const issuerProfileId = getProfileIdFromLCNDidWeb(issuerDid);
    const { data: issuerProfile, isLoading: issuerProfileLoading } = useGetProfile(
        issuerProfileId!,
        Boolean(issuerProfileId)
    );

    const { data: issuerAppListing, isLoading: issuerAppLoading } = useGetAppStoreListingBySlug(
        issuerAppSlug,
        Boolean(issuerAppSlug)
    );

    const issueeProfileId = getProfileIdFromLCNDidWeb(issueeName);
    const { data: issueeProfile, isLoading: issueeProfileLoading } = useGetProfile(
        issueeProfileId!,
        Boolean(issueeProfileId)
    );

    // ========================================================================
    // ISSUER INFO
    // ========================================================================
    const isCurrentUserIssuer =
        issuerDid === currentUserDidKey || issuerDid === currentLCNUser?.did;
    if (issuerAppSlug) {
        issuerName =
            issuerAppListing?.display_name ||
            (issuerAppLoading ? 'Loading app...' : issuerAppSlug);
        issuerLink = issuerAppListing?.listing_id
            ? `/app/${issuerAppListing.listing_id}`
            : undefined;

        issuerProfileImageElement = issuerAppListing?.icon_url ? (
            <UserProfilePicture
                user={{ name: issuerName, image: issuerAppListing.icon_url }}
                customImageClass="w-full h-full object-cover"
                customContainerClass="flex items-center justify-center h-full text-white font-medium text-lg"
            />
        ) : (
            <div className="flex items-center justify-center h-full w-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-xl">
                {getEmojiFromDidString(issuerDid!)}
            </div>
        );
    } else if (issuerProfileId) {
        // Issuer has LCN profile
        issuerName =
            issuerProfile?.displayName || (issuerProfileLoading ? 'Loading...' : issuerDid);

        issuerProfileImageElement = issuerProfile ? (
            <UserProfilePicture
                user={issuerProfile}
                customImageClass="w-full h-full object-cover"
                customContainerClass="flex items-center justify-center h-full text-white font-medium text-lg"
            />
        ) : (
            <div className="flex items-center justify-center h-full w-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-xl">
                {getEmojiFromDidString(issuerDid!)}
            </div>
        );
    } else if (isCurrentUserIssuer) {
        // Issuer is current user
        issuerName = currentUser?.name;
    } else {
        // Fallback (non-LCN issuer)
        issuerName = getIssuerName(vc) || issuerDid;
        const issuerImage = getIssuerImage(vc);
        issuerProfileImageElement = issuerImage ? (
            <UserProfilePicture
                user={{ id: issuerDid, name: issuerName, image: issuerImage }}
                customImageClass="w-full h-full object-cover"
                customContainerClass="flex items-center justify-center h-full text-white font-medium text-lg"
            />
        ) : (
            <div className="flex items-center justify-center h-full w-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-xl">
                {getEmojiFromDidString(issuerDid!)}
            </div>
        );
    }

    // ========================================================================
    // SUBJECT INFO
    // ========================================================================
    const isCurrentUserSubject =
        issueeDid === currentUserDidKey || issueeDid === currentLCNUser?.did;
    if (issueeProfileId) {
        issueeName =
            issueeProfile?.displayName || (issueeProfileLoading ? 'Loading...' : issueeDid);

        // If subject is current LCN user, override with known display name
        if (issueeDid === currentLCNUser?.did) {
            issueeName = currentLCNUser?.displayName || currentUser?.name || issueeDid;
        }

        subjectProfileImageElement = issueeProfile ? (
            <UserProfilePicture
                user={issueeProfile}
                customImageClass="w-full h-full object-cover"
                customContainerClass="flex items-center justify-center h-full text-white font-medium text-4xl"
            />
        ) : (
            <div className="flex items-center justify-center h-full w-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-xl">
                {getEmojiFromDidString(issueeDid)}
            </div>
        );
    } else if (isCurrentUserSubject) {
        // Subject is current user
        issueeName = currentUser?.name || issueeDid;
    } else if (credentialSubject?.identifier) {
        // Identifier fallback
        if (!Array.isArray(credentialSubject.identifier)) {
            if (
                credentialSubject.identifier.identityHash &&
                credentialSubject.identifier.identityType === 'name' &&
                !credentialSubject.identifier.hashed
            ) {
                issueeName = credentialSubject.identifier.identityHash;
            }
        } else {
            const nameIdentifier = credentialSubject.identifier.find(
                i => i.identityHash && i.identityType === 'name' && !i.hashed
            );
            if (nameIdentifier) issueeName = nameIdentifier.identityHash;
        }
    }

    // If subject is not current user, fallback again for image
    if (currentUser && issueeDid !== currentUserDidKey && issueeDid !== currentLCNUser?.did) {
        issueeName = getCredentialSubjectName(vc)!;
        const subjectImage = getSubjectImage(vc);

        subjectProfileImageElement = subjectImage ? (
            <UserProfilePicture
                user={{ profileId: issueeDid, name: issueeName, image: subjectImage }}
                customImageClass="w-full h-full object-cover"
                customContainerClass="flex items-center justify-center h-full text-white font-medium text-4xl"
            />
        ) : (
            <div className="flex items-center justify-center h-full w-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-xl">
                {getEmojiFromDidString(issueeDid || issueeName)}
            </div>
        );
    }

    // ========================================================================
    // ID CARD OVERRIDES
    // ========================================================================
    const mappedInputs = getIDCardDisplayInputsFromVC(vc);
    let {
        idDisplayType,
        issueeName: idIssueeName = '',
        issueeThumbnail: idIssueeThumbnail = '',
        idIssuerName,
        issuerThumbnail: idIssuerThumbnail,
        credentialSubject: idCredentialSubject = {},
    } = mappedInputs;

    const issuerThumbStyles = {
        customImageClass: 'w-full h-full object-cover',
        customContainerClass:
            'flex items-center justify-center h-full text-white font-medium text-lg',
    };
    const issueeThumbStyles = {
        customImageClass: 'w-full h-full object-cover',
        customContainerClass:
            'flex items-center justify-center h-full text-white font-medium text-4xl',
    };

    let idIssuerThumbnailSrc = vc?.boostID?.issuerThumbnail;
    let showIdIssuerThumbnail = vc?.boostID?.showIssuerThumbnail;
    let idSubjectDID: string = '';

    if (mappedInputs) {
        if (idIssuerName) issuerName = idIssuerName;
        if (idIssuerThumbnail) {
            issuerProfileImageElement = (
                <ProfilePicture
                    overrideSrc
                    overrideSrcURL={idIssuerThumbnail}
                    {...issuerThumbStyles}
                />
            );
            idIssuerThumbnailSrc = idIssuerThumbnail;
            if (idIssuerThumbnail) showIdIssuerThumbnail = true;
        }
        if (idIssueeThumbnail) {
            subjectProfileImageElement = (
                <ProfilePicture
                    overrideSrc
                    overrideSrcURL={idIssueeThumbnail}
                    {...issueeThumbStyles}
                />
            );
        }
        if (idIssueeName) issueeName = idIssueeName;
        if (idCredentialSubject && idDisplayType === ID_CARD_DISPLAY_TYPES.PermanentResidentCard) {
            idSubjectDID = ellipsisMiddle(idCredentialSubject?.id, 8, 6);
        }
    }

    // ========================================================================
    // VC METADATA
    // ========================================================================
    const title = getCredentialName(vc);
    const badgeThumbnail = getImageUrlFromCredential(vc, categoryType);

    // Extra structured data
    const address = vc?.address?.streetAddress ?? '';
    const attachments = vc?.attachments ?? [];
    const skills = vc?.skills ?? [];
    const evidence = vc?.evidence ?? [];
    const source = credentialSubject?.source ?? {};
    const { description, criteria, alignment } = getCredentialSubjectAchievementData(vc);

    // Achievement type resolution
    let achievementType = '';
    if (vc?.boostCredential?.credentialSubject?.achievement?.achievementType) {
        achievementType = vc.boostCredential.credentialSubject.achievement.achievementType;
    } else if (vc?.credentialSubject?.achievement?.achievementType) {
        achievementType = vc.credentialSubject.achievement.achievementType;
    }
    const formattedAchievementType = getAchievementTypeDisplayText(
        achievementType,
        categoryType as any
    );

    // ========================================================================
    // DISPLAY METADATA
    // ========================================================================
    const displayType = vc?.display?.displayType;
    const previewType = vc?.display?.previewType;

    // ID card-specific display settings
    const idBackgroundImage = vc?.boostID?.backgroundImage;
    const idDimBackgroundImage = vc?.boostID?.dimBackgroundImage;
    const idFontColor = vc?.boostID?.fontColor;
    const idAccentColor = vc?.boostID?.accentColor;

    // Generic display settings
    const backgroundImage = vc?.display?.backgroundImage;
    const backgroundColor = vc?.display?.backgroundColor;

    // ========================================================================
    // CLR
    // ========================================================================
    const isClrCredential = checkIsClrCredential(vc);
    const linkedCredentialCount = isClrCredential ? getClrLinkedCredentialCounts(vc) : 0;

    // ========================================================================
    // Endorsements
    // ========================================================================
    useEffect(() => {
        const fetchEndorsements = async () => {
            const wallet = await initWallet();
            const endorsements = await getEndorsements(wallet, vc);

            setEndorsements(endorsements);
        };
        fetchEndorsements();
    }, []);
    const endorsementComment = vc?.credentialSubject?.endorsementComment ?? '';

    // ========================================================================
    // Final normalized VC data
    // ========================================================================

    return {
        // issuer
        issuerName,
        issuerProfileImageElement,
        issuerProfile,
        issuerDid,
        issuerLink,
        issuerIsApp,
        issuerAppListing,
        isCurrentUserIssuer,

        // subject
        issueeName,
        subjectProfileImageElement,
        issueeProfile,
        issueeDid,
        isCurrentUserSubject,

        // ID overrides
        idDisplayType,
        idIssuerName,
        idIssuerThumbnailSrc,
        showIdIssuerThumbnail,
        idSubjectDID,
        mappedInputs,

        // VC metadata
        title,
        description,
        criteria,
        alignment,
        evidence,
        attachments,
        skills,
        achievementType,
        formattedAchievementType,
        badgeThumbnail,
        isClrCredential,
        linkedCredentialCount,
        address,
        source,

        // Endorsements
        endorsements,
        endorsementComment,

        // Display settings
        displayType,
        previewType,
        idBackgroundImage,
        idDimBackgroundImage,
        idFontColor,
        idAccentColor,
        backgroundImage,
        backgroundColor,

        // Loading state
        loading: issueeProfileLoading || issuerProfileLoading,
    };
};
