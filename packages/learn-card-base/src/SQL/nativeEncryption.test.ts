import { beforeEach, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({ prepareEncryptedDatabase: vi.fn() }));
vi.mock('@capacitor-community/sqlite', () => ({ CapacitorSQLite: native }));

import { prepareNativeEncryption } from './nativeEncryption';

beforeEach(() => vi.resetAllMocks());

it('requires native preparation without transmitting a storage secret', async () => {
    native.prepareEncryptedDatabase.mockResolvedValue({
        version: 1,
        encrypted: true,
        migrated: true,
    });
    await prepareNativeEncryption();
    expect(native.prepareEncryptedDatabase).toHaveBeenCalledWith({ database: 'learncardDB' });
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
