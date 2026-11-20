import { useFlags } from 'launchdarkly-react-client-sdk';

import { environment } from '../../config/environment';

/**
 * LaunchDarkly `enableHcp` (boolean, off by default). Always on in `vite` dev builds so
 * the flow works against a local brain without a flag override. The route and the
 * entry card share this gate.
 */
export const useHcpEnabled = (): boolean => {
    const flags = useFlags();
    return environment.DEV || Boolean(flags.enableHcp);
};
