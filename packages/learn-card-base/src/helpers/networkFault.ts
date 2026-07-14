import { createStore } from '@udecode/zustood';

/**
 * Dev-only network fault injection for testing offline/boot-resilience.
 *
 * Unlike the connectivity override (which only flips a UI flag), this stalls or
 * fails the ACTUAL bounded network calls at boot — so the `withDeadline` budgets
 * in the AuthCoordinator and wallet init genuinely fire, reproducing the
 * airplane-mode hang in a plain simulator/browser. Armed only from the debug
 * widget; the store defaults to `off` and is a hard no-op in production.
 *
 *  - `off`   — pass through untouched
 *  - `delay` — sleep `delayMs` before the real call (set > a deadline to trip it)
 *  - `fail`  — reject after a short delay, simulating a hard network error
 */
export type NetworkFaultMode = 'off' | 'delay' | 'fail';

export const networkFaultStore = createStore('networkFaultStore')<{
    mode: NetworkFaultMode;
    delayMs: number;
}>(
    { mode: 'off', delayMs: 30000 },
    // Persisted so an armed fault survives a reload and actually affects the
    // NEXT boot — which is the whole point of testing the boot-hang path.
    { persist: { name: 'networkFaultStore', enabled: true } }
);

const isProd = process.env.NODE_ENV === 'production';

export const injectNetworkFault = async (label: string): Promise<void> => {
    if (isProd) return;

    const mode = networkFaultStore.get.mode();

    if (mode === 'off') return;

    const delayMs = networkFaultStore.get.delayMs();

    if (mode === 'delay') {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return;
    }

    await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 500)));
    throw new Error(`[network-fault] simulated failure at "${label}"`);
};

export const withNetworkFault = async <T>(label: string, op: () => Promise<T>): Promise<T> => {
    await injectNetworkFault(label);
    return op();
};
