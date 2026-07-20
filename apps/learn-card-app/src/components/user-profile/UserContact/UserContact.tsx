import React from 'react';
import { useModal } from 'learn-card-base';

import UserContactHeader from './UserContactHeader';
import UserEmailContacts from './UserEmailContacts';

// i18n: no user-facing strings — composition-only component
export const UserContact: React.FC = () => {
    const { closeModal } = useModal();
    return (
        <div className="h-full flex flex-col bg-white">
            <div
                className="shrink-0"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0px)' }}
            >
                <UserContactHeader />
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
                <UserEmailContacts />
            </div>
            <div
                className="shrink-0 border-t border-grayscale-200/50 bg-white/80 backdrop-blur-xl"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0px)' }}
            >
                <div className="max-w-[600px] mx-auto px-6 py-4">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="w-full bg-white text-grayscale-800 text-[17px] font-poppins font-medium py-3 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-grayscale-100 hover:bg-grayscale-50 transition-colors"
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserContact;
