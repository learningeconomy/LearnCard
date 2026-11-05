import { atom } from 'nanostores';
import { auth } from './authStore';
import type { LCNProfile } from '@learncard/types';

type ProfileState = {
    profile: LCNProfile | null;
};

// Initialize with null values - we'll update from localStorage on the client
const initialState: ProfileState = {
    profile: null,
};

export const profile = atom<ProfileState>(initialState);

// Initialize auth state from localStorage on the client side
if (typeof window !== 'undefined') {
    const storedProfile = window.localStorage.getItem('profile');

    if (storedProfile) profile.set({ profile: JSON.parse(storedProfile) });
}

export function setProfile(profileArg: LCNProfile) {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('profile', JSON.stringify(profileArg));
    }

    profile.set({ profile: profileArg });
}

export async function getProfile() {
    const { did } = auth.get();
    const existingProfile = profile.get().profile;

    if (existingProfile) {
        return existingProfile;
    }

    if (!did) return {};

    const profileId = did.split(':').at(-1);
    const res = await fetch(`https://network.learncard.com/api/profile/${profileId}`);

    const newProfile = await res.json();

    setProfile(newProfile);

    return newProfile;
}
