#!/usr/bin/env tsx

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppleUserExport {
    firebaseUid: string;
    email: string | undefined;
    phoneNumber: string | undefined;
    displayName: string | undefined;
    oldAppleSub: string;
}

interface TransferIdRecord extends AppleUserExport {
    transferSub: string;
}

interface FinalMappingRecord extends TransferIdRecord {
    newAppleSub: string;
}

interface MigrationLogEntry {
    firebaseUid: string;
    oldAppleSub: string;
    newAppleSub: string;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
    timestamp: string;
}

interface CommonOptions {
    firebaseCredential: string;
    appleKey: string;
    appleKeyId: string;
    appleTeamId: string;
    appleClientId: string;
    targetTeamId: string;
    dataDir: string;
}

interface PostTransferOptions extends CommonOptions {
    dryRun: boolean;
    batchDelay: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const APPLE_MIGRATION_ENDPOINT = 'https://appleid.apple.com/auth/usermigrationinfo';
const APPLE_TOKEN_AUDIENCE = 'https://appleid.apple.com';
const CLIENT_SECRET_EXPIRY_SECONDS = 300; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

const FILES = {
    usersExport: 'users-export.json',
    transferIds: 'transfer-ids.json',
    finalMapping: 'final-mapping.json',
    migrationLog: 'migration-log.json',
} as const;

// ─── Apple Client Secret ─────────────────────────────────────────────────────

function generateAppleClientSecret(
    teamId: string,
    keyId: string,
    clientId: string,
    privateKey: string
): string {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
        iss: teamId,
        iat: now,
        exp: now + CLIENT_SECRET_EXPIRY_SECONDS,
        aud: APPLE_TOKEN_AUDIENCE,
        sub: clientId,
    };

    return jwt.sign(payload, privateKey, {
        algorithm: 'ES256',
        header: {
            alg: 'ES256',
            kid: keyId,
        },
    });
}

// ─── Apple Migration API ─────────────────────────────────────────────────────

async function callAppleMigrationApi(
    params: Record<string, string>,
    retryCount = 0
): Promise<Record<string, string>> {
    const response = await fetch(APPLE_MIGRATION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params),
    });

    if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);

        console.warn(`  Rate limited by Apple API, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

        await sleep(delay);

        return callAppleMigrationApi(params, retryCount + 1);
    }

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Apple API error ${response.status}: ${body}`);
    }

    return response.json() as Promise<Record<string, string>>;
}

async function getTransferSub(
    oldSub: string,
    targetTeamId: string,
    clientId: string,
    clientSecret: string
): Promise<string> {
    const result = await callAppleMigrationApi({
        sub: oldSub,
        target: targetTeamId,
        client_id: clientId,
        client_secret: clientSecret,
    });

    const transferSub = result.transfer_sub;

    if (!transferSub) {
        throw new Error(`No transfer_sub returned for sub=${oldSub}. Response: ${JSON.stringify(result)}`);
    }

    return transferSub;
}

async function exchangeTransferSub(
    transferSub: string,
    targetTeamId: string,
    clientId: string,
    clientSecret: string
): Promise<string> {
    const result = await callAppleMigrationApi({
        transfer_sub: transferSub,
        target: targetTeamId,
        client_id: clientId,
        client_secret: clientSecret,
    });

    const newSub = result.sub;

    if (!newSub) {
        throw new Error(`No sub returned for transfer_sub=${transferSub}. Response: ${JSON.stringify(result)}`);
    }

    return newSub;
}

// ─── Firebase Helpers ────────────────────────────────────────────────────────

