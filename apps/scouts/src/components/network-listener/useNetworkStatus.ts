import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import type { PluginListenerHandle } from '@capacitor/core';

export function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState<boolean | undefined>();

    useEffect(() => {
        let listenerHandle: PluginListenerHandle | undefined;

        // Check network status once on mount
        const checkNetworkStatus = async () => {
            const status = await Network.getStatus();
            setIsConnected(status.connected);
        };
        checkNetworkStatus();

        // Create a helper to set up the listener
        const setupListener = async () => {
            listenerHandle = await Network.addListener('networkStatusChange', status => {
                if (isConnected !== status.connected) {
                    setIsConnected(status.connected);
                }
            });
        };
        setupListener();

        // Cleanup
        return () => {
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, []);

    return isConnected;
}
