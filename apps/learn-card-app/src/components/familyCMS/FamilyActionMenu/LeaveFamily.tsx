import React, { useState } from 'react';

import { ModalTypes, useModal } from 'learn-card-base';
import { VC } from '@learncard/types';

export const LeaveFamily: React.FC<{ credential: VC; boostUri?: string }> = ({
    credential,
    boostUri,
}) => {
    const { closeModal, newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const familyName = credential?.name;

    const handleLeaveFamily = () => {
        // TODO:
        // check if the user leaving is the only guardian if so , set the following text
        // As the sole guardian, leaving this family will delete all profiles and data associated with it. To preserve the family, please assign another guardian before leaving.

        closeModal();
        // handle leave family here
        newModal(
            <>
                <div className="w-full flex flex-col justify-center items-center bg-white rounded-[20px] p-8">
                    <h4 className="text-[22px] font-normal font-poppins mt-2 text-grayscale-900 text-center">
                        Family Left Successfully
                    </h4>
                    <p className="text-[17px] font-poppins text-grayscale-700 text-left mt-4">
                        You have left {familyName}. You can now join or create another family.
                    </p>
                </div>

                <div className="w-full flex items-center justify-center mt-4">
                    <button
                        onClick={closeModal}
                        type="button"
                        className="shrink-0 w-full py-2 h-full flex items-center font-medium justify-center text-xl bg-grayscale-900 rounded-[20px] shadow-bottom text-white"
                    >
                        Got It
                    </button>
                </div>
            </>,
            {
                sectionClassName: '!bg-transparent !border-none !shadow-none !rounded-none',
                hideButton: true,
            }
        );
    };

    return (
        <>
            <div className="w-full flex flex-col justify-center items-center bg-white rounded-[20px] p-8">
                <h4 className="text-[22px] font-normal font-poppins mt-2 text-grayscale-900 text-center">
                    Leave Family?
                </h4>
                <p className="text-[17px] font-poppins text-grayscale-700 text-left mt-4">
                    Leaving this family will remove your access to its profiles and data.
                </p>
            </div>

            <div className="w-full flex items-center justify-center mt-4">
                <button
                    onClick={handleLeaveFamily}
                    type="button"
                    className="shrink-0 w-full py-2 h-full flex items-center font-medium justify-center text-xl bg-red-600 rounded-[20px] shadow-bottom text-white"
                >
                    Leave
                </button>
            </div>
        </>
    );
};

export default LeaveFamily;
