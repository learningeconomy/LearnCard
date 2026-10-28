import { Capacitor } from '@capacitor/core';
import {
    setPrivateKey as setWebSecurePrivateKey,
    getPrivateKey as getWebSecurePrivateKey,
    clearPrivateKey as clearWebSecurePrivateKey,
} from 'learn-card-base/security/webSecureStorage';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { sqliteStore } from 'learn-card-base/stores/sqliteStore';
import { waitForSQLiteReady } from 'learn-card-base/SQL/sqliteReady';
import { withSQLiteDatabase } from 'learn-card-base/SQL/connection';
import { getLogger } from '../logging/logger';

const log = getLogger('platform-private-key-storage');

const userFilter = (): { clause: string; values: string[] } => {
    const user = currentUserStore.get.currentUser();
    if (user?.uid) return { clause: 'WHERE uid = ?', values: [user.uid] };
    const verifierId = user && 'verifierId' in user ? user.verifierId : undefined;
    if (typeof verifierId === 'string' && verifierId)
        return { clause: 'WHERE verifierId = ?', values: [verifierId] };
    if (user?.email) return { clause: 'WHERE email = ?', values: [user.email] };
    return { clause: '', values: [] };
};

export async function setPlatformPrivateKey(pk: string): Promise<void> {
    if (!pk) throw new Error('No private key provided');
    if (Capacitor.getPlatform() === 'web') {
        await setWebSecurePrivateKey(pk);
        return;
    }
    await waitForSQLiteReady();
    const db = sqliteStore.get.db();
    if (!db) {
        currentUserStore.set.currentUserPK(pk);
        return;
    }
    const user = currentUserStore.get.currentUser();
    const filter = userFilter();
    try {
        await withSQLiteDatabase(db, async connection => {
            await connection.run(`UPDATE users SET privateKey = ? ${filter.clause}`, [
                pk,
                ...filter.values,
            ]);
            const check = await connection.query(
                `SELECT privateKey FROM users ${filter.clause} LIMIT 1`,
                filter.values
            );
            // A keyed UPDATE can match no row during login hydration.
            if (check?.values?.[0]?.privateKey !== pk) {
                const verifierId =
                    user && 'verifierId' in user && typeof user.verifierId === 'string'
                        ? user.verifierId
                        : '';
                await connection.run(
                    `INSERT INTO users (
                    email, name, profileImage, aggregateVerifier, verifier, verifierId,
                    typeOfLogin, dappShare, privateKey, baseColor, uid, phoneNumber
                ) VALUES (?, '', '', '', '', ?, '', '', ?, '', ?, '')`,
                    [user?.email ?? '', verifierId, pk, user?.uid ?? '']
                );
            }
        });
    } catch (error) {
        log.warn('setPlatformPrivateKey: sqlite error', error);
        currentUserStore.set.currentUserPK(pk);
    }
}

export async function getPlatformPrivateKey(): Promise<string | null> {
    if (Capacitor.getPlatform() === 'web') return getWebSecurePrivateKey();
    await waitForSQLiteReady();
    const db = sqliteStore.get.db();
    if (!db) return null;
    const filter = userFilter();
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const key = await withSQLiteDatabase(db, async connection => {
                if (filter.clause) {
                    const keyed = (
                        await connection.query(
                            `SELECT privateKey FROM users ${filter.clause} LIMIT 1`,
                            filter.values
                        )
                    )?.values?.[0]?.privateKey;
                    if (typeof keyed === 'string' && keyed) return keyed;
                }
                // Identifiers may not yet be hydrated on cold boot.
                const any = (
                    await connection.query(
                        "SELECT privateKey FROM users WHERE privateKey IS NOT NULL AND privateKey != '' LIMIT 1"
                    )
                )?.values?.[0]?.privateKey;
                return typeof any === 'string' && any ? any : null;
            });
            if (key) return key;
        } catch (error) {
            log.warn(`getPlatformPrivateKey: sqlite error (attempt ${attempt + 1})`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    return null;
}

export async function clearPlatformPrivateKey(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
        await clearWebSecurePrivateKey();
        return;
    }
    const db = sqliteStore.get.db();
    if (!db) return;
    const filter = userFilter();
    try {
        await withSQLiteDatabase(db, async connection => {
            await connection.run(
                `UPDATE users SET privateKey = NULL ${filter.clause}`,
                filter.values
            );
        });
    } catch (error) {
        // Logout may already have cleared or deleted the database.
        log.warn('clearPlatformPrivateKey: sqlite error (likely db already cleared)', error);
    }
}
