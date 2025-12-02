import React from 'react';

import WalletOval from './WalletOval';

import { CredentialCategory, useGetIDs, useGetCredentialCount } from 'learn-card-base';
import { RoundedSquareProps } from '@learncard/react';

type WalletSquareProps = {
    category: CredentialCategory;
};

type WalletSquareAndRoundedSquareProps = WalletSquareProps & RoundedSquareProps;

const WalletSquare: React.FC<WalletSquareAndRoundedSquareProps> = ({
    category,
    type,
    iconSrc,
    title,
    description,
    bgColor,
    onClick,
    iconCircleClass,
}) => {
    const { data, isLoading: loading } = useGetCredentialCount(category);
    const { data: earnedBoostIDs, isLoading: earnedBoostIDsLoading } = useGetIDs();

    //This fixes an issue with the display where 0 is falsy apparently and doesn't display correctly
    let _data: number | string | null | undefined;

    if (category === 'Membership') {
        _data = earnedBoostIDs?.length === 0 ? '0' : earnedBoostIDs?.length;
    } else {
        _data = data === 0 ? '0' : data;
    }

    return (
        <WalletOval
            type={type}
            iconSrc={iconSrc}
            loading={loading}
            title={title}
            onClick={onClick}
            description={description}
            count={_data ? _data : null}
            bgColor={bgColor}
            // iconCircleClass={iconCircleClass}
        />
    );
};

export default WalletSquare;
