/** The native host deliberately has no web telemetry or logs containing account state. */
const noop = (): void => {};
export const getLogger = () => ({ debug: noop, info: noop, warn: noop, error: noop });
