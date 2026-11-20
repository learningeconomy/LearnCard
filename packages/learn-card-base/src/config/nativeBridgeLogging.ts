/**
 * Capacitor's own bridge logging prints plugin payloads: native Android logs every call's options
 * (Bridge.java "callback: ..., methodData: ..."), iOS prints the first 256 characters of every result
 * ("⚡️  TO JS"), and the JS bridge console-logs every result (native-bridge.js `logFromNative`). For
 * CapacitorSQLite that includes query rows, such as the stored private key. Capacitor's default
 * ("debug") turns all of that on in every debuggable build, so it is switched off for every build;
 * debug builds re-enable a redacted JS-side log instead (apps/learn-card-app/src/nativeBridgeLogging.ts).
 */
export const NATIVE_BRIDGE_LOGGING = { loggingBehavior: 'none' } as const;

/** Applies the policy over a (tenant) capacitor.config.json, overriding whatever it set. */
export const withNativeBridgeLoggingPolicy = <T extends object>(
    config: T
): T & typeof NATIVE_BRIDGE_LOGGING => ({ ...config, ...NATIVE_BRIDGE_LOGGING });
