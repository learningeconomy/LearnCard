import type { LearnCardAppEnvironment } from './buildEnvironment';

declare const __APP_BUILD_ENV__: LearnCardAppEnvironment;

export const environment: Readonly<LearnCardAppEnvironment> = Object.freeze(__APP_BUILD_ENV__);

export const isDebugEnvironmentEnabled = (): boolean =>
    typeof window !== 'undefined' && (environment.VITE_ENABLE_AUTH_DEBUG_WIDGET || environment.DEV);
