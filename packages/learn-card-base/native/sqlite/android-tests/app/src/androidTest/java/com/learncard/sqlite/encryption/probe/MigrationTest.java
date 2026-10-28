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
