import React from 'react';

export const UserContactHeader: React.FC = () => {
    return (
        <header className="w-full">
            <div className="w-full flex items-center justify-center bg-white pt-6 pb-2">
                <h4 className="text-grayscale-900 text-[22px] font-semibold font-notoSans">
                    Email Addresses
                </h4>
            </div>
        </header>
    );
};

export default UserContactHeader;
