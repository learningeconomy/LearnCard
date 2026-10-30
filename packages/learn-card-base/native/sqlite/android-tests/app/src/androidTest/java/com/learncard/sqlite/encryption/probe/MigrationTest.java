package com.learncard.sqlite.encryption.probe;

import static org.junit.Assert.*;
import android.content.Context;
import android.database.Cursor;
import android.os.Bundle;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import com.getcapacitor.JSArray;
import com.getcapacitor.community.database.sqlite.CapacitorSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.LearnCardEncryptedDatabase;
import com.getcapacitor.community.database.sqlite.SQLite.SqliteConfig;
import java.io.File;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collections;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import net.zetetic.database.sqlcipher.SQLiteDatabase;

/** Disposable app data only. No LearnCard/ScoutPass package or database is accessed. */
@RunWith(AndroidJUnit4.class)
public class MigrationTest {
    private final Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
    private static class Secrets implements LearnCardEncryptedDatabase.Secrets {
        String secret = "";
        public String read() { return secret; }
        public void write(String next) { secret = next; }
    }
    private File file(String name) {
        File file = context.getDatabasePath("synthetic-" + name + "-" + System.nanoTime() + ".db");
        file.getParentFile().mkdirs();
        return file;
    }
    private void seed(File file) {
        System.loadLibrary("sqlcipher");
        try (SQLiteDatabase db = SQLiteDatabase.openOrCreateDatabase(file, "", null, null)) {
            db.rawExecSQL("CREATE TABLE users(uid TEXT PRIMARY KEY, privateKey TEXT)");
            db.rawExecSQL("CREATE TABLE sss_shares(id TEXT PRIMARY KEY, share TEXT)");
            db.rawExecSQL("CREATE TABLE reactQuery(id TEXT PRIMARY KEY, cache TEXT)");
            db.rawExecSQL("INSERT INTO users VALUES ('synthetic', 'SYNTHETIC_PRIVATE_KEY')");
            db.rawExecSQL("INSERT INTO sss_shares VALUES ('device','SYNTHETIC_DEVICE_SHARE'),('device:version','7'),('pending','SYNTHETIC_RESUME_TOKEN')");
            db.rawExecSQL("PRAGMA user_version=7");
        }
    }
    private void check(File file, String secret) {
        try (SQLiteDatabase db = SQLiteDatabase.openDatabase(file.getPath(), secret, null, SQLiteDatabase.OPEN_READONLY, null)) {
            assertEquals(7, db.getVersion());
            try (Cursor rows = db.rawQuery("SELECT share FROM sss_shares WHERE id='pending'", null)) {
                assertTrue(rows.moveToFirst());
                assertEquals("SYNTHETIC_RESUME_TOKEN", rows.getString(0));
            }
        }
    }
    private byte[] damageCache(File file, String secret) throws Exception {
        int page, pageSize;
        try (SQLiteDatabase db = SQLiteDatabase.openDatabase(file.getPath(), secret, null, SQLiteDatabase.OPEN_READONLY, null)) {
            try (Cursor rows = db.rawQuery("SELECT rootpage FROM sqlite_master WHERE name='reactQuery'", null)) {
                assertTrue(rows.moveToFirst()); page = rows.getInt(0);
            }
            try (Cursor rows = db.rawQuery("PRAGMA cipher_page_size", null)) {
                assertTrue(rows.moveToFirst()); pageSize = rows.getInt(0);
            }
        }
        assertTrue(page > 1 && pageSize > 0);
        try (RandomAccessFile bytes = new RandomAccessFile(file, "rw")) {
            long offset = (long) (page - 1) * pageSize + 128;
            bytes.seek(offset); int value = bytes.read();
            bytes.seek(offset); bytes.write(value ^ 1);
        }
        return Files.readAllBytes(file.toPath());
    }
    @Test public void migrationPreservesDataAndRetries() throws Exception {
        File file = file("migration"); seed(file); Secrets secrets = new Secrets();
        assertTrue(LearnCardEncryptedDatabase.prepare(file, secrets));
        check(file, secrets.secret);
        assertFalse(LearnCardEncryptedDatabase.prepare(file, secrets));
        assertFalse(new String(Files.readAllBytes(file.toPath()), java.nio.charset.StandardCharsets.ISO_8859_1).contains("SYNTHETIC_PRIVATE_KEY"));
    }
    @Test public void failureBeforeReplacementPreservesOriginal() throws Exception {
        File file = file("before"); seed(file); Secrets secrets = new Secrets();
        try {
            LearnCardEncryptedDatabase.prepare(file, secrets, point -> { if (point.equals("before-replace")) throw new Exception("Synthetic failure"); });
            fail("Expected failure");
        } catch (Exception expected) { check(file, ""); }
        assertTrue(LearnCardEncryptedDatabase.prepare(file, secrets));
        check(file, secrets.secret);
    }
    @Test public void failureAfterReplacementCanReopen() throws Exception {
        File file = file("after"); seed(file); Secrets secrets = new Secrets();
        try {
            LearnCardEncryptedDatabase.prepare(file, secrets, point -> { if (point.equals("after-replace")) throw new Exception("Synthetic failure"); });
            fail("Expected failure");
        } catch (Exception expected) { check(file, secrets.secret); }
        assertFalse(LearnCardEncryptedDatabase.prepare(file, secrets));
    }
    @Test public void missingSecretNeverReplacesEncryptedData() throws Exception {
        File file = file("missing"); seed(file); Secrets secrets = new Secrets();
        LearnCardEncryptedDatabase.prepare(file, secrets);
        byte[] bytes = Files.readAllBytes(file.toPath());
        secrets.secret = "";
        try { LearnCardEncryptedDatabase.prepare(file, secrets); fail("Expected failure"); }
        catch (Exception expected) { assertArrayEquals(bytes, Files.readAllBytes(file.toPath())); }
        assertEquals("", secrets.secret);
    }
    @Test public void existingEncryptedPreparationDoesNotScanDisposableCache() throws Exception {
        File file = file("cache-corrupt"); seed(file); Secrets secrets = new Secrets();
        LearnCardEncryptedDatabase.prepare(file, secrets);
        byte[] damaged = damageCache(file, secrets.secret);
        try { LearnCardEncryptedDatabase.validate(file, secrets.secret); fail("Expected full integrity failure"); }
        catch (Exception expected) { }
        assertFalse(LearnCardEncryptedDatabase.prepare(file, secrets));
        check(file, secrets.secret);
        assertArrayEquals(damaged, Files.readAllBytes(file.toPath()));
    }
    @Test public void fullStagingValidationStillPreservesOriginal() throws Exception {
        File file = file("staging-corrupt"); seed(file); Secrets secrets = new Secrets();
        byte[] original = Files.readAllBytes(file.toPath());
        try {
            LearnCardEncryptedDatabase.prepare(file, secrets, point -> {
                if (point.equals("before-validate")) damageCache(new File(file + ".encryption.tmp"), secrets.secret);
            });
            fail("Expected staged integrity failure");
        } catch (Exception expected) { }
        assertArrayEquals(original, Files.readAllBytes(file.toPath()));
        check(file, "");
        assertFalse(new File(file + ".encryption.tmp").exists());
    }
    @Test public void existingWrongKeyFailsOnUseWithoutReplacement() throws Exception {
        File file = file("wrong-key"); seed(file); Secrets secrets = new Secrets();
        LearnCardEncryptedDatabase.prepare(file, secrets);
        byte[] original = Files.readAllBytes(file.toPath());
        secrets.secret = "WRONG_SYNTHETIC_SECRET";
        assertFalse(LearnCardEncryptedDatabase.prepare(file, secrets));
        try { check(file, secrets.secret); fail("Expected keyed-open failure"); }
        catch (Exception expected) { }
        assertArrayEquals(original, Files.readAllBytes(file.toPath()));
    }
    @Test public void zeroByteFilesProvisionButShortFilesRemainIntact() throws Exception {
        File empty = file("empty"); assertTrue(empty.createNewFile()); Secrets fresh = new Secrets();
        assertFalse(LearnCardEncryptedDatabase.prepare(empty, fresh));
        LearnCardEncryptedDatabase.validate(empty, fresh.secret);
        File shortFile = file("short"); byte[] original = "SYNTHETIC".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        Files.write(shortFile.toPath(), original); Secrets missing = new Secrets();
        try { LearnCardEncryptedDatabase.prepare(shortFile, missing); fail("Expected unreadable-file failure"); }
        catch (Exception expected) { }
        assertArrayEquals(original, Files.readAllBytes(shortFile.toPath()));
        assertEquals("", missing.secret);
    }
    @Test public void emptyFileWithRecoverySidecarIsNotReset() throws Exception {
        File empty = file("empty-wal"); assertTrue(empty.createNewFile()); Secrets secrets = new Secrets();
        File wal = new File(empty + "-wal"); byte[] original = "SYNTHETIC_RECOVERY_WAL".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        Files.write(wal.toPath(), original);
        try { LearnCardEncryptedDatabase.prepare(empty, secrets); fail("Expected recovery-sidecar failure"); }
        catch (Exception expected) { }
        assertEquals(0, empty.length()); assertEquals("", secrets.secret);
        assertArrayEquals(original, Files.readAllBytes(wal.toPath()));
    }
    @Test public void nativePluginUsesProtectedStoreAndEncryptedConnection() throws Exception {
        // This path belongs to the probe applicationId, never com.learncard.app.
        boolean reopen = "reopen".equals(InstrumentationRegistry.getArguments().getString("sqlitePhase"));
        if (!reopen) context.deleteDatabase("learncardDBSQLite.db");
        File file = context.getDatabasePath("learncardDBSQLite.db");
        if (!reopen) seed(file);
        else assertTrue(file.isFile());
        SqliteConfig config = new SqliteConfig(); config.setIsEncryption(true);
        CapacitorSQLite plugin = new CapacitorSQLite(context, config);
        assertEquals(!reopen, plugin.prepareEncryptedDatabase("learncardDB"));
        assertTrue(plugin.isSecretStored());
        plugin.createConnection("learncardDB", true, "secret", 1, new java.util.Hashtable<>(), false);
        plugin.open("learncardDB", false);
        assertFalse(plugin.prepareEncryptedDatabase("learncardDB")); // live native connection / JS reload
        assertEquals("SYNTHETIC_PRIVATE_KEY", plugin.query("learncardDB", "SELECT privateKey FROM users", new JSArray(), false).getJSONObject(0).getString("privateKey"));
        plugin.closeConnection("learncardDB", false);
        assertFalse(plugin.prepareEncryptedDatabase("learncardDB"));
    }
    @Test public void measureEngineCosts() throws Exception {
        File plain = file("performance-plain"), encrypted = file("performance-cipher");
        seed(plain); seed(encrypted); Secrets secrets = new Secrets();
        long migrationStart = System.nanoTime();
        LearnCardEncryptedDatabase.prepare(encrypted, secrets);
        JSONObject metrics = new JSONObject().put("migrationMs", elapsed(migrationStart));
        for (int mode = 0; mode < 2; mode++) {
            File file = mode == 0 ? plain : encrypted;
            String key = mode == 0 ? "" : secrets.secret;
            ArrayList<Double> opens = new ArrayList<>(), reads = new ArrayList<>(), writes = new ArrayList<>();
            for (int iteration = 0; iteration < 10; iteration++) {
                long started = System.nanoTime();
                try (SQLiteDatabase db = SQLiteDatabase.openDatabase(file.getPath(), key, null, SQLiteDatabase.OPEN_READWRITE, null)) { db.getVersion(); }
                opens.add(elapsed(started));
            }
            try (SQLiteDatabase db = SQLiteDatabase.openDatabase(file.getPath(), key, null, SQLiteDatabase.OPEN_READWRITE, null)) {
                db.getVersion();
                for (int iteration = 0; iteration < 50; iteration++) {
                    long started = System.nanoTime();
                    try (Cursor rows = db.rawQuery("SELECT privateKey FROM users WHERE uid='synthetic'", null)) { assertTrue(rows.moveToFirst()); }
                    reads.add(elapsed(started));
                }
                db.rawExecSQL("CREATE TABLE snapshots (id INTEGER PRIMARY KEY, payload TEXT)");
                String blob = new String(new char[1024 * 1024]).replace('\0', 's');
                for (int iteration = 0; iteration < 10; iteration++) {
                    long started = System.nanoTime();
                    db.beginTransaction();
                    try { db.execSQL("INSERT OR REPLACE INTO snapshots VALUES (1, ?)", new Object[] {blob}); db.setTransactionSuccessful(); }
                    finally { db.endTransaction(); }
                    writes.add(elapsed(started));
                }
            }
            metrics.put(mode == 0 ? "plaintext" : "encrypted", new JSONObject().put("openFirstReadClose", summary(opens)).put("warmPointRead", summary(reads)).put("oneMiBSnapshotCommit", summary(writes)));
        }
        Bundle output = new Bundle(); output.putString("sqliteSyntheticMetrics", metrics.toString());
        InstrumentationRegistry.getInstrumentation().sendStatus(0, output);
    }
    private static double elapsed(long start) { return (System.nanoTime() - start) / 1_000_000.0; }
    private static JSONObject summary(ArrayList<Double> samples) throws Exception {
        Collections.sort(samples);
        return new JSONObject().put("p50Ms", samples.get(samples.size() / 2)).put("p95Ms", samples.get((int)(samples.size() * .95)));
    }
}
