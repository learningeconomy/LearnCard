import React from 'react';

import type { LCNProfile, VC } from '@learncard/types';
import { BoostCategoryOptionsEnum, useGetVCInfo, UserProfilePicture } from 'learn-card-base';
import { isBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import CredentialBadgeNew from 'learn-card-base/components/CredentialBadge/CredentialBadgeNew';

import BoostPreview from '../boost/boostCMS/BoostPreview/BoostPreview';
import NonBoostPreview from '../boost/boostCMS/BoostPreview/NonBoostPreview';

export type FeaturedCredentialOwner = Pick<LCNProfile, 'profileId' | 'displayName' | 'image'>;

type FeaturedCredentialPreviewProps = {
    /** The publicly resolved boost credential selected on the owner's profile. */
    credential: VC;
    categoryType: BoostCategoryOptionsEnum;
    /** The profile that features this credential; shown as its recipient. */
    owner?: FeaturedCredentialOwner;
    onClose: () => void;
};

/**
 * Read-only detail view for a featured credential. The public boost resolves to the issuer's
 * template rather than the owner's signed copy, so verification, issue date, sharing, and the
 * options menu stay hidden.
 */
const FeaturedCredentialPreview: React.FC<FeaturedCredentialPreviewProps> = ({
    credential,
    categoryType,
    owner,
    onClose,
}) => {
    const {
        title,
        achievementType,
        badgeThumbnail,
        displayType,
        previewType,
        formattedAchievementType,
        backgroundImage,
        backgroundColor,
        accentColor,
    } = useGetVCInfo(credential, categoryType);

    const previewProps = {
        credential,
        categoryType,
        verificationItems: [],
        showVerifications: false,
        hideIssueDate: true,
        hideQRCode: true,
        isEarnedBoost: false,
        issueeOverride: owner?.displayName || owner?.profileId,
        subjectImageComponent: owner ? (
            <UserProfilePicture
                user={owner}
                customImageClass="w-full h-full object-cover"
                customContainerClass="flex items-center justify-center h-full text-white font-medium text-4xl"
            />
        ) : undefined,
        customThumbComponent: (
            <CredentialBadgeNew
                achievementType={achievementType}
                fallbackCircleText={title}
                boostType={categoryType}
                badgeThumbnail={badgeThumbnail ?? ''}
                badgeCircleCustomClass="w-[170px] h-[170px]"
                credential={credential}
                showBackgroundImage
                backgroundImage={backgroundImage}
                backgroundColor={backgroundColor}
                accentColor={accentColor}
                displayType={displayType}
            />
        ),
        customBodyCardComponent: null,
        customFooterComponent: <div />,
        customIssueHistoryComponent: null,
        handleCloseModal: onClose,
        titleOverride: title,
        formattedDisplayType: formattedAchievementType,
        displayType,
        previewType,
    };

    if (isBoostCredential(credential)) return <BoostPreview {...previewProps} />;

    return <NonBoostPreview {...previewProps} />;
};

export default FeaturedCredentialPreview;
