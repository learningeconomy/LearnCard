import { Capacitor } from '@capacitor/core';
import type { InAppMessage } from '@learncard/types';

/** Native subframes can reach Capacitor handlers outside our JavaScript bridge allowlist. */
export const canEmbedInAppMessageIframe = (): boolean => !Capacitor.isNativePlatform();

export const isInAppMessagePresentationSupported = (message: InAppMessage): boolean =>
    message.presentation !== 'iframe' || canEmbedInAppMessageIframe();
