import { useState, useEffect } from 'react';
import { SafeArea } from 'capacitor-plugin-safe-area';

interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/**
 * Hook to get and observe device safe area insets
 * @returns {SafeAreaInsets} The current safe area insets
 */
export const useSafeArea = (): SafeAreaInsets => {
    // Initialize with zeros as fallback values
    const [insets, setInsets] = useState<SafeAreaInsets>({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    });

    useEffect(() => {
        // Function to get current safe area insets
        const getSafeAreaInsets = async () => {
            try {
                const { insets: _insets } = await SafeArea.getSafeAreaInsets();
                setInsets(_insets);
            } catch (error) {
                console.error('Failed to get safe area insets:', error);
            }
        };

        // Get insets on mount
        getSafeAreaInsets();

        // Handle orientation changes and other events that might change safe areas
        window.addEventListener('resize', getSafeAreaInsets);

        if (typeof window !== 'undefined') {
            // For iOS orientation changes
            window.addEventListener('orientationchange', getSafeAreaInsets);
        }

        // Clean up listeners on unmount
        return () => {
            window.removeEventListener('resize', getSafeAreaInsets);
            if (typeof window !== 'undefined') {
                window.removeEventListener('orientationchange', getSafeAreaInsets);
            }
        };
    }, []);

    return insets;
};
