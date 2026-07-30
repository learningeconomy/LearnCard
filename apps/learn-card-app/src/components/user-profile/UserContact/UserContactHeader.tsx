import React from 'react';
import * as m from '../../../paraglide/messages.js';

export const UserContactHeader: React.FC = () => {
    return (
        <header className="w-full">
            <div className="w-full flex items-center justify-center bg-white pt-6 pb-2">
                <h4 className="text-grayscale-900 text-[22px] font-semibold font-notoSans">
                    {m['profile.email.header']()}
                </h4>
            </div>
        </header>
    );
};

export default UserContactHeader;
