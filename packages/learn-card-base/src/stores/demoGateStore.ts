import { createStore } from '@udecode/zustood';

/**
 * Controls the "Sample Wallet" gate sheet — shown when a user attempts a
 * real (write) action while demo mode is active. Lives in a store (not React
 * context) so non-React code paths (react-query MutationCache, global
 * rejection handlers) can open the sheet.
 */
export const demoGateStore = createStore('demoGateStore')<{
    isGateOpen: boolean;
    actionLabel: string | null;
}>({
    isGateOpen: false,
    actionLabel: null,
}).extendActions(set => ({
    openGate: (actionLabel?: string) => {
        set.state(state => {
            state.isGateOpen = true;
            state.actionLabel = actionLabel ?? null;
        });
    },

    closeGate: () => {
        set.state(state => {
            state.isGateOpen = false;
            state.actionLabel = null;
        });
    },
}));

export default demoGateStore;
