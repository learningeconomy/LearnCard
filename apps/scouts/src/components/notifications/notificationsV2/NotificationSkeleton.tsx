import React from 'react';

import BoostTextSkeleton, {
    BoostSkeleton,
} from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

export const NotificationSkeleton: React.FC = () => {
    return (
        <div className="flex my-[15px] min-justify-start max-w-[600px] items-start relative w-full rounded-3xl shadow-bottom py-[10px] px-[10px] bg-white">
            <div className="notification-card-left-side px-[0px] flex">
                <BoostSkeleton
                    containerClassName="flex min-w-[90px] min-h-[90px] justify-center items-center rounded-full overflow-hidden text-white font-medium text-4xl p-[6px]"
                    skeletonStyles={{ width: '100%', height: '100%' }}
                />
            </div>
            <div className="flex flex-col justify-center items-start relative w-full">
                <div className="text-left ml-3 flex flex-col items-start justify-start w-full">
                    <>
                        <BoostTextSkeleton
                            containerClassName="w-full"
                            skeletonStyles={{ width: '80%' }}
                        />
                        <BoostTextSkeleton
                            containerClassName="w-full"
                            skeletonStyles={{ width: '50%' }}
                        />
                    </>

                    <div className="relative flex items-center justify-between mt-3 w-full">
                        <button
                            className={`notification-claim-btn overflow-hidden flex items-center mr-[15px] w-[143px] justify-center flex-1 rounded-[24px] font-semibold py-2 px-3 tracking-wide`}
                        >
                            <BoostSkeleton
                                containerClassName="w-[215px] h-[44px] rounded-full"
                                skeletonStyles={{ height: '100%', width: '100%' }}
                            />
                        </button>

                        <button
                            className={`rounded-[24px]  flex items-center justify-center  h-[44px] w-[44px] font-semibold mr-2 p-[0px] tracking-wide`}
                        >
                            <BoostSkeleton
                                containerClassName="w-full rounded-full h-full"
                                skeletonStyles={{ height: '100%', width: '100%' }}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSkeleton;
