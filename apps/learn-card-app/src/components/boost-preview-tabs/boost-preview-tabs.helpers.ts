import React from 'react';
import EndorsementThumb from 'learn-card-base/svgs/EndorsementThumb';

export enum BoostPreviewTabsEnum {
    Details = 'details',
    Endorsements = 'endorsements',
}

export const boostPreviewTabs: {
    label: string;
    value: BoostPreviewTabsEnum;
    Icon?: React.FC<{ className?: string }> | null;
}[] = [
    {
        label: 'Details',
        value: BoostPreviewTabsEnum.Details,
        Icon: null,
    },
    {
        label: 'Endorsements',
        value: BoostPreviewTabsEnum.Endorsements,
        Icon: EndorsementThumb,
    },
];
