import { useEffect, useState } from 'react';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export function useKeyboardHeight(offset = 0): number {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') {
            return;
        }

        const show = Keyboard?.addListener?.('keyboardDidShow', (info: KeyboardInfo) => {
            setKeyboardHeight(Math.max(0, info.keyboardHeight - offset));
        });
        const hide = Keyboard?.addListener?.('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });
        const willHide = Keyboard?.addListener?.('keyboardWillHide', () => {
            setKeyboardHeight(0);
        });

        return () => {
            show?.remove?.();
            hide?.remove?.();
            willHide?.remove?.();
        };
    }, [offset]);

    return keyboardHeight;
}
