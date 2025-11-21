import React from 'react';

import { BoostTextSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

export const CustomIssuerName: React.FC<{ issuerName: string | undefined; isLoading: boolean }> = ({
    issuerName,
    isLoading,
}) => {
    if (isLoading) {
        return (
            <BoostTextSkeleton
                containerClassName="w-full flex items-center justify-center"
                skeletonStyles={{ width: '80%' }}
            />
        );
    }

    return (
        <span className="text-[12px] text-grayscale-700 mt-1 line-clamp-1">
            by <span className="font-bold">{issuerName}</span>
        </span>
    );
};

export default CustomIssuerName;
