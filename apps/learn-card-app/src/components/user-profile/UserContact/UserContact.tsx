import React from 'react';

import UserContactHeader from './UserContactHeader';
import UserEmailContacts from './UserEmailContacts';

// i18n: no user-facing strings — composition-only component
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
