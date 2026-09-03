import type { ScoutsEnvironment } from './buildEnvironment';

declare const __SCOUTS_BUILD_ENV__: ScoutsEnvironment;

export const environment: Readonly<ScoutsEnvironment> = Object.freeze(__SCOUTS_BUILD_ENV__);

export const isDebugEnvironmentEnabled = (): boolean =>
    typeof window !== 'undefined' && (environment.VITE_ENABLE_AUTH_DEBUG_WIDGET || environment.DEV);
