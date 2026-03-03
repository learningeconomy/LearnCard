import React from 'react';
import { AddressBookContact } from '../addressBookHelpers';
import { UserProfilePicture, useCurrentUser, useModal } from 'learn-card-base';
import BrokenLink from 'apps/learn-card-app/src/components/svgs/BrokenLink';
import ExpiredInviteLinkFooter from './ExpiredInviteLinkFooter';

export const ExpiredInviteLink: React.FC<{
    user: AddressBookContact | null | undefined;
    handleConnectionRequest: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => Promise<void>;
}> = ({ user, handleConnectionRequest }) => {
    const currentUser = useCurrentUser();
    const { closeModal } = useModal();

    const handleRequestButton = e => {
        handleConnectionRequest(e, user?.profileId);
        closeModal();
    };

    return (
        <section className="min-h-full h-full overflow-y-auto pb-[94px]">
            <div className="h-full p-[20px] flex flex-col items-center justify-center">
                <div className="bg-white p-[40px] rounded-[24px] shadow-[0px_2px_4px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center justify-center pt-[5px]">
                        <UserProfilePicture
                            customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden text-white font-medium text-4xl"
                            customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover"
                            customSize={120}
                            user={currentUser}
                        />
                        <BrokenLink version="2" className="h-[30px] w-[30px] mx-3" />
                        <UserProfilePicture
                            customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden text-white font-medium text-4xl"
                            customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover"
                            customSize={120}
                            user={user}
                        />
                    </div>
                    <h1 className="font-notoSans text-[22px] font-semibold text-center text-grayscale-900 mt-7">
                        Connection Link Expired
                    </h1>
                    <p className="text-center font-poppins text-[17px] text-grayscale-900 mt-5 max-w-[295px]">
                        Would you like to connect to{' '}
                        <span className="font-semibold">{user?.displayName}</span>?
                    </p>
                </div>
                <ExpiredInviteLinkFooter
                    buttonText="Send Request"
                    buttonAction={e => handleRequestButton(e)}
                    buttonClassName="!bg-emerald-700"
                />
            </div>
        </section>
    );
};

export default ExpiredInviteLink;
