import { createStore } from '@udecode/zustood';

export const sideMenuStore = createStore('sideMenuStore')<{
    isCollapsed: boolean;
}>(
    {
        isCollapsed: false,
    },
    { persist: { name: 'sideMenuStore', enabled: true } }
);

export const useIsCollapsed = sideMenuStore.use.isCollapsed;

export default sideMenuStore;
