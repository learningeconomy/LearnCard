package com.getcapacitor.community.database.sqlite.SQLite;

import android.database.Cursor;
import android.system.Os;
import android.system.OsConstants;
import java.io.File;
import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.channels.FileLock;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import net.zetetic.database.sqlcipher.SQLiteDatabase;
import net.zetetic.database.sqlcipher.SQLiteStatement;

/** Native-only, process-locked bootstrap; the original file survives until atomic replacement. */
public final class LearnCardEncryptedDatabase {
    public interface Secrets {
        String read() throws Exception;
        void write(String secret) throws Exception;
    }

    public interface Checkpoint {
        void reached(String point) throws Exception;
    }

    public static boolean prepare(File original, Secrets secrets) throws Exception {
        return prepare(original, secrets, point -> {});
    }

    public static boolean prepare(File original, Secrets secrets, Checkpoint checkpoint) throws Exception {
        System.loadLibrary("sqlcipher");
        File parent = original.getParentFile();
        if (parent == null || (!parent.isDirectory() && !parent.mkdirs())) {
            throw failure("Cannot create account storage");
        }
        // FileChannel.lock serializes processes; the monitor also handles same-JVM callers.
        synchronized (LearnCardEncryptedDatabase.class) {
            try (RandomAccessFile lockFile = new RandomAccessFile(original + ".encryption.lock", "rw");
                 FileLock ignored = lockFile.getChannel().lock()) {
                boolean exists = original.exists();
                if (exists && !original.isFile()) throw failure("Account storage is unreadable");
                // SQLite may leave an empty file on an interrupted first open. It has no data to convert.
                if (exists && original.length() == 0) {
                    for (String suffix : new String[] {"-wal", "-shm", "-journal"}) {
                        if (new File(original + suffix).length() > 0) {
                            throw failure("Empty account storage has recovery sidecars");
                        }
                    }
                }
                exists = exists && original.length() > 0;
                String secret = secrets.read();
                if (secret == null) secret = "";
                if (exists) {
                    byte[] header = new byte[16];
                    try (RandomAccessFile file = new RandomAccessFile(original, "r")) {
                        if (file.read(header) != 16) throw failure("Account storage is unreadable");
                    }
                    if (!Arrays.equals(header, "SQLite format 3\0".getBytes(StandardCharsets.US_ASCII))) {
                        if (secret.isEmpty()) throw failure("Account storage secret is unavailable");
                        // Let the plugin's keyed open authenticate the file. A second open here
                        // repeats SQLCipher's KDF and a full scan blocks healthy account pages on cache damage.
                        return false;
                    }
                    // A killed plaintext writer can leave a hot rollback journal. SQLite must
                    // recover committed state through a writable handle before the integrity scan.
                    // Never delete recovery sidecars ourselves.
                    try (SQLiteDatabase source = open(original, "", false)) {
                        if (!"ok".equals(scalar(source, "PRAGMA integrity_check"))) {
                            throw failure("Account storage integrity check failed");
                        }
                    }
                }
                if (secret.isEmpty()) {
                    byte[] bytes = new byte[32];
                    new SecureRandom().nextBytes(bytes);
                    StringBuilder encoded = new StringBuilder(64);
                    for (byte value : bytes) encoded.append(String.format("%02x", value & 0xff));
                    secret = encoded.toString();
                    secrets.write(secret);
                    if (!secret.equals(secrets.read())) throw failure("Cannot persist account storage secret");
                }
                checkpoint.reached("after-secret");
                File staged = new File(original + ".encryption.tmp");
                clearStaging(staged);
                try {
                    if (exists) {
                        try (SQLiteDatabase source = open(original, "", false)) {
                            if (!"0".equals(scalar(source, "PRAGMA wal_checkpoint(TRUNCATE)"))) {
                                throw failure("Account storage is busy");
                            }
                            if (!"delete".equals(scalar(source, "PRAGMA journal_mode=DELETE"))) {
                                throw failure("Account storage is busy");
                            }
                            String version = scalar(source, "PRAGMA user_version");
                            try (SQLiteStatement attach = source.compileStatement("ATTACH DATABASE ? AS encrypted KEY ?")) {
                                attach.bindString(1, staged.getAbsolutePath());
                                attach.bindString(2, secret);
                                attach.execute();
                            }
                            source.rawExecSQL("PRAGMA encrypted.synchronous=FULL");
                            source.beginTransaction();
                            try {
                                source.rawExecSQL("SELECT sqlcipher_export('encrypted')");
                                source.rawExecSQL("PRAGMA encrypted.user_version=" + version);
                                source.setTransactionSuccessful();
                            } finally {
                                source.endTransaction();
                            }
                            source.rawExecSQL("DETACH DATABASE encrypted");
                        }
                    } else {
                        try (SQLiteDatabase target = open(staged, secret, false)) {
                            target.rawExecSQL("PRAGMA synchronous=FULL");
                            target.rawExecSQL("PRAGMA user_version=1");
                        }
                    }
                    checkpoint.reached("before-validate");
                    validate(staged, secret);
                    Os.chmod(staged.getAbsolutePath(), 0600);
                    try (FileOutputStream file = new FileOutputStream(staged, true)) {
                        file.getFD().sync();
                    }
                    checkpoint.reached("before-replace");
                    // POSIX same-directory replacement; never delete the authoritative DB first.
                    Os.rename(staged.getAbsolutePath(), original.getAbsolutePath());
                    checkpoint.reached("after-replace");
                    FileDescriptor directory = Os.open(parent.getAbsolutePath(), OsConstants.O_RDONLY, 0);
                    try { Os.fsync(directory); } finally { Os.close(directory); }
                    return exists;
                } finally {
                    // Only our encrypted staging file is disposable. Leave the original untouched on failure.
                    clearStaging(staged);
                }
            }
        }
    }

    private static SQLiteDatabase open(File path, String secret, boolean readonly) {
        SQLiteDatabase db = SQLiteDatabase.openDatabase(path.getAbsolutePath(), secret, null,
            readonly ? SQLiteDatabase.OPEN_READONLY : SQLiteDatabase.OPEN_READWRITE | SQLiteDatabase.CREATE_IF_NECESSARY, null);
        db.rawExecSQL("PRAGMA busy_timeout=5000");
        return db;
    }

    private static void clearStaging(File staged) throws IOException {
        for (String suffix : new String[] {"", "-journal", "-wal", "-shm"}) {
            File file = new File(staged + suffix);
            if (file.exists() && !file.delete()) throw failure("Cannot clear account storage staging");
        }
    }

    public static void validate(File path, String secret) throws Exception {
        try (SQLiteDatabase db = open(path, secret, true)) {
            if (!"ok".equals(scalar(db, "PRAGMA integrity_check"))) throw failure("Account storage integrity check failed");
            if (!secret.isEmpty()) {
                try (Cursor rows = db.rawQuery("PRAGMA cipher_integrity_check", null)) {
                    if (rows.moveToFirst()) throw failure("Account storage authentication failed");
                }
            }
        }
    }

    private static String scalar(SQLiteDatabase db, String sql) throws Exception {
        try (Cursor rows = db.rawQuery(sql, null)) {
            if (!rows.moveToFirst()) throw failure("Account storage query failed");
            return rows.getString(0);
        }
    }

    private static IOException failure(String message) { return new IOException(message); }
}
