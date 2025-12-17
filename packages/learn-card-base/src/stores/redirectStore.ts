import { createStore } from '@udecode/zustood';

export const redirectStore = createStore('redirectStore')<{
    authRedirect: string | null;
    lcnRedirect: string | null;
    email: string | null;
}>(
    { authRedirect: null, lcnRedirect: null, email: null },
    { persist: { name: 'redirectStore', enabled: true } }
);

export const useAuthRedirect = redirectStore.use.authRedirect;

export default redirectStore;
