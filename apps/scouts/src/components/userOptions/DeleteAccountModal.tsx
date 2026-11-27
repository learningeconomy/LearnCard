import React from 'react';
import * as m from '../../paraglide/messages.js';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- existing empty props type; replacing it changes the accepted props type
const DeleteAccountModal: React.FC<{}> = () => {
    return (
        <div className="w-full shadow-soft-bottom bg-white flex items-center justify-center p-6 rounded-xl">
            <AppSpinner name="crescent" color="dark" className="scale-[1] mr-1" />
            <h1 className="font-medium text-lg text-grayscale-900">
                {m['userProfile.deletingAccount']()}
            </h1>
        </div>
    );
};

export default DeleteAccountModal;
