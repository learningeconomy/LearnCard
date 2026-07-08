import { createStore } from '@udecode/zustood';

/**
 * Reactive signal for how the active wallet was built:
 *  - `full`    — networked wallet (normal online operation)
 *  - `offline` — local fallback (network was unavailable at build time); the
 *                app works read-only from local cache until it can upgrade
 *  - `null`    — no wallet yet
 *
 * Separate from `connectivityStore` (transport state) because the two can
 * diverge: a networked build can fail transiently while the device is online.
 * The UI reacts to this to show the "You're offline" affordance, and bumping
 * `upgradeNonce` lets that affordance force a networked-wallet rebuild attempt.
 */
export type WalletMode = 'full' | 'offline';

export const walletModeStore = createStore('walletModeStore')<{
    mode: WalletMode | null;
    upgradeNonce: number;
}>({ mode: null, upgradeNonce: 0 }).extendActions(set => ({
    requestUpgrade: () => set.upgradeNonce(Date.now()),
}));
