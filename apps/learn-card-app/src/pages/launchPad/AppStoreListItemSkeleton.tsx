import React from 'react';

import {
    BoostSkeleton,
    BoostTextSkeleton,
} from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

/**
 * Loading placeholder for {@link AppStoreListItem}. Mirrors the real row's
 * dimensions (icon, two text lines, pill button) so the layout doesn't shift
 * when apps finish loading. Uses the same `IonSkeletonText`-based shimmer
 * primitives as the other app skeletons (e.g. `NotificationSkeleton`).
 */
export const AppStoreListItemSkeleton: React.FC = () => {
    return (
        <div
            aria-hidden="true"
            className="w-full max-w-[600px] px-[12px] py-[12px] max-h-[76px] flex bg-white items-center justify-between overflow-visible rounded-[12px] mt-2 first:mt-4 shadow-sm"
        >
            <div className="flex items-center justify-start w-full">
                <div className="rounded-lg w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px] overflow-hidden">
                    <BoostSkeleton
                        containerClassName="w-full h-full"
                        skeletonStyles={{ width: '100%', height: '100%', margin: 0 }}
                    />
                </div>

                <div className="right-side flex items-center justify-between w-full">
                    <div className="flex flex-col items-start justify-center text-left flex-1 min-w-0 gap-1">
                        <BoostTextSkeleton
                            containerClassName="w-full"
                            skeletonStyles={{ width: '60%', height: '14px' }}
                        />
                        <BoostTextSkeleton
                            containerClassName="w-full"
                            skeletonStyles={{ width: '40%', height: '12px' }}
                        />
                    </div>

                    <div className="flex items-center ml-2 shrink-0">
                        <BoostSkeleton
                            containerClassName="w-[72px] h-[34px] rounded-full overflow-hidden"
                            skeletonStyles={{ width: '100%', height: '100%', margin: 0 }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Renders a small stack of {@link AppStoreListItemSkeleton} rows in place of a
 * category list while it's loading with no data yet. `idPrefix` keeps row keys
 * unique when multiple stacks render as siblings (e.g. Installed + Suggested).
 */
export const AppStoreListSkeleton: React.FC<{ count?: number; idPrefix?: string }> = ({
    count = 5,
    idPrefix = 'app-store-skeleton',
}) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <AppStoreListItemSkeleton key={`${idPrefix}-${index}`} />
            ))}
        </>
    );
};

export default AppStoreListItemSkeleton;
