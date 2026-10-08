import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface ShakeObserverStartOptions {
    /** Minimum total acceleration, expressed in multiples of standard gravity. */
    threshold: number;
    /** Native debounce window applied before another shake event may be emitted. */
    cooldownMs: number;
}

export interface ShakeObserverPlugin {
    start(options: ShakeObserverStartOptions): Promise<void>;
    stop(): Promise<void>;
    addListener(eventName: 'shake', listener: () => void): Promise<PluginListenerHandle>;
}

/**
 * Physical tuning lives at the JS/native boundary so iOS and Android always
 * receive the same conservative threshold and native debounce window.
 */
export const SHAKE_OBSERVER_OPTIONS: ShakeObserverStartOptions = {
    threshold: 2.7,
    cooldownMs: 2_000,
};

export const ShakeObserver = registerPlugin<ShakeObserverPlugin>('ShakeObserver');
