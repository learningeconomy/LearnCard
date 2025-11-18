import React from 'react';

import {
    useModal,
    useGetCurrentLCNUser,
    useGetAvailableProfiles,
    UserProfilePicture,
} from 'learn-card-base';

import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';

import { LCNProfile } from '@learncard/types';

type SelectIssuerModalProps = {
    currentIssuer: LCNProfile;
    setNewIssuer: (newIssuer: LCNProfile) => void;
};

const SelectIssuerModal: React.FC<SelectIssuerModalProps> = ({ currentIssuer, setNewIssuer }) => {
    const { closeModal } = useModal();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { data: paginatedProfiles } = useGetAvailableProfiles({ isServiceProfile: true });

    const profiles = [
        currentLCNUser,
        ...(paginatedProfiles?.records?.map(profile => profile.profile) ?? []),
    ];

    return (
        <div className="flex flex-col gap-[20px] text-grayscale-900 py-[30px] px-[20px]">
            <h1 className="text-[24px] text-center">Select Issuer</h1>
            <section className="flex flex-col gap-[10px]">
                {profiles?.map((profile, index) => {
                    const isSelected = profile?.did === currentIssuer.did;
                    return (
                        <button
                            key={index}
                            className="flex gap-[10px] items-center py-[5px] px-[10px] border-[1px] border-grayscale-200 border-solid rounded-[15px]"
                            onClick={() => {
                                setNewIssuer(profile);
                                closeModal();
                            }}
                        >
                            <UserProfilePicture
                                customContainerClass="flex justify-center items-center w-[40px] h-[40px] max-w-[40px] max-h-[40px] shrink-0 rounded-full overflow-hidden text-white font-medium text-2xl "
                                customImageClass="flex justify-center items-center w-[40px] h-[40px] max-w-[40px] max-h-[40px] rounded-full overflow-hidden object-cover shrink-0"
                                customSize={120}
                                user={profile}
                            />
                            <span className="font-[500] text-[18px] line-clamp-1">
                                {profile?.displayName}
                            </span>
                            {isSelected && (
                                <CircleCheckmark className="ml-auto h-[30px] w-[30px]" />
                            )}
                        </button>
                    );
                })}
            </section>
            <button onClick={closeModal} className="text-grayscale-600">
                Cancel
            </button>
        </div>
    );
};

export default SelectIssuerModal;
