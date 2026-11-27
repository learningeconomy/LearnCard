import React from 'react';
import { AppSkeletonText } from '../../../components/feedback/AppSkeletonText';

export const AdminToolsSigningAuthorityItemSkeleton: React.FC = () => {
    return (
        <div className="w-full p-4 border-b-grayscale-100 border-b-solid border-b-2">
            <div className="w-full flex flex-col items-start justify-between px-4 space-y-v3-4">
                {[...Array(3)].map((_, index) => (
                    <div key={index} className="w-full flex items-center justify-between">
                        <AppSkeletonText animated className="w-[75%] h-[20px] rounded-md" />
                        <AppSkeletonText animated className="w-[25px] h-[25px] rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminToolsSigningAuthorityItemSkeleton;
