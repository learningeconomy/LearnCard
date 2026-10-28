import { registerPlugin } from '@capacitor/core';

import type { NativeDigitalCredentialsPlugin } from './types';

/** Android-only transport. Hosts must check status before registering or handling a request. */
export const nativeDigitalCredentials = registerPlugin<NativeDigitalCredentialsPlugin>(
    'NativeDigitalCredentials'
);
