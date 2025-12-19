import React from 'react';

const BoostProfileImage: React.FC<{
    imageUrl: string;
}> = ({ imageUrl }) => {
    return <img className="h-full w-full object-cover select-none" src={imageUrl} alt="profile" />;
};

export default BoostProfileImage;
