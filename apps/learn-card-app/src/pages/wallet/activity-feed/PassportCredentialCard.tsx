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

export type ActivityIndexRecord = Partial<LCR> & { uri: string; sharedUri?: string };

type PassportCredentialCardProps = {
    record: ActivityIndexRecord;
    className?: string;
};

export const resolveEndorsementTitle = async (sharedUri?: string): Promise<string | undefined> => {
    const credential = await resolveSharedCredential(sharedUri);
    const name = credential && getCredentialName(credential);
    return name ? `Endorsement of ${name}` : undefined;
};

const PassportCredentialCard: React.FC<PassportCredentialCardProps> = ({ record, className }) => {
    const category = resolveActivityCategory(record.category);
    const storedTitle =
        record.category === 'Endorsement' && !record.title?.includes('undefined')
            ? record.title
            : undefined;
    const { data: resolvedTitle } = useQuery({
        queryKey: ['endorsement-target-title', record.sharedUri],
        enabled: record.category === 'Endorsement' && !storedTitle && Boolean(record.sharedUri),
        queryFn: () => resolveEndorsementTitle(record.sharedUri),
    });
    return (
        <div className={className}>
            <BoostEarnedCard
                record={record}
                titleOverride={storedTitle ?? resolvedTitle}
                categoryType={category}
                defaultImg={categoryMetadata[category as CredentialCategoryEnum]?.defaultImageSrc}
                useWrapper={false}
                hideCardOptionsMenu
            />
        </div>
    );
};

export default PassportCredentialCard;
