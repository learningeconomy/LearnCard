import { createStore } from '@udecode/zustood';

export const firebaseAuthStore = createStore('firebaseAuthStore')<{
    firebaseAuth: any | null;
    currentUser: {
        uid: string | null | undefined;
        email: string | null | undefined;
        phoneNumber: string | null | undefined;
        displayName: string | null | undefined;
        photoUrl: string | null | undefined;
    } | null;
}>(
    { firebaseAuth: null, currentUser: null },
    { persist: { name: 'firebaseAuth', enabled: true } }
).extendActions((set, get) => ({
    setFirebaseCurrentUser: (
        user: {
            uid: string | null | undefined;
            email: string | null | undefined;
            phoneNumber: string | null | undefined;
            displayName: string | null | undefined;
            photoUrl: string | null | undefined;
        } | null
    ) => {
        if (!user) return;
        if (user) {
            const _user = {
                uid: user?.uid,
                email: user?.email,
                displayName: user?.displayName,
                phoneNumber: user?.phoneNumber,
                photoUrl: user?.photoUrl ?? user?.photoURL,
            };
            set.currentUser({ ..._user });
        }
    },
}));
export default firebaseAuthStore;
