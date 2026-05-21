import { useFlags } from 'launchdarkly-react-client-sdk';

export const useRenderMethodEnabled = (): boolean => useFlags()?.enableRenderMethod === true;
