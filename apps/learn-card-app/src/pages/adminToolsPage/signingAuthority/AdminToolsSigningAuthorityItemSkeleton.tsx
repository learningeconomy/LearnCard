import React from 'react';
import { IonSkeletonText } from '@ionic/react';

export const AdminToolsSigningAuthorityItemSkeleton: React.FC = () => {
    return (
        <div className="w-full p-4 border-b-grayscale-100 border-b-solid border-b-[2px]">
            <div className="w-full flex flex-col items-start justify-between px-4 space-y-4">
                {[...Array(3)].map((_, index) => (
                    <div key={index} className="w-full flex items-center justify-between">
                        <IonSkeletonText animated className="w-[75%] h-[20px] rounded-md" />
                        <IonSkeletonText animated className="w-[25px] h-[25px] rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminToolsSigningAuthorityItemSkeleton;
