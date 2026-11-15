import { Capacitor } from '@capacitor/core';

import { isDebugEnvironmentEnabled } from './config/environment';

/**
 * Redacted Capacitor bridge logging (see learn-card-base/src/config/nativeBridgeLogging.ts).
 *
 * Capacitor's native-bridge.js console-logs every plugin call and result in full when bridge logging
 * is on, which for CapacitorSQLite includes query rows (the stored private key) and bound values.
 * Native config now turns bridge logging off in every build. This module replaces the JS bridge's log
 * hooks in every build, so even if logging gets switched back on, only plugin/method names, SQL
 * statements, row counts and option/result key NAMES are logged, never values. Debug builds turn the
 * redacted log on.
 *
 * Imported first by src/index.tsx so it is in place before any plugin call.
 */
type BridgeCall = {
    callbackId?: string;
    pluginId?: string;
    methodName?: string;
    options?: unknown;
};
type BridgeResult = {
    callbackId?: string;
    pluginId?: string;
    methodName?: string;
    success?: boolean;
    data?: unknown;
};
type BridgeGlobal = {
    isLoggingEnabled?: boolean;
    logToNative?: (call: BridgeCall) => void;
    logFromNative?: (result: BridgeResult) => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const keyNames = (value: unknown): string[] => (isRecord(value) ? Object.keys(value).sort() : []);

/** A SQL statement with its quoted literals blanked, so values inlined into the SQL never get logged. */
export const redactStatement = (statement: string): string =>
    statement.replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"/g, '?');

/** What may be logged about a plugin call's options: SQL statements and key names, no values. */
export const summarizeBridgeCall = (call: BridgeCall): Record<string, unknown> => {
    const options = call.options;
    const summary: Record<string, unknown> = { keys: keyNames(options) };
    if (isRecord(options)) {
        if (typeof options.statement === 'string')
            summary.statement = redactStatement(options.statement);
        if (Array.isArray(options.set)) {
            summary.statements = options.set.map(entry =>
                isRecord(entry) && typeof entry.statement === 'string'
                    ? redactStatement(entry.statement)
                    : '?'
            );
        }
        if (Array.isArray(options.values)) summary.valueCount = options.values.length;
    }
    return summary;
};

/** What may be logged about a plugin result: success, row/change counts and key names, no values. */
export const summarizeBridgeResult = (result: BridgeResult): Record<string, unknown> => {
    if (result.success === false) return { success: false };
    const data = result.data;
    const summary: Record<string, unknown> = { success: true, keys: keyNames(data) };
    if (isRecord(data)) {
        if (Array.isArray(data.values)) summary.rows = data.values.length;
        const changes = isRecord(data.changes) ? data.changes.changes : undefined;
        if (typeof changes === 'number') summary.changes = changes;
    }
    return summary;
};

const label = (entry: { pluginId?: string; methodName?: string; callbackId?: string }) =>
    `${entry.pluginId ?? '?'}.${entry.methodName ?? '?'} (#${entry.callbackId ?? '?'})`;

export const installRedactedBridgeLogging = (
    bridge: BridgeGlobal | undefined = (globalThis as { Capacitor?: BridgeGlobal }).Capacitor,
    debug: boolean = isDebugEnvironmentEnabled()
): void => {
    if (!bridge) return;
    bridge.logToNative = call =>
        console.debug(`[bridge] → ${label(call)}`, summarizeBridgeCall(call));
    bridge.logFromNative = result =>
        console.debug(`[bridge] ← ${label(result)}`, summarizeBridgeResult(result));
    bridge.isLoggingEnabled = debug;
};

if (Capacitor.isNativePlatform()) installRedactedBridgeLogging();
