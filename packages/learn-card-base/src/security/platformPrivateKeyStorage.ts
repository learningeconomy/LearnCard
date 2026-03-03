import { Capacitor } from '@capacitor/core';

import {
    setPrivateKey as setWebSecurePrivateKey,
    getPrivateKey as getWebSecurePrivateKey,
    clearPrivateKey as clearWebSecurePrivateKey,
} from 'learn-card-base/security/webSecureStorage';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { sqliteStore } from 'learn-card-base/stores/sqliteStore';

// Platform-aware private key storage helpers
// - Web: delegates to AES-GCM + IndexedDB secure storage
// - Native (Capacitor): stores/reads from encrypted SQLite `users.privateKey`

export async function setPlatformPrivateKey(pk: string): Promise<void> {
    if (!pk) throw new Error('No private key provided');

    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
        // Web: secure storage (AES-GCM + IndexedDB)
        await setWebSecurePrivateKey(pk);
        return;
    }

    // Native: store in SQLite (encrypted DB). Prefer updating current user's row.
    const db = sqliteStore.get.db();

    if (!db) {
        // Fallback: just set on the in-memory store
        currentUserStore.set.currentUserPK(pk);
        return;
    }

    try {
        await db.open();

        const user = currentUserStore.get.currentUser();
        let where = '';
        if (user?.uid) where = `WHERE uid="${user.uid}"`;
        else if (
            user &&
            'verifierId' in user &&
            typeof (user as { verifierId?: string }).verifierId === 'string' &&
            (user as { verifierId?: string }).verifierId
        )
            where = `WHERE verifierId="${(user as { verifierId?: string }).verifierId}"`;
        else if (user?.email) where = `WHERE email="${user.email}"`;

        if (where) {
            await db.execute(`UPDATE users SET privateKey="${pk}" ${where}`);
        } else {
            // Fallback: update any existing row, else insert minimal row
            const rows = await db.query('SELECT rowid as id FROM users');
            if ((rows?.values ?? []).length > 0) {
                await db.execute(`UPDATE users SET privateKey="${pk}"`);
            } else {
                await db.execute(`INSERT INTO users (
                    email,
                    name,
                    profileImage,
                    aggregateVerifier,
                    verifier,
                    verifierId,
                    typeOfLogin,
                    dappShare,
                    privateKey,
                    baseColor,
                    uid,
                    phoneNumber
                ) VALUES (
                    '', '', '', '', '', '', '', '', '${pk}', '', '', ''
                )`);
            }
        }
    } catch (e) {
        console.warn('setPlatformPrivateKey: sqlite error', e);
        // Also set in memory to avoid blocking login
        currentUserStore.set.currentUserPK(pk);
    } finally {
        try {
            if ((await db?.isDBOpen())?.result) await db?.close();
        } catch {}
    }
}

export async function getPlatformPrivateKey(): Promise<string | null> {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
        return getWebSecurePrivateKey();
    }

    const db = sqliteStore.get.db();

    if (!db) return null;

    try {
        await db.open();

        const user = currentUserStore.get.currentUser();
        let where = '';
        if (user?.uid) where = `WHERE uid="${user.uid}"`;
        else if (
            user &&
            'verifierId' in user &&
            typeof (user as { verifierId?: string }).verifierId === 'string' &&
            (user as { verifierId?: string }).verifierId
        )
            where = `WHERE verifierId="${(user as { verifierId?: string }).verifierId}"`;
        else if (user?.email) where = `WHERE email="${user.email}"`;

        const query = where
            ? `SELECT privateKey FROM users ${where} LIMIT 1`
            : 'SELECT privateKey FROM users LIMIT 1';

        const res = await db.query(query);
        const pk = res?.values?.[0]?.privateKey ?? null;

        if (typeof pk === 'string' && pk.length > 0) return pk;
        return null;
    } catch (e) {
        console.warn('getPlatformPrivateKey: sqlite error', e);
        return null;
    } finally {
        try {
            if ((await db?.isDBOpen())?.result) await db?.close();
        } catch {}
    }
}

export async function clearPlatformPrivateKey(): Promise<void> {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
        await clearWebSecurePrivateKey();
        return;
    }

    // On native, privateKey is in SQLite. If clearDB() is called (e.g., during logout),
    // the entire database is deleted, so we don't need to clear the privateKey column.
    // This function is a no-op on native to avoid trying to update a deleted/closed database.
    const db = sqliteStore.get.db();
    if (!db) return;

    try {
        // Check if db is actually open/usable before trying to use it
        const isOpen = await db.isDBOpen();
        if (!isOpen?.result) return;

        await db.open();

        const user = currentUserStore.get.currentUser();
        let where = '';
        if (user?.uid) where = `WHERE uid="${user.uid}"`;
        else if (
            user &&
            'verifierId' in user &&
            typeof (user as { verifierId?: string }).verifierId === 'string' &&
            (user as { verifierId?: string }).verifierId
        )
            where = `WHERE verifierId="${(user as { verifierId?: string }).verifierId}"`;
        else if (user?.email) where = `WHERE email="${user.email}"`;

        const sql = where
            ? `UPDATE users SET privateKey=NULL ${where}`
            : `UPDATE users SET privateKey=NULL`;
        await db.execute(sql);
    } catch (e) {
        console.warn('clearPlatformPrivateKey: sqlite error (likely db already cleared)', e);
    } finally {
        try {
            if ((await db?.isDBOpen())?.result) await db?.close();
        } catch {}
    }
}
