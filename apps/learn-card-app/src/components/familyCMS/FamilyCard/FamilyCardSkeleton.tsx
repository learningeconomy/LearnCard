import React from 'react';

import BoostTextSkeleton, {
    BoostSkeleton,
} from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

export const FamilyCardSkeleton: React.FC = () => {
    return (
        <div className="w-full flex items-center justify-center flex-col max-w-[600px] mt-4 px-4 max-h-[190px]">
            <div className="w-full flex items-center justify-center bg-white rounded-[20px] overflow-hidden shadow-soft-bottom">
                <div className="bg-white min-w-[160px] flex items-center justify-center relative min-h-[210px]">
                    <div className="rounded-[0px_0px_100px_0px] w-full h-full absolute z-10 top-0 left-0">
                        <BoostSkeleton
                            containerClassName="w-full h-full z-9999"
                            skeletonStyles={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '0px 0px 100px 0px',
                            }}
                        />
                    </div>
                </div>
                <div className="w-full flex flex-col items-start justify-between h-full ion-padding relative">
                    <div className="w-full">
                        <h3 className="w-[80%]">
                            <BoostTextSkeleton
                                containerClassName="w-full"
                                skeletonStyles={{ width: '90%' }}
                            />
                        </h3>
                        <div className="font-poppins text-xs font-semibold mt-2 w-[60%]">
                            <BoostTextSkeleton
                                containerClassName="w-full"
                                skeletonStyles={{ width: '80%' }}
                            />
                        </div>
                    </div>

                    <BoostSkeleton
                        containerClassName="rounded-[40px] w-full h-[40px] text-white flex justify-center items-center "
                        skeletonStyles={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '40px',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default FamilyCardSkeleton;
