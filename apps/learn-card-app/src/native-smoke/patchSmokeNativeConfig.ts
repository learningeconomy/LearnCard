export type SmokeNativePlatform = 'android' | 'ios';

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Smoke binaries must keep the web bundle baked into the build. Capgo
 * auto-update would replace it with the production channel, including that
 * channel's API hosts.
 */
export const patchSmokeCapacitorConfig = (
    raw: JsonRecord,
    platform: SmokeNativePlatform
): JsonRecord => {
    const next = JSON.parse(JSON.stringify(raw)) as JsonRecord;
    const plugins = next.plugins;
    const updater = isRecord(plugins) ? plugins.CapacitorUpdater : undefined;
    if (!isRecord(updater)) {
        throw new Error(
            `CapacitorUpdater is missing from the ${platform} capacitor config, so Capgo auto-update cannot be turned off.`
        );
    }

    updater.autoUpdate = false;

    if (platform === 'android') {
        const android = isRecord(next.android) ? next.android : {};
        android.webContentsDebuggingEnabled = true;
        next.android = android;
    }

    return next;
};
