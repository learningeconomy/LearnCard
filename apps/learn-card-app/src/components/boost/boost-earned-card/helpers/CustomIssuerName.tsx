import React from 'react';

import { BoostTextSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

type CustomIssuerNameProps = {
    issuerName: string | undefined;
    subjectName?: string;
    isLoading: boolean;
    isClrCredential?: boolean;
};

export const CustomIssuerName: React.FC<CustomIssuerNameProps> = ({
    issuerName,
    subjectName,
    isLoading,
    isClrCredential = false,
}) => {
    if (isLoading) {
        return (
            <BoostTextSkeleton
                containerClassName="w-full flex items-center justify-center"
                skeletonStyles={{ width: '80%' }}
            />
        );
    }

    if (isClrCredential) {
        return (
            <div className="px-2 pt-2 flex flex-col items-center justify-center text-center w-full">
                <div className="w-full h-px bg-grayscale-100 mb-2" />
                <span className="text-xs text-grayscale-900 font-semibold leading-[1.15] line-clamp-1">
                    {subjectName || issuerName}
                </span>
                <span className="text-xs text-grayscale-700 mt-1 line-clamp-1">
                    <span className="font-medium">{issuerName}</span>
                </span>
            </div>
        );
    }

    return (
        <span className="text-[12px] text-grayscale-700 mt-1 line-clamp-1">
            by <span className="font-bold">{issuerName}</span>
        </span>
    );
};

export default CustomIssuerName;
