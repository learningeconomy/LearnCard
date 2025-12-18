import { UserProfilePicture, useGetProfile } from 'learn-card-base';
import React from 'react';

type SimpleFrameworkAdminDisplayProps = {
    profileId: string;
};

const SimpleFrameworkAdminDisplay: React.FC<SimpleFrameworkAdminDisplayProps> = ({ profileId }) => {
    const { data: profile } = useGetProfile(profileId);

    // TODO add network / troop below name

    return (
        <div className="flex items-center gap-[10px] w-full py-[10px]">
            <UserProfilePicture user={profile} customContainerClass="w-[40px] h-[40px]" />
            <p className="text-grayscale-900 font-poppins text-[17px] line-clamp-1">
                {profile?.displayName}
            </p>
        </div>
    );
};

export default SimpleFrameworkAdminDisplay;
