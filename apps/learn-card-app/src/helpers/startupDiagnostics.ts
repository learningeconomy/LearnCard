import { isDebugEnvironmentEnabled } from '../config/environment';

type StartupPhase = 'entry' | 'tenant' | 'updater' | 'flags' | 'react' | 'consent' | 'unavailable';

/** Development timings contain fixed phase names only, never account or credential data. */
export const markStartupPhase = (phase: StartupPhase): void => {
    if (isDebugEnvironmentEnabled() && typeof performance.mark === 'function')
        performance.mark(`learncard:startup:${phase}`);
};
