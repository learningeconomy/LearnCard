import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { categoryMetadata, CredentialCategoryEnum } from 'learn-card-base';
import {
    getCredentialName,
    resolveSharedCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import type { LCR } from 'learn-card-base/types/credential-records';

import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import { resolveActivityCategory } from './activityFeed.helpers';
import * as m from '../../../paraglide/messages.js';

export type ActivityIndexRecord = Partial<LCR> & { uri: string; sharedUri?: string };

type PassportCredentialCardProps = {
    record: ActivityIndexRecord;
    className?: string;
};

export const resolveEndorsementTargetName = async (sharedUri?: string): Promise<string | null> => {
    if (!sharedUri) return null;

    const credential = await resolveSharedCredential(sharedUri);
    const name = credential && getCredentialName(credential);
    return name || null;
};

const PassportCredentialCard: React.FC<PassportCredentialCardProps> = ({ record, className }) => {
    const category = resolveActivityCategory(record.category);
    const isEndorsement = record.category === 'Endorsement';
    const storedTitle =
        isEndorsement && record.title?.trim() !== 'Endorsement of undefined'
            ? record.title
            : undefined;
    const needsResolvedTitle = isEndorsement && !storedTitle;
    const { data: resolvedTargetName, isPending } = useQuery<string | null>({
        queryKey: ['endorsement-target-name', record.sharedUri],
        enabled: needsResolvedTitle && Boolean(record.sharedUri),
        queryFn: () => resolveEndorsementTargetName(record.sharedUri),
        staleTime: Infinity,
    });
    const isResolvingTitle = needsResolvedTitle && Boolean(record.sharedUri) && isPending;
    const resolvedTitle = resolvedTargetName
        ? m['endorsement.activity.title']({ name: resolvedTargetName })
        : null;
    const titleOverride =
        storedTitle ??
        resolvedTitle ??
        (needsResolvedTitle && !isResolvingTitle
            ? m['endorsement.fullview.endorsement']()
            : undefined);
    return (
        <div className={className}>
            <BoostEarnedCard
                record={record}
                titleOverride={titleOverride}
                loading={isResolvingTitle}
                displayIssuerAsSubject={isEndorsement}
                categoryType={category}
                defaultImg={categoryMetadata[category as CredentialCategoryEnum]?.defaultImageSrc}
                useWrapper={false}
                hideCardOptionsMenu
            />
        </div>
    );
};

export default PassportCredentialCard;
