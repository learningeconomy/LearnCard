import { beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const native = vi.hoisted(() => ({ prepareEncryptedDatabase: vi.fn() }));
vi.mock('@capacitor-community/sqlite', () => ({ CapacitorSQLite: native }));

import { prepareNativeEncryption } from './nativeEncryption';

beforeEach(() => vi.resetAllMocks());

it('installs the reviewed native helpers byte-for-byte through the pinned dependency patch', () => {
    const require = createRequire(import.meta.url);
    const installed = dirname(require.resolve('@capacitor-community/sqlite/package.json'));
    const source = resolve(dirname(fileURLToPath(import.meta.url)), '../../native/sqlite');
    for (const [file, path] of [
        ['LearnCardEncryptedDatabase.swift', 'ios/Plugin/Utils/LearnCardEncryptedDatabase.swift'],
        [
            'LearnCardEncryptedDatabase.java',
            'android/src/main/java/com/getcapacitor/community/database/sqlite/SQLite/LearnCardEncryptedDatabase.java',
        ],
    ]) {
        expect(readFileSync(resolve(installed, path), 'utf8')).toBe(
            readFileSync(resolve(source, file), 'utf8')
        );
    }
});

it('requires native preparation without transmitting a storage secret', async () => {
    native.prepareEncryptedDatabase.mockResolvedValue({
        version: 1,
        encrypted: true,
        migrated: true,
    });
    expect(await prepareNativeEncryption()).toBe('encrypted');
    expect(native.prepareEncryptedDatabase).toHaveBeenCalledWith({ database: 'learncardDB' });
});

it('keeps an older binary usable only when its native preparation method is unimplemented', async () => {
    native.prepareEncryptedDatabase.mockRejectedValue({ code: 'UNIMPLEMENTED' });
    expect(await prepareNativeEncryption()).toBe('legacy');
    expect(native.prepareEncryptedDatabase).toHaveBeenCalledOnce();
});

it.each([
    new Error('UNIMPLEMENTED'),
    { message: 'not implemented' },
    { code: 'UNAVAILABLE' },
    { code: 'UNIMPLEMENTED ' },
    { code: 'KEYSTORE_ERROR' },
])('does not downgrade for a preparation failure or an error message: %s', async error => {
    native.prepareEncryptedDatabase.mockRejectedValue(error);
    await expect(prepareNativeEncryption()).rejects.toBe(error);
});

it.each([
    { version: 0, encrypted: true },
    { version: 1, encrypted: false },
])('rejects unsupported preparation: %s', async result => {
    native.prepareEncryptedDatabase.mockResolvedValue(result);
    await expect(prepareNativeEncryption()).rejects.toThrow('Encrypted native account storage');
});

it('propagates failure without a plaintext fallback', async () => {
    native.prepareEncryptedDatabase.mockRejectedValue(new Error('Storage preparation failed'));
    await expect(prepareNativeEncryption()).rejects.toThrow('Storage preparation failed');
    expect(native.prepareEncryptedDatabase).toHaveBeenCalledOnce();
});
