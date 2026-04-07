import React from 'react';
import moment from 'moment';

import { getFirstName, useCurrentUser, useModal, ModalTypes, useGetProfile } from 'learn-card-base';
import { getGreetingAndEmoji } from './launchPadHeader.helpers';
import LaunchPadActionModal from './LaunchPadActionModal';
import useLCNGatedAction from '../../../components/network-prompts/hooks/useLCNGatedAction';
import CaretRightFilled from 'src/components/svgs/CaretRightFilled';
import { roleIcons } from '../../../components/onboarding/onboardingRoles/OnboardingRoleItem';
import { LearnCardRolesEnum } from '../../../components/onboarding/onboarding.helpers';

export const LaunchPadHeaderUserGreeting: React.FC<{}> = () => {
    const currentUser = useCurrentUser();
    const currentHour = moment().hour(); // returns 0–23
    const { newModal } = useModal({
        desktop: ModalTypes.Freeform,
        mobile: ModalTypes.Freeform,
    });

    const { data: lcNetworkProfile, isLoading: profileLoading } = useGetProfile();
    const iconSrc = lcNetworkProfile?.role
        ? roleIcons[lcNetworkProfile?.role as LearnCardRolesEnum]
        : undefined;

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
                <p className="text-grayscale-700 font-normal text-[16px] font-poppins flex items-center">
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
                        className="w-full max-w-[600px] flex items-center justify-between px-[10px] py-[5px] rounded-[10px] bg-grayscale-50 shadow-[0_2px_2px_0_rgba(0,0,0,0.25)] border-solid border border-grayscale-200"
                    >
                        <div className="flex items-center">
                            {iconSrc && (
                                <img
                                    src={iconSrc}
                                    alt={`${lcNetworkProfile?.role} icon`}
                                    className="h-[20px] w-[20px] object-contain mr-[5px]"
                                />
                            )}
                            <span className="text-[#273B72] font-poppins font-semibold text-[20px]">
                                What would you like to do?
                            </span>
                        </div>
                        <CaretRightFilled className="w-[15px] h-[15px]" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LaunchPadHeaderUserGreeting;
