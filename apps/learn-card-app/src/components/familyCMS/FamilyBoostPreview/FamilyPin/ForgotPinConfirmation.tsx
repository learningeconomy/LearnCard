import React from 'react';

import { ProfilePicture, useModal } from 'learn-card-base';

import useLogout from '../../../../hooks/useLogout';
import { m } from '../../../../paraglide/messages.js';

export const ForgotPinConfirmation: React.FC<{}> = () => {
    const { closeAllModals } = useModal();
    const { handleLogout } = useLogout();

    return (
        <div className="w-full flex flex-col justify-center items-center px-4 py-6 mb-4 bg-white rounded-[20px]">
            <ProfilePicture
                customContainerClass="flex justify-center items-center h-[64px] w-[64px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[64px] min-h-[64px]"
                customImageClass="flex justify-center items-center h-[64px] w-[64px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[64px] min-h-[64px]"
                customSize={120}
            />
            <h4 className="text-[24px] font-normal font-poppins mt-2 text-grayscale-900 text-center">
                {m['family.pinModal.forgotTitle']()}
            </h4>
            <p className="text-sm font-poppins text-grayscale-900 text-center mt-2">
                {m['family.pinModal.forgotBody']()}
            </p>

            <button
                onClick={() => {
                    closeAllModals();
                    handleLogout();
                }}
                className="text-mv_blue-700 font-bold mt-2"
            >
                {m['family.pinModal.reauthenticate']()}
            </button>
        </div>
    );
};

export default ForgotPinConfirmation;
