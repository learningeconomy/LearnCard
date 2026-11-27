import React from 'react';
import { AppThumbnail } from '../../../widgets';
import { AppLabel } from '../../../list';
import { AppSkeletonText } from '../../../feedback/AppSkeletonText';

export const CheckListItemSkeleton: React.FC = () => {
    return (
        <div className="mt-4 pb-4 w-full flex items-center justify-between">
            <div className="flex items-center justify-start">
                <AppThumbnail slot="start">
                    <AppSkeletonText
                        animated
                        style={{ width: '55px', height: '55px', borderRadius: '8px' }}
                    />
                </AppThumbnail>

                <AppLabel className="ml-6">
                    <h2>
                        <AppSkeletonText animated style={{ width: '150px', height: '14px' }} />
                    </h2>
                    <p>
                        <AppSkeletonText animated style={{ width: '100px', height: '12px' }} />
                    </p>
                </AppLabel>
            </div>

            <div slot="end" className="mr-2">
                <AppSkeletonText
                    animated
                    style={{ width: '25px', height: '26px', borderRadius: '50%' }}
                />
            </div>
        </div>
    );
};

export default CheckListItemSkeleton;
