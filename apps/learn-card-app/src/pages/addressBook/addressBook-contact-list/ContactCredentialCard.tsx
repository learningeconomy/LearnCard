import React from 'react';

import type { VC } from '@learncard/types';
import {
    categoryMetadata,
    CredentialCategoryEnum,
    getDefaultCategoryForCredential,
    isBoostCredential,
    unwrapBoostCredential,
} from 'learn-card-base';
import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import BoostManagedCard from '../../../components/boost/boost-managed-card/BoostManagedCard';
import type { ContactCredentialHistoryItem } from './useContactCredentialHistory';

type ContactCredentialCardProps = {
    item: ContactCredentialHistoryItem;
    renderPreviewTrigger?: (openPreview: () => void) => React.ReactNode;
    useWrapper?: boolean;
};

/** Routes contact-history credentials through the correct earned or managed preview flow. */
const ContactCredentialCard: React.FC<ContactCredentialCardProps> = ({
    item,
    renderPreviewTrigger,
    useWrapper,
}) => {
    const credential = unwrapBoostCredential(item.credential) as VC & { boostId?: string };
    const category = getDefaultCategoryForCredential(item.credential) as CredentialCategoryEnum;
    const resolvedCategory = categoryMetadata[category]
        ? category
        : CredentialCategoryEnum.achievement;

    if (item.direction === 'sent' && isBoostCredential(item.credential) && credential.boostId) {
        const { title } = getInfoFromCredential(credential);

        return (
            <BoostManagedCard
                boost={{
                    uri: credential.boostId,
                    name: title,
                    category: resolvedCategory,
                    status: 'LIVE',
                }}
                boostVC={credential}
                categoryType={resolvedCategory}
                defaultImg={categoryMetadata[resolvedCategory]?.defaultImageSrc ?? ''}
                renderPreviewTrigger={renderPreviewTrigger}
            />
        );
    }

    return (
        <BoostEarnedCard
            credential={item.credential}
            record={{ uri: item.uri }}
            categoryType={resolvedCategory}
            defaultImg={categoryMetadata[resolvedCategory]?.defaultImageSrc}
            useWrapper={useWrapper}
            hideOptionsMenu
            hideCardOptionsMenu
            renderPreviewTrigger={renderPreviewTrigger}
        />
    );
};

export default ContactCredentialCard;
