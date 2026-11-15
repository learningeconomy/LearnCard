import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('./config/environment', () => ({ isDebugEnvironmentEnabled: () => true }));

import config from '../capacitor.config';
import {
    installRedactedBridgeLogging,
    summarizeBridgeCall,
    summarizeBridgeResult,
} from './nativeBridgeLogging';

// Fake material only; the assertions check it never reaches a log.
const SECRET = 'f00dfeedf00dfeedf00dfeedf00dfeedf00dfeedf00dfeedf00dfeedf00dfeed';

const keyQueryCall = {
    callbackId: '7',
    pluginId: 'CapacitorSQLite',
    methodName: 'query',
    options: {
        database: 'learncard',
        statement: 'SELECT DISTINCT privateKey FROM users WHERE uid = ?',
        values: ['user-1'],
    },
};
const keyQueryResult = {
    callbackId: '7',
    pluginId: 'CapacitorSQLite',
    methodName: 'query',
    success: true,
    data: { values: [{ privateKey: SECRET }] },
};
const keyInsertCall = {
    callbackId: '8',
    pluginId: 'CapacitorSQLite',
    methodName: 'run',
    options: {
        statement: 'INSERT INTO users (uid, privateKey) VALUES (?, ?)',
        values: ['u', SECRET],
    },
};

afterEach(() => vi.restoreAllMocks());

describe('bridge log redaction', () => {
    it('logs the statement and row count of a key query, never the key', () => {
        expect(summarizeBridgeResult(keyQueryResult)).toEqual({
            success: true,
            keys: ['values'],
            rows: 1,
        });
        expect(summarizeBridgeCall(keyQueryCall)).toEqual({
            keys: ['database', 'statement', 'values'],
            statement: 'SELECT DISTINCT privateKey FROM users WHERE uid = ?',
            valueCount: 1,
        });
        expect(JSON.stringify(summarizeBridgeCall(keyInsertCall))).not.toContain(SECRET);
    });

    it('blanks literals inlined into logged SQL', () => {
        const call = {
            options: {
                statement: `UPDATE users SET privateKey = '${SECRET}' WHERE id = "a""b"`,
                set: [{ statement: `INSERT INTO t VALUES ('${SECRET}', 'it''s')` }],
            },
        };
        expect(summarizeBridgeCall(call)).toMatchObject({
            statement: 'UPDATE users SET privateKey = ? WHERE id = ?',
            statements: ['INSERT INTO t VALUES (?, ?)'],
        });
    });

    it('logs only key names for other plugins and nothing from errors', () => {
        expect(
            summarizeBridgeResult({ success: true, data: { value: SECRET, token: SECRET } })
        ).toEqual({ success: true, keys: ['token', 'value'] });
        expect(summarizeBridgeResult({ success: false, data: { message: SECRET } })).toEqual({
            success: false,
        });
        expect(
            JSON.stringify(summarizeBridgeCall({ options: { key: 'k', value: SECRET } }))
        ).not.toContain(SECRET);
    });

    it('replaces the bridge hooks the way native-bridge.js calls them, so no value reaches the console', () => {
        const output: unknown[] = [];
        for (const method of [
            'log',
            'debug',
            'info',
            'dir',
            'warn',
            'error',
            'groupCollapsed',
        ] as const) {
            vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
                output.push(args);
            });
        }
        // What native-bridge.js used to install: full payload logging.
        const bridge = {
            isLoggingEnabled: true,
            logToNative: (call: unknown) => console.dir(call),
            logFromNative: (result: { data?: unknown }) => console.dir(JSON.stringify(result.data)),
        };
        installRedactedBridgeLogging(bridge, true);

        // native-bridge.js: `if (cap.isLoggingEnabled && ...) cap.logToNative(callData)` / logFromNative(result)
        if (bridge.isLoggingEnabled) {
            bridge.logToNative(keyInsertCall);
            bridge.logToNative(keyQueryCall);
            bridge.logFromNative(keyQueryResult);
        }

        expect(output.length).toBe(3);
        expect(JSON.stringify(output)).not.toContain(SECRET);
        expect(JSON.stringify(output)).toContain('rows');
    });

    it('turns the redacted log off outside debug builds', () => {
        const bridge: { isLoggingEnabled?: boolean } = { isLoggingEnabled: true };
        installRedactedBridgeLogging(bridge, false);
        expect(bridge.isLoggingEnabled).toBe(false);
    });

    it('ships native config with Capacitor bridge logging off', () => {
        expect(config.loggingBehavior).toBe('none');
    });
});
