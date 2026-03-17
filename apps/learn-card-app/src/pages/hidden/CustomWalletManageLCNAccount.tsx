import React, { useState, useEffect } from 'react';
import { useImmer } from 'use-immer';
import omit from 'lodash-es/omit';
import { LCNProfile } from '@learncard/types';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { curriedStateSlice } from '@learncard/helpers';

type CustomWalletManageLCNAccountProps = {
    wallet: BespokeLearnCard;
};

const CustomWalletManageLCNAccount: React.FC<CustomWalletManageLCNAccountProps> = ({ wallet }) => {
    const [loading, setLoading] = useState(false);

    const [profile, setProfile] = useImmer<Omit<LCNProfile, 'did' | 'isServiceProfile'>>({
        profileId: '',
        displayName: '',
        bio: '',
        email: '',
        image: '',
    });

    const hasProfile = wallet.id.did().startsWith('did:web');

    const updateSlice = curriedStateSlice(setProfile);

    const textHandler =
        (slice: keyof typeof profile) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                updateSlice(slice, e.target.value);

    useEffect(() => {
        wallet.invoke.getProfile().then(userProfile => {
            if (userProfile) setProfile(userProfile);
        });
    }, []);

    return (
        <form
            className="p-16 flex border flex-col gap-8 items-center justify-center text-black"
            onSubmit={async e => {
                e.preventDefault();
                setLoading(true);
                if (hasProfile) await wallet.invoke.updateProfile(omit(profile, 'profileId'));
                else await wallet.invoke.createProfile(profile);
                setLoading(false);
            }}
        >
            <fieldset className="border p-8 w-full">
                <legend>Required</legend>

                <label className="flex gap-2 w-full">
                    profileId
                    <input
                        value={profile.profileId}
                        onChange={textHandler('profileId')}
                        required
                        className="bg-white border flex-grow"
                        type="text"
                    />
                </label>
            </fieldset>

            <fieldset className="border p-8 w-full flex flex-col gap-4">
                <legend>Optional</legend>

                <label className="flex gap-2 w-full">
                    displayName
                    <input
                        value={profile.displayName}
                        onChange={textHandler('displayName')}
                        className="bg-white border flex-grow"
                        type="text"
                    />
                </label>

                <label className="flex gap-2 w-full">
                    bio
                    <textarea
                        onChange={textHandler('bio')}
                        className="bg-white border flex-grow"
                        defaultValue={profile.bio}
                    />
                </label>

                <label className="flex gap-2 w-full">
                    email
                    <input
                        value={profile.email}
                        onChange={textHandler('email')}
                        className="bg-white border flex-grow"
                        type="text"
                    />
                </label>

                <label className="flex gap-2 w-full">
                    image
                    <input
                        value={profile.image}
                        onChange={textHandler('image')}
                        className="bg-white border flex-grow"
                        type="text"
                    />
                </label>
            </fieldset>

            <button
                type="submit"
                className="transition-colors h-full w-full rounded border border-solid py-2 border-emerald-600 hover:text-white hover:bg-emerald-600"
            >
                {loading
                    ? hasProfile
                        ? 'Updating...'
                        : 'Creating...'
                    : hasProfile
                        ? 'Update'
                        : 'Create'}
            </button>
        </form>
    );
};

export default CustomWalletManageLCNAccount;