function initFirebase(credentialPath: string): admin.app.App {
    const raw = fs.readFileSync(credentialPath, 'utf-8');
    const serviceAccount = JSON.parse(raw) as admin.ServiceAccount;

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

async function listAppleUsers(app: admin.app.App): Promise<AppleUserExport[]> {
    const auth = app.auth();
    const appleUsers: AppleUserExport[] = [];

    let pageToken: string | undefined;

    do {
        const listResult = await auth.listUsers(1000, pageToken);

        for (const user of listResult.users) {
            const appleProvider = user.providerData.find(p => p.providerId === 'apple.com');

            if (appleProvider) {
                appleUsers.push({
                    firebaseUid: user.uid,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    displayName: user.displayName,
                    oldAppleSub: appleProvider.uid,
                });
            }
        }

        pageToken = listResult.pageToken;
    } while (pageToken);

    return appleUsers;
}

async function migrateUser(
    app: admin.app.App,
    firebaseUid: string,
    newAppleSub: string
): Promise<void> {
    const auth = app.auth();

    // 1. Snapshot the full user record
    const userRecord = await auth.getUser(firebaseUid);
    const customClaims = userRecord.customClaims;

    // 2. Build updated provider data — swap the apple.com UID
    const updatedProviderData = userRecord.providerData.map(p => ({
        uid: p.providerId === 'apple.com' ? newAppleSub : p.uid,
        providerId: p.providerId,
        email: p.email,
        displayName: p.displayName,
        photoURL: p.photoURL,
    }));

    // 3. Delete the user
    await auth.deleteUser(firebaseUid);

    // 4. Re-import with same UID but updated Apple sub
    const importUser: admin.auth.UserImportRecord = {
        uid: firebaseUid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        phoneNumber: userRecord.phoneNumber,
        disabled: userRecord.disabled,
        providerData: updatedProviderData,
    };

    const importResult = await auth.importUsers([importUser]);

    if (importResult.failureCount > 0) {
        const importError = importResult.errors[0];
        throw new Error(`Import failed for ${firebaseUid}: ${importError?.error?.message ?? 'unknown error'}`);
    }

    // 5. Restore custom claims
    if (customClaims && Object.keys(customClaims).length > 0) {
        await auth.setCustomUserClaims(firebaseUid, customClaims);
    }
}

// ─── File I/O ────────────────────────────────────────────────────────────────

function ensureDataDir(dataDir: string): void {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function writeJson(dataDir: string, filename: string, data: unknown): void {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`  Saved → ${filePath}`);
}

function readJson<T>(dataDir: string, filename: string): T {
    const filePath = path.join(dataDir, filename);

    if (!fs.existsSync(filePath)) {
        throw new Error(`Required file not found: ${filePath}. Did you run the pre-transfer step first?`);
    }

    const raw = fs.readFileSync(filePath, 'utf-8');

    return JSON.parse(raw) as T;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readAppleKey(keyPath: string): string {
    if (!fs.existsSync(keyPath)) {
        throw new Error(`Apple private key not found: ${keyPath}`);
    }

    return fs.readFileSync(keyPath, 'utf-8');
}

// ─── Pre-Transfer Command ────────────────────────────────────────────────────

async function preTransfer(options: CommonOptions): Promise<void> {
    const {
        firebaseCredential,
        appleKey,
        appleKeyId,
        appleTeamId,
        appleClientId,
        targetTeamId,
        dataDir,
    } = options;

    console.log('\n=== SIWA Migration: Pre-Transfer ===\n');
    console.log(`  Source team:  ${appleTeamId}`);
    console.log(`  Target team:  ${targetTeamId}`);
    console.log(`  Client ID:    ${appleClientId}`);
    console.log(`  Data dir:     ${dataDir}\n`);

    ensureDataDir(dataDir);

    // 1. Initialize Firebase
    console.log('1. Connecting to Firebase...');
    const app = initFirebase(firebaseCredential);

    // 2. List all Apple users
    console.log('2. Listing Firebase users with apple.com provider...');
    const appleUsers = await listAppleUsers(app);
    console.log(`   Found ${appleUsers.length} user(s) with apple.com provider`);

    if (appleUsers.length === 0) {
        console.log('\n   No Apple users to migrate. Done.');
        await app.delete();
        return;
    }

    writeJson(dataDir, FILES.usersExport, appleUsers);

    // 3. Generate Apple client secret
    console.log('3. Generating Apple client secret JWT...');
    const privateKey = readAppleKey(appleKey);

    const clientSecret = generateAppleClientSecret(
        appleTeamId,
        appleKeyId,
        appleClientId,
        privateKey
    );

    // 4. Get transfer identifiers
    console.log('4. Fetching transfer identifiers from Apple...\n');

    const transferRecords: TransferIdRecord[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < appleUsers.length; i++) {
        const user = appleUsers[i]!;

        try {
            const transferSub = await getTransferSub(
                user.oldAppleSub,
                targetTeamId,
                appleClientId,
                clientSecret
            );

            transferRecords.push({
                ...user,
                transferSub,
            });

            successCount++;

            console.log(`   [${i + 1}/${appleUsers.length}] ${user.firebaseUid} — OK`);
        } catch (error) {
            failCount++;

            const message = error instanceof Error ? error.message : String(error);

            console.error(`   [${i + 1}/${appleUsers.length}] ${user.firebaseUid} — FAILED: ${message}`);
        }

        // Rate limit: ~2 requests/second to be safe
        if (i < appleUsers.length - 1) {
            await sleep(500);
        }
    }

    writeJson(dataDir, FILES.transferIds, transferRecords);

    console.log(`\n   Transfer IDs generated: ${successCount} succeeded, ${failCount} failed`);
    console.log('\n=== Pre-Transfer Complete ===');
    console.log('\n   Next steps:');
    console.log('   1. Initiate the app transfer in App Store Connect');
    console.log('   2. Accept the transfer in the new team\'s App Store Connect');
    console.log('   3. Run: npx tsx migrate.ts post-transfer ...\n');

    await app.delete();
}

// ─── Post-Transfer Command ───────────────────────────────────────────────────

async function postTransfer(options: PostTransferOptions): Promise<void> {
    const {
        firebaseCredential,
        appleKey,
        appleKeyId,
        appleTeamId,
        appleClientId,
        targetTeamId,
        dataDir,
        dryRun,
        batchDelay,
    } = options;

    console.log('\n=== SIWA Migration: Post-Transfer ===\n');
    console.log(`  New team:     ${appleTeamId}`);
    console.log(`  Old team:     ${targetTeamId}`);
    console.log(`  Client ID:    ${appleClientId}`);
    console.log(`  Data dir:     ${dataDir}`);
    console.log(`  Dry run:      ${dryRun}`);
    console.log(`  Batch delay:  ${batchDelay}ms\n`);

    ensureDataDir(dataDir);

    // 1. Load transfer IDs from pre-transfer step
    console.log('1. Loading transfer identifiers...');

    const transferRecords = readJson<TransferIdRecord[]>(dataDir, FILES.transferIds);

    console.log(`   Loaded ${transferRecords.length} record(s)`);

    if (transferRecords.length === 0) {
        console.log('\n   No records to process. Done.');
        return;
    }

    // 2. Generate Apple client secret with NEW team's key
    console.log('2. Generating Apple client secret JWT (new team)...');
    const privateKey = readAppleKey(appleKey);

    const clientSecret = generateAppleClientSecret(
        appleTeamId,
        appleKeyId,
        appleClientId,
        privateKey
    );

    // 3. Exchange transfer_sub for new sub
    console.log('3. Exchanging transfer identifiers for new subs...\n');

    const finalMapping: FinalMappingRecord[] = [];
    let exchangeSuccessCount = 0;
    let exchangeFailCount = 0;

    for (let i = 0; i < transferRecords.length; i++) {
        const record = transferRecords[i]!;

        try {
            const newAppleSub = await exchangeTransferSub(
                record.transferSub,
                targetTeamId,
                appleClientId,
                clientSecret
            );

            finalMapping.push({
                ...record,
                newAppleSub,
            });

            exchangeSuccessCount++;

            console.log(`   [${i + 1}/${transferRecords.length}] ${record.firebaseUid} — OK (${record.oldAppleSub.slice(0, 12)}... → ${newAppleSub.slice(0, 12)}...)`);
        } catch (error) {
            exchangeFailCount++;

            const message = error instanceof Error ? error.message : String(error);

            console.error(`   [${i + 1}/${transferRecords.length}] ${record.firebaseUid} — FAILED: ${message}`);
        }

        if (i < transferRecords.length - 1) {
            await sleep(500);
        }
    }

    writeJson(dataDir, FILES.finalMapping, finalMapping);

    console.log(`\n   Exchange complete: ${exchangeSuccessCount} succeeded, ${exchangeFailCount} failed`);

    if (finalMapping.length === 0) {
        console.log('\n   No mappings to migrate. Done.');
        return;
    }

    // 4. Migrate Firebase Auth records
    if (dryRun) {
        console.log('\n4. DRY RUN — would migrate the following users:\n');
        console.log('   Firebase UID                    | Old Apple Sub          | New Apple Sub');
        console.log('   ' + '-'.repeat(90));

        for (const record of finalMapping) {
            console.log(`   ${record.firebaseUid.padEnd(34)} | ${record.oldAppleSub.slice(0, 22).padEnd(22)} | ${record.newAppleSub.slice(0, 22)}`);
        }

        console.log(`\n   Total: ${finalMapping.length} user(s) would be migrated`);
        console.log('   Re-run without --dry-run to execute the migration.\n');
        return;
    }

    console.log('\n4. Migrating Firebase Auth records...\n');

    const app = initFirebase(firebaseCredential);
    const migrationLog: MigrationLogEntry[] = [];

    let migrateSuccessCount = 0;
    let migrateFailCount = 0;
    let migrateSkipCount = 0;

    for (let i = 0; i < finalMapping.length; i++) {
        const record = finalMapping[i]!;
        const timestamp = new Date().toISOString();

        try {
            // Check if already migrated (idempotency)
            const currentUser = await app.auth().getUser(record.firebaseUid);
            const currentAppleProvider = currentUser.providerData.find(p => p.providerId === 'apple.com');

            if (currentAppleProvider?.uid === record.newAppleSub) {
                migrateSkipCount++;

                console.log(`   [${i + 1}/${finalMapping.length}] ${record.firebaseUid} — SKIPPED (already migrated)`);

                migrationLog.push({
                    firebaseUid: record.firebaseUid,
                    oldAppleSub: record.oldAppleSub,
                    newAppleSub: record.newAppleSub,
                    status: 'skipped',
                    timestamp,
                });

                continue;
            }

            await migrateUser(app, record.firebaseUid, record.newAppleSub);

            migrateSuccessCount++;

            console.log(`   [${i + 1}/${finalMapping.length}] ${record.firebaseUid} — OK`);

            migrationLog.push({
                firebaseUid: record.firebaseUid,
                oldAppleSub: record.oldAppleSub,
                newAppleSub: record.newAppleSub,
                status: 'success',
                timestamp,
            });
        } catch (error) {
            migrateFailCount++;

            const message = error instanceof Error ? error.message : String(error);

            console.error(`   [${i + 1}/${finalMapping.length}] ${record.firebaseUid} — FAILED: ${message}`);

            migrationLog.push({
                firebaseUid: record.firebaseUid,
                oldAppleSub: record.oldAppleSub,
                newAppleSub: record.newAppleSub,
                status: 'failed',
                error: message,
                timestamp,
            });
        }

        if (i < finalMapping.length - 1) {
            await sleep(batchDelay);
        }
    }

    writeJson(dataDir, FILES.migrationLog, migrationLog);

    console.log(`\n   Migration complete: ${migrateSuccessCount} succeeded, ${migrateFailCount} failed, ${migrateSkipCount} skipped`);

    if (migrateFailCount > 0) {
        console.log(`\n   ⚠️  ${migrateFailCount} user(s) failed to migrate.`);
        console.log('   Check migration-log.json for details.');
        console.log('   You can re-run this command safely — already-migrated users will be skipped.');
    }

    console.log('\n=== Post-Transfer Complete ===\n');

    await app.delete();
}

// ─── Validate Command ────────────────────────────────────────────────────────

interface ValidateOptions {
    firebaseCredential: string;
    dataDir: string;
}

async function validate(options: ValidateOptions): Promise<void> {
    const { firebaseCredential, dataDir } = options;

    console.log('\n=== SIWA Migration: Validate ===\n');

    // 1. Load final mapping
    console.log('1. Loading final mapping...');

    const finalMapping = readJson<FinalMappingRecord[]>(dataDir, FILES.finalMapping);

    console.log(`   Loaded ${finalMapping.length} record(s)`);

    if (finalMapping.length === 0) {
        console.log('\n   No records to validate. Done.');
        return;
    }

    // 2. Connect to Firebase
    console.log('2. Connecting to Firebase...\n');
    const app = initFirebase(firebaseCredential);

    // 3. Check each user
    let okCount = 0;
    let mismatchCount = 0;
    let missingCount = 0;
    let noProviderCount = 0;

    for (let i = 0; i < finalMapping.length; i++) {
        const record = finalMapping[i]!;

        try {
            const user = await app.auth().getUser(record.firebaseUid);
            const appleProvider = user.providerData.find(p => p.providerId === 'apple.com');

            if (!appleProvider) {
                noProviderCount++;
                console.log(`   [${i + 1}/${finalMapping.length}] ${record.firebaseUid} — NO APPLE PROVIDER (user exists but apple.com link is missing)`);
            } else if (appleProvider.uid === record.newAppleSub) {
                okCount++;
                console.log(`   [${i + 1}/${finalMapping.length}] ${record.firebaseUid} — OK`);
            } else if (appleProvider.uid === record.oldAppleSub) {
                mismatchCount++;
                console.log(`   [${i + 1}/${finalMapping.length}] ${record.firebaseUid} — NOT MIGRATED (still has old sub)`);
            } else {
                mismatchCount++;
                console.log(`   [${i + 1}/${finalMapping.length}] ${record.firebaseUid} — MISMATCH (expected ${record.newAppleSub.slice(0, 12)}..., got ${appleProvider.uid.slice(0, 12)}...)`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            if (message.includes('no user record')) {
                missingCount++;
                console.log(`   [${i + 1}/${finalMapping.length}] ${record.firebaseUid} — MISSING (user does not exist in Firebase)`);
            } else {
                missingCount++;
                console.error(`   [${i + 1}/${finalMapping.length}] ${record.firebaseUid} — ERROR: ${message}`);
            }
        }
    }

    console.log('\n   Results:');
    console.log(`     OK:            ${okCount}`);
    console.log(`     Not migrated:  ${mismatchCount}`);
    console.log(`     No provider:   ${noProviderCount}`);
    console.log(`     Missing:       ${missingCount}`);
    console.log(`     Total:         ${finalMapping.length}`);

    const allGood = mismatchCount === 0 && missingCount === 0 && noProviderCount === 0;

    if (allGood) {
        console.log('\n   ✅ All users migrated successfully.\n');
    } else {
        console.log('\n   ⚠️  Some users have issues. Review the output above.\n');
    }

    await app.delete();

    process.exit(allGood ? 0 : 1);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const program = new Command();

program
    .name('siwa-migration')
    .description('Sign in with Apple migration for LearnCard app transfer')
    .version('1.0.0');

program
    .command('pre-transfer')
    .description('Export Apple users from Firebase and generate transfer identifiers (run BEFORE app transfer)')
    .requiredOption('--firebase-credential <path>', 'Path to Firebase service account JSON')
    .requiredOption('--apple-key <path>', 'Path to old team SIWA private key (.p8)')
    .requiredOption('--apple-key-id <id>', 'Old team SIWA key ID')
    .requiredOption('--apple-team-id <id>', 'Old team Apple Team ID (e.g. AW9L6U5B2L)')
    .requiredOption('--apple-client-id <id>', 'App bundle ID (e.g. com.learncard.app)')
    .requiredOption('--target-team-id <id>', 'New team Apple Team ID (e.g. 5JB5D53PRR)')
    .option('--data-dir <path>', 'Directory for migration data files', './migration-data')
    .action(async (opts) => {
        try {
            await preTransfer({
                firebaseCredential: opts.firebaseCredential,
                appleKey: opts.appleKey,
                appleKeyId: opts.appleKeyId,
                appleTeamId: opts.appleTeamId,
                appleClientId: opts.appleClientId,
                targetTeamId: opts.targetTeamId,
                dataDir: opts.dataDir,
            });
        } catch (error) {
            console.error('\n❌ Pre-transfer failed:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program
    .command('post-transfer')
    .description('Exchange transfer IDs for new subs and migrate Firebase Auth (run AFTER app transfer)')
    .requiredOption('--firebase-credential <path>', 'Path to Firebase service account JSON')
    .requiredOption('--apple-key <path>', 'Path to new team SIWA private key (.p8)')
    .requiredOption('--apple-key-id <id>', 'New team SIWA key ID')
    .requiredOption('--apple-team-id <id>', 'New team Apple Team ID (e.g. 5JB5D53PRR)')
    .requiredOption('--apple-client-id <id>', 'App bundle ID (e.g. com.learncard.app)')
    .requiredOption('--target-team-id <id>', 'Old team Apple Team ID (e.g. AW9L6U5B2L)')
    .option('--data-dir <path>', 'Directory for migration data files', './migration-data')
    .option('--dry-run', 'Preview changes without modifying Firebase', false)
    .option('--batch-delay <ms>', 'Delay between Firebase operations in ms', '200')
    .action(async (opts) => {
        try {
            await postTransfer({
                firebaseCredential: opts.firebaseCredential,
                appleKey: opts.appleKey,
                appleKeyId: opts.appleKeyId,
                appleTeamId: opts.appleTeamId,
                appleClientId: opts.appleClientId,
                targetTeamId: opts.targetTeamId,
                dataDir: opts.dataDir,
                dryRun: opts.dryRun,
                batchDelay: parseInt(opts.batchDelay, 10),
            });
        } catch (error) {
            console.error('\n❌ Post-transfer failed:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program
    .command('validate')
    .description('Verify that all users were migrated correctly (read-only, safe to run anytime after post-transfer)')
    .requiredOption('--firebase-credential <path>', 'Path to Firebase service account JSON')
    .option('--data-dir <path>', 'Directory for migration data files', './migration-data')
    .action(async (opts) => {
        try {
            await validate({
                firebaseCredential: opts.firebaseCredential,
                dataDir: opts.dataDir,
            });
        } catch (error) {
            console.error('\n❌ Validation failed:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program.parse();
