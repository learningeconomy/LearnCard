import { Capacitor } from '@capacitor/core';
import { createAdaptiveStorage } from '@learncard/sss-key-manager';
import type { SSSStorageFunctions } from '@learncard/sss-key-manager';

import { createNativeSSSStorage } from './nativeSSSStorage';

/**
 * Storage for SSS device-side secrets (device share, pending escrow recovery).
 *
 * Native Capacitor uses encrypted SQLite because iOS WKWebView may evict
 * IndexedDB under storage pressure; anything that must survive days (a 7-day
 * escrow hold) cannot live there. Web uses adaptive storage, which routes to
 * sessionStorage when the user enabled "public computer" mode.
 */
export const createDeviceShareStorage = (): SSSStorageFunctions =>
    Capacitor.isNativePlatform() ? createNativeSSSStorage() : createAdaptiveStorage();
