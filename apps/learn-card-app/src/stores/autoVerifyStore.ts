import { createStore } from '@udecode/zustood';

export const autoVerifyStore = createStore('autoVerifyStore')<{
    verifySuccessTick: number;
}>({
    verifySuccessTick: 0,
}).extendActions(set => ({
    markVerifySuccess: () => {
        set.state(state => {
            state.verifySuccessTick += 1;
        });
    },
}));

export const useVerifySuccessTick = autoVerifyStore.useTracked.verifySuccessTick;

export default autoVerifyStore;
