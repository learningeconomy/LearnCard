import { createStore } from '@udecode/zustood';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

const keyboardStore = createStore('keyboard')({ isOpen: false });

if (Capacitor?.isNativePlatform()) {
    Keyboard?.addListener('keyboardDidShow', () => keyboardStore.set.isOpen(true));
    Keyboard?.addListener('keyboardDidHide', () => keyboardStore.set.isOpen(false));
}

export default keyboardStore;