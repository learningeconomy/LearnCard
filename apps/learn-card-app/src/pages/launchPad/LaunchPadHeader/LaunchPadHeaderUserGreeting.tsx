import React from 'react';
import moment from 'moment';

import { getFirstName, useCurrentUser, useModal, ModalTypes } from 'learn-card-base';
import { getGreetingAndEmoji } from './launchPadHeader.helpers';
import LaunchPadActionModal from './LaunchPadActionModal';
import useLCNGatedAction from '../../../components/network-prompts/hooks/useLCNGatedAction';

export const LaunchPadHeaderUserGreeting: React.FC<{}> = () => {
    const currentUser = useCurrentUser();
    const currentHour = moment().hour(); // returns 0–23
    const { newModal } = useModal({
        desktop: ModalTypes.Freeform,
        mobile: ModalTypes.Freeform,
    });

    const { gate } = useLCNGatedAction();

    const { emoji, greeting } = getGreetingAndEmoji(currentHour);

    const name = getFirstName(currentUser?.name ?? '');

    const handleOpenActionModal = async () => {
        const { prompted } = await gate();
        if (prompted) return;

        newModal(<LaunchPadActionModal />, {
            className: 'w-full flex items-center justify-center bg-white/70 backdrop-blur-[5px]',
            sectionClassName: '!max-w-[500px] disable-scrollbars',
        });
    };

    return (
        <div className="w-full flex items-center justify-center bg-white py-4">
            <div className="w-full flex flex-col items-center justify-center px-3">
                <p className="text-grayscale-500 font-semibold text-[17px] font-poppins flex items-center">
                    <span className="mr-2">{emoji}</span>
                    <span>
                        {greeting}
                        {name ? `, ${name}` : ''}
                    </span>
                </p>
                <div className="w-full flex items-center justify-center mt-3">
                    <button
                        type="button"
                        onClick={() => void handleOpenActionModal()}
                        className="w-full max-w-[600px] flex items-center justify-between px-4 py-3 rounded-2xl bg-[#DCEAFE] shadow-sm"
                    >
                        <span className="text-[#273B72] font-poppins font-semibold text-[20px]">
                            What would you like to do?
                        </span>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-[#273B72]"
                        >
                            <path
                                d="M6 9l6 6 6-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LaunchPadHeaderUserGreeting;
