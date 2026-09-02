import { Capacitor } from '@capacitor/core';

import {
    setPrivateKey as setWebSecurePrivateKey,
    getPrivateKey as getWebSecurePrivateKey,
    clearPrivateKey as clearWebSecurePrivateKey,
} from 'learn-card-base/security/webSecureStorage';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { sqliteStore } from 'learn-card-base/stores/sqliteStore';
import { waitForSQLiteReady } from 'learn-card-base/SQL/sqliteReady';

// Platform-aware private key storage helpers
// - Web: delegates to AES-GCM + IndexedDB secure storage
// - Native (Capacitor): stores/reads from encrypted SQLite `users.privateKey`

import { getLogger } from '../logging/logger';
const log = getLogger('platform-private-key-storage');

export async function setPlatformPrivateKey(pk: string): Promise<void> {
    if (!pk) throw new Error('No private key provided');

    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
        // Web: secure storage (AES-GCM + IndexedDB)
        await setWebSecurePrivateKey(pk);
        return;
    }

    // Native: store in SQLite (encrypted DB). Wait for the SQLite plugin to be
    // ready first — symmetric with getPlatformPrivateKey. Without this, a write
    // during the login race hits the null-db fallback below and only lands in
    // memory, so the key is lost on hard close (the offline-boot regression).
    await waitForSQLiteReady();

    const db = sqliteStore.get.db();

    if (!db) {
        // Fallback: just set on the in-memory store
        currentUserStore.set.currentUserPK(pk);
        return;
    }

    const user = currentUserStore.get.currentUser();
    const uid = user?.uid || '';
    const verifierId =
        user && typeof (user as { verifierId?: string }).verifierId === 'string'
            ? (user as { verifierId?: string }).verifierId || ''
            : '';
    const email = user?.email || '';

    let where = '';
    if (uid) where = `WHERE uid="${uid}"`;
    else if (verifierId) where = `WHERE verifierId="${verifierId}"`;
    else if (email) where = `WHERE email="${email}"`;

    try {
        await db.open();

        await db.execute(`UPDATE users SET privateKey="${pk}" ${where}`);

        // A keyed UPDATE matches nothing when the row doesn't exist yet, and
        // SQLite reports no error — verify the write actually landed, and insert
        // a row keyed to this user if it didn't. Otherwise the key silently
        // vanishes and offline boot can't reconstruct the wallet.
        const check = await db.query(
            where
                ? `SELECT privateKey FROM users ${where} LIMIT 1`
                : 'SELECT privateKey FROM users LIMIT 1'
        );
        const persisted = check?.values?.[0]?.privateKey;

        if (persisted !== pk) {
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
                    '${email}', '', '', '', '', '${verifierId}', '', '', '${pk}', '', '${uid}', ''
                )`);
        }
    } catch (e) {
        log.warn('setPlatformPrivateKey: sqlite error', e);
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

    // Wait for SQLite to finish initializing on native. Without this,
    // a cold start (e.g. Android killing the app process) can race:
    // the coordinator calls getCachedPrivateKey before the SQLite plugin
    // has set sqliteStore.db, causing the pk-first path to fail and
    // falling through to Web3Auth with a potentially stale token.
    await waitForSQLiteReady();

    const db = sqliteStore.get.db();

    if (!db) return null;

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

    // Prefer the current user's row, but always fall back to ANY row that
    // actually holds a key — the current-user identifiers may not be rehydrated
    // yet at cold start, and a plain `LIMIT 1` can hit a keyless row.
    const keyedQuery = where ? `SELECT privateKey FROM users ${where} LIMIT 1` : null;
    const anyKeyQuery = `SELECT privateKey FROM users WHERE privateKey IS NOT NULL AND privateKey != '' LIMIT 1`;

    // The shared SQLite connection can transiently return empty right after a
    // cold start (open/close races with concurrent reads). The key IS on disk,
    // so retry a few times before giving up — otherwise pk-first boot falls
    // through to a network login and strands the user on the offline gate.
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await db.open();

            if (keyedQuery) {
                const keyed = (await db.query(keyedQuery))?.values?.[0]?.privateKey ?? null;
                if (typeof keyed === 'string' && keyed.length > 0) return keyed;
            }

            const any = (await db.query(anyKeyQuery))?.values?.[0]?.privateKey ?? null;
            if (typeof any === 'string' && any.length > 0) return any;
        } catch (e) {
            log.warn(`getPlatformPrivateKey: sqlite error (attempt ${attempt + 1})`, e);
        }

        await new Promise(resolve => setTimeout(resolve, 150));
    }

    return null;
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
        log.warn('clearPlatformPrivateKey: sqlite error (likely db already cleared)', e);
    } finally {
        try {
            if ((await db?.isDBOpen())?.result) await db?.close();
        } catch {}
    }
}
