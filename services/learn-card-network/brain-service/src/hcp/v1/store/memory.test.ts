import { createMemoryHcpV1Store } from './memory';
import { describeHcpV1StoreContract } from './store.contract';

describeHcpV1StoreContract('memory', () => {
    const store = createMemoryHcpV1Store();
    return { store, reset: async () => undefined };
});
