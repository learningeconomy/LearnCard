import { closeSync, fchmodSync, fsyncSync, openSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';
import { refuse } from './errors';
import { checkDomain, checkPrefix, checkRunId } from './guards';
import { runEmailMatcher, type RunAddress } from './identity';

/**
 * The run manifest: the ONLY source for cleanup. JSON Lines, append-only:
 *
 * - line 1, `{"kind":"run","version":1,runId,prefix,domain,firebaseProject,createdAt}`,
 *   written (exclusive create, mode 0600, fsync) before any Firebase user exists;
 * - `{"kind":"user",uid,email}` after each successful `createUser`, fsynced
 *   before the user is used, so a crash leaves every created-and-recorded uid;
 * - `{"kind":"cleanup",outcome,uids}` progress records written by cleanup.
 *
 * Only uids and the run's synthetic addresses are stored: never keys, PINs,
 * tokens or shares. A torn last line (crash mid-write) is ignored; any other
 * malformed line is refused.
 */
export const MANIFEST_VERSION = 1;

export interface ManifestHeader extends RunAddress {
    firebaseProject: string;
    createdAt: string;
}

export interface Manifest {
    header: ManifestHeader;
    /** Distinct users in creation order. */
    users: { uid: string; email: string }[];
    /** uids a cleanup already deleted or found gone. */
    done: Set<string>;
    /** The last line was incomplete and was ignored. */
    tornTail: boolean;
}

const UID = /^[A-Za-z0-9_-]{1,128}$/;

const line = (record: Record<string, unknown>): Buffer =>
    Buffer.from(`${JSON.stringify(record)}\n`, 'utf8');

const writeDurably = (fd: number, record: Record<string, unknown>): void => {
    const bytes = line(record);
    let offset = 0;
    while (offset < bytes.length) offset += writeSync(fd, bytes, offset);
    fsyncSync(fd);
};

/** Best effort: makes the new directory entry durable too (not supported everywhere). */
const fsyncDirectory = (path: string): void => {
    let fd: number | undefined;
    try {
        fd = openSync(dirname(path), 'r');
        fsyncSync(fd);
    } catch {
        // Some platforms cannot fsync a directory; the file itself is fsynced.
    } finally {
        if (fd !== undefined) closeSync(fd);
    }
};

export interface ManifestWriter {
    /** Durable append (write + fsync). Throws if it cannot be written. */
    user(user: { uid: string; email: string }): void;
    close(): void;
}

/**
 * Creates the manifest exclusively (refuses an existing path) with mode 0600 and
 * durably writes the header. Called before any Firebase user is created.
 */
export const createManifest = (path: string, header: ManifestHeader): ManifestWriter => {
    let fd: number;
    try {
        fd = openSync(path, 'wx', 0o600);
    } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
        throw refuse(code === 'EEXIST' ? 'manifest_exists' : 'manifest_unwritable');
    }
    try {
        fchmodSync(fd, 0o600);
        writeDurably(fd, { kind: 'run', version: MANIFEST_VERSION, ...header });
    } catch {
        closeSync(fd);
        throw refuse('manifest_unwritable');
    }
    fsyncDirectory(path);
    return {
        user: user => writeDurably(fd, { kind: 'user', uid: user.uid, email: user.email }),
        close: () => closeSync(fd),
    };
};

/** Appends cleanup progress to an existing manifest (write + fsync per record). */
export const openManifestProgress = (
    path: string
): { record(outcome: 'deleted' | 'gone', uids: string[]): void; close(): void } => {
    let fd: number;
    try {
        fd = openSync(path, 'a');
    } catch {
        throw refuse('manifest_unwritable');
    }
    return {
        record: (outcome, uids) => writeDurably(fd, { kind: 'cleanup', outcome, uids }),
        close: () => closeSync(fd),
    };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);

const parseHeader = (value: unknown): ManifestHeader => {
    if (
        !isRecord(value) ||
        value.kind !== 'run' ||
        value.version !== MANIFEST_VERSION ||
        typeof value.runId !== 'string' ||
        typeof value.prefix !== 'string' ||
        typeof value.domain !== 'string' ||
        typeof value.firebaseProject !== 'string' ||
        typeof value.createdAt !== 'string'
    )
        throw refuse('manifest_header');
    checkPrefix(value.prefix);
    checkRunId(value.runId);
    const domain = checkDomain(value.domain);
    if (domain !== value.domain) throw refuse('manifest_header');
    return {
        runId: value.runId,
        prefix: value.prefix,
        domain,
        firebaseProject: value.firebaseProject,
        createdAt: value.createdAt,
    };
};

/** Parses and validates a manifest's text. Refuses anything it does not recognise. */
export const parseManifest = (text: string): Manifest => {
    const lines = text.split('\n');
    // A complete file ends with "\n", leaving one empty last element; anything
    // else there is a write torn by a crash.
    const tail = lines.pop() ?? '';
    let tornTail = tail.length > 0;
    const values: unknown[] = [];
    lines.forEach((raw, index) => {
        try {
            values.push(JSON.parse(raw));
        } catch {
            throw refuse(index === 0 ? 'manifest_header' : 'manifest_corrupt');
        }
    });
    if (tornTail) {
        // A complete record that only lost its newline is still usable.
        try {
            values.push(JSON.parse(tail));
            tornTail = false;
        } catch {
            // ignored: the record was never fully written
        }
    }
    if (values.length === 0) throw refuse('manifest_header');
    const header = parseHeader(values[0]);
    const matches = runEmailMatcher(header);
    const users = new Map<string, string>();
    const done = new Set<string>();
    for (const value of values.slice(1)) {
        if (!isRecord(value)) throw refuse('manifest_corrupt');
        if (value.kind === 'user') {
            if (
                typeof value.uid !== 'string' ||
                !UID.test(value.uid) ||
                typeof value.email !== 'string' ||
                !matches(value.email)
            )
                throw refuse('manifest_corrupt');
            if (!users.has(value.uid)) users.set(value.uid, value.email);
        } else if (value.kind === 'cleanup') {
            if (
                (value.outcome !== 'deleted' && value.outcome !== 'gone') ||
                !Array.isArray(value.uids) ||
                !value.uids.every(uid => typeof uid === 'string' && UID.test(uid))
            )
                throw refuse('manifest_corrupt');
            for (const uid of value.uids as string[]) done.add(uid);
        } else throw refuse('manifest_corrupt');
    }
    return {
        header,
        users: [...users].map(([uid, email]) => ({ uid, email })),
        done,
        tornTail,
    };
};
