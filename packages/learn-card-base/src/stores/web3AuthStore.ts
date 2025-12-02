import { SafeEventEmitterProvider } from '@web3auth/base';
import { createStore } from '@udecode/zustood';

export const web3AuthStore = createStore('web3AuthStore')<{
    web3Auth: any | null;
    provider: SafeEventEmitterProvider | null;
}>({ web3Auth: null, provider: null });
export default web3AuthStore;
