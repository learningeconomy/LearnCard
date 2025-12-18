import React from 'react';

import UserContactHeader from './UserContactHeader';
import UserEmailContacts from './UserEmailContacts';

export const UserContact: React.FC = () => {
    return (
        <div className="h-full min-h-[400px] scrollbar-hide">
            <UserContactHeader />
            <section className="h-full bg-white backdrop-blur-[2px] ion-padding overflow-y-scroll safe-area-top-margin scrollbar-hide">
                <UserEmailContacts />
            </section>
        </div>
    );
};

export default UserContact;
